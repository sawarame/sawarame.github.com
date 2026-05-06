import React, { useState, useRef, useCallback, useEffect } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import {
  Button,
  Stack,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Box,
  Slider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  TextField,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CompareIcon from '@mui/icons-material/Compare';
import CropIcon from '@mui/icons-material/Crop';
import CloseIcon from '@mui/icons-material/Close';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import common from '@site/src/css/common.module.css';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import piexif from 'piexifjs';

// --- Utils ---

function checkWebpSupport(): boolean {
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

function getImageDimensions(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(`${img.naturalWidth} x ${img.naturalHeight}`);
    };
    img.onerror = () => resolve('Unknown');
    img.src = URL.createObjectURL(file);
  });
}

function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

async function preserveExifManually(sourceFile: Blob, targetBlob: Blob): Promise<Blob> {
  try {
    const sourceDataUrl = await readFileAsDataURL(sourceFile);
    const targetDataUrl = await readFileAsDataURL(targetBlob);
    const exifObj = piexif.load(sourceDataUrl);
    const exifStr = piexif.dump(exifObj);
    const newTargetDataUrl = piexif.insert(exifStr, targetDataUrl);
    const response = await fetch(newTargetDataUrl);
    return await response.blob();
  } catch (e) {
    console.warn('EXIF preservation failed:', e);
    return targetBlob;
  }
}

async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, aspect?: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;

  canvas.width = Math.round(sourceWidth);
  canvas.height = aspect ? Math.round(canvas.width / aspect) : Math.round(sourceHeight);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const drawWidth = sourceWidth;
  const drawHeight = aspect ? sourceWidth / aspect : sourceHeight;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    drawWidth,
    drawHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

// --- Types ---

type ImageFormat = 'original' | 'webp' | 'png' | 'jpeg';

interface OptimizationSettings {
  format: ImageFormat;
  quality: number;
  maxWidth: number | undefined;
  preserveExif: boolean;
}

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  displayUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  originalSize: number;
  originalDimensions?: string;
  compressedSize?: number;
  compressedDimensions?: string;
  compressedBlob?: Blob;
  compressedUrl?: string;
  error?: string;
  croppedBlob?: Blob;
  cropAspect?: number;
}

// --- Utils ---

async function resizeToExact(blob: Blob, width: number, height: number, format: string): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(blob);
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = url;
  });
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  URL.revokeObjectURL(url);
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || blob), format);
  });
}
const ASPECT_RATIOS = [
  { label: () => translate({ id: 'resize.crop.aspectFree', message: '自由' }), value: undefined },
  { label: () => '1:1 (Square)', value: 1 },
  { label: () => '8:5 (1.6:1)', value: 1.6 },
  { label: () => '1.91:1 (OGP)', value: 1.91 },
  { label: () => '3:1 (X Header)', value: 3 },
  { label: () => '4:5 (Instagram)', value: 4 / 5 },
  { label: () => '16:9', value: 16 / 9 },
  { label: () => '4:3', value: 4 / 3 },
];

const SNS_PRESETS = [
  { label: translate({ id: 'resize.noLimit', message: '制限なし' }), width: undefined },
  { label: '1920px (Full HD)', width: 1920 },
  { label: '1280px (HD)', width: 1280 },
  { label: '1200px (OGP)', width: 1200 },
  { label: '1080px (Instagram)', width: 1080 },
  { label: '640px (QVGA/nHD)', width: 640 },
];

// --- Sub Components ---

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(72, 198, 239, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(111, 134, 214, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className={common.pageHeaderContent}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🖼️</span>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          margin: '0 0 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #48c6ef 60%, #6f86d6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>{translate({ id: 'resize.header.title', message: '画像軽量化・クロップツール' })}</h1>
        <p className={common.pageHeaderDesc}>
          {translate({ id: 'resize.header.desc', message: 'ブラウザ上で画像をクロップ（切り抜き）し、WebPなどに変換して軽量化します。画像はサーバーに送信されず、すべてブラウザ内で完結するため安全です。' })}
        </p>
      </div>
    </div>
  );
}

function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDraggingSlider) {
      const x = clientX - rect.left;
      const position = (x / rect.width) * 100;
      setSliderPos(Math.min(Math.max(position, 0), 100));
    } else if (isPanning) {
      const dx = clientX - startPos.x;
      const dy = clientY - startPos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPos({ x: clientX, y: clientY });
    }
  }, [isDraggingSlider, isPanning, startPos]);

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const handleX = (sliderPos / 100) * rect.width;
      if (Math.abs(x - handleX) < 20) {
        setIsDraggingSlider(true);
        return;
      }
    }
    
    if (zoom > 1) {
      setIsPanning(true);
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(Math.max(prev + delta, 1), 5));
    }
  };

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2">{translate({ id: 'resize.compare.zoom', message: 'ズーム:' })} {zoom.toFixed(1)}x</Typography>
        <Slider
          value={zoom}
          min={1}
          max={5}
          step={0.1}
          onChange={(_, v) => setZoom(v as number)}
          sx={{ maxWidth: '200px' }}
        />
        <Button size="small" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>{translate({ id: 'resize.compare.reset', message: 'リセット' })}</Button>
      </Stack>

      <Box
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        sx={{
          position: 'relative',
          width: '100%',
          height: '500px',
          overflow: 'hidden',
          borderRadius: '8px',
          cursor: isDraggingSlider ? 'ew-resize' : (zoom > 1 ? 'grab' : 'default'),
          userSelect: 'none',
          backgroundColor: '#f0f0f0',
          backgroundImage: 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }}
      >
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          zIndex: 1
        }}>
          <img src={beforeUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
        
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          pointerEvents: 'none'
        }}>
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}>
            <img src={afterUrl} alt="After" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
        </Box>

        <Box sx={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', zIndex: 3, pointerEvents: 'none' }}>
          {translate({ id: 'resize.compare.after', message: '圧縮後' })}
        </Box>
        <Box sx={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', zIndex: 3, pointerEvents: 'none' }}>
          {translate({ id: 'resize.compare.before', message: 'オリジナル' })}
        </Box>

        <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: '2px', backgroundColor: 'white', zIndex: 4, boxShadow: '0 0 8px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '50%', left: `${sliderPos}%`, transform: 'translate(-50%, -50%)', width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', cursor: 'ew-resize', zIndex: 5 }}>
          <CompareIcon color="primary" />
        </Box>
      </Box>
    </Box>
  );
}

// --- Main Page ---

export default function ImageOptimizer(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [webpSupported, setWebpSupported] = useState(true);
  const [settings, setSettings] = useState<OptimizationSettings>({
    format: 'webp',
    quality: 0.8,
    maxWidth: undefined,
    preserveExif: false,
  });

  useEffect(() => {
    const supported = checkWebpSupport();
    setWebpSupported(supported);
    if (!supported) {
      setSettings(prev => ({ ...prev, format: 'jpeg' }));
    }
  }, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareImages, setCompareImages] = useState<{ before: string, after: string } | null>(null);
  
  const [cropTarget, setCropTarget] = useState<ImageFile | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    const newImagesPromises = filesArray
      .filter(file => file.type.startsWith('image/'))
      .map(async file => {
        const url = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file: file as File,
          previewUrl: url,
          displayUrl: url,
          status: 'pending' as const,
          originalSize: file.size,
          originalDimensions: dimensions,
        };
      });
    
    const newImages = await Promise.all(newImagesPromises);
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        handleFileSelect(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.displayUrl !== target.previewUrl) URL.revokeObjectURL(target.displayUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const processImages = async () => {
    setIsProcessing(true);
    const updatedImages = [...images];
    
    // Check if mobile for stability (disable worker)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    for (let i = 0; i < updatedImages.length; i++) {
      updatedImages[i].status = 'processing';
      setImages([...updatedImages]);

      try {
        const sourceFile = updatedImages[i].croppedBlob || updatedImages[i].file;
        
        if (settings.format === 'webp' && !webpSupported) {
          throw new Error(translate({ id: 'resize.error.webpUnsupported', message: 'お使いのブラウザはWebP変換に対応していません。JPEG形式を選択してください。' }));
        }

        // Dynamic target size based on quality to force compression
        const targetSizeMB = settings.quality * 2; 

        // Calculate maxWidthOrHeight for imageCompression to target width
        let compressionMaxWidthOrHeight = undefined;
        if (settings.maxWidth) {
          const dims = updatedImages[i].originalDimensions || '0 x 0';
          const [origW, origH] = dims.split(' x ').map(Number);
          if (origW > settings.maxWidth) {
            const scale = settings.maxWidth / origW;
            // The longest side should be set such that width becomes settings.maxWidth
            compressionMaxWidthOrHeight = Math.max(settings.maxWidth, Math.round(origH * scale));
          }
        }

        const options = {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: compressionMaxWidthOrHeight,
          useWebWorker: !isMobile,
          initialQuality: settings.quality,
          fileType: settings.format === 'original' ? undefined : `image/${settings.format}`,
          preserveExif: settings.preserveExif,
        };

        let compressedFile = await imageCompression(sourceFile as File, options);

        // Snap to exact dimensions if an aspect ratio was intended and we have a max size
        if (updatedImages[i].cropAspect && settings.maxWidth) {
          const expectedWidth = settings.maxWidth;
          const expectedHeight = Math.round(expectedWidth / updatedImages[i].cropAspect!);
          
          // Check current dimensions
          const currentDims = await getImageDimensions(compressedFile);
          const [curW, curH] = currentDims.split(' x ').map(Number);
          
          // If we are off by a tiny bit, force it to the exact size
          if (curW !== expectedWidth || Math.abs(curH - expectedHeight) <= 2) {
            compressedFile = await resizeToExact(compressedFile, expectedWidth, expectedHeight, `image/${settings.format === 'original' ? updatedImages[i].file.type.split('/')[1] : settings.format}`) as File;
          }
        }

        if (settings.preserveExif && (settings.format === 'jpeg' || (settings.format === 'original' && updatedImages[i].file.type === 'image/jpeg'))) {
          compressedFile = await preserveExifManually(updatedImages[i].file, compressedFile) as File;
        }

        if (updatedImages[i].compressedUrl) {
          URL.revokeObjectURL(updatedImages[i].compressedUrl!);
        }

        const compDimensions = await getImageDimensions(compressedFile);

        updatedImages[i].status = 'completed';
        updatedImages[i].compressedSize = compressedFile.size;
        updatedImages[i].compressedDimensions = compDimensions;
        updatedImages[i].compressedBlob = compressedFile;
        updatedImages[i].compressedUrl = URL.createObjectURL(compressedFile);
      } catch (error) {
        console.error('Compression error:', error);
        updatedImages[i].status = 'error';
        updatedImages[i].error = error instanceof Error ? error.message : translate({ id: 'resize.error.processing', message: '処理失敗' });
        setSnackbar({ open: true, message: `${translate({ id: 'resize.error.prefix', message: 'エラー:' })} ${updatedImages[i].file.name} ${translate({ id: 'resize.error.failed', message: 'の処理に失敗しました。' })}`, severity: 'error' });
      }
      setImages([...updatedImages]);
    }
    setIsProcessing(false);
  };

  const onCropClick = (img: ImageFile) => {
    setCropTarget(img);
    setCrop(undefined);
    setAspect(undefined);
  };

  const onCropComplete = async () => {
    if (!cropTarget || !completedCrop || !imgRef.current) return;
    try {
      const blob = await getCroppedImg(imgRef.current, completedCrop, aspect);
      const url = URL.createObjectURL(blob);
      const dimensions = await getImageDimensions(blob);

      setImages(prev => prev.map(img => {
        if (img.id === cropTarget.id) {
          if (img.displayUrl !== img.previewUrl) URL.revokeObjectURL(img.displayUrl);
          return {
            ...img,
            displayUrl: url,
            croppedBlob: blob,
            status: 'pending',
            originalDimensions: dimensions, // Update original dims to the cropped state
            cropAspect: aspect, // Store the aspect ratio used
            compressedSize: undefined,
            compressedDimensions: undefined,
            compressedUrl: undefined
          };
        }
        return img;
      }));
      setCropTarget(null);
    } catch (e) { console.error(e); }
  };

  const downloadAll = async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.compressedBlob);
    if (completedImages.length === 0) return;
    if (completedImages.length === 1) {
      const img = completedImages[0];
      const link = document.createElement('a');
      link.href = img.compressedUrl!;
      link.download = `opt-${img.file.name.split('.')[0]}.${settings.format === 'original' ? img.file.name.split('.').pop() : settings.format}`;
      link.click();
      return;
    }
    const zip = new JSZip();
    completedImages.forEach(img => {
      const ext = settings.format === 'original' ? img.file.name.split('.').pop() : settings.format;
      zip.file(`${img.file.name.split('.')[0]}.${ext}`, img.compressedBlob!);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'optimized-images.zip';
    link.click();
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout title={`${translate({ id: 'resize.header.title', message: '画像軽量化・クロップツール' })} | ${siteConfig.title}`}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <Stack spacing={4}>
              {/* 1. Upload Section */}
              <div className={common.card}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>📁</span>
                  {translate({ id: 'resize.upload.title', message: '画像を選択' })}
                </h2>
                <Box
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    marginTop: '1rem',
                    padding: '3rem 1rem',
                    border: '2px dashed',
                    borderColor: isDragOver ? 'primary.main' : 'var(--ifm-color-emphasis-300)',
                    borderRadius: '12px',
                    backgroundColor: isDragOver ? 'action.hover' : 'var(--ifm-background-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    textAlign: 'center',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'var(--ifm-color-emphasis-500)', marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--ifm-color-emphasis-800)' }}>
                    {translate({ id: 'resize.upload.dropLabel', message: 'クリック・ドラッグ＆ドロップ、または貼り付けで選択' })}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)' }}>
                    {translate({ id: 'resize.upload.formats', message: '対応フォーマット: JPEG, PNG, WebPなど（Command/Ctrl+Vでの貼り付けも可能）' })}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </Box>
              </div>

              {/* 2. Image List & Settings (Only visible after upload) */}
              {images.length > 0 && (
                <>
                  <Stack spacing={2}>
                    {images.map((img) => (
                      <Card key={img.id} sx={{ borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)' }} elevation={0}>
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          spacing={{ xs: 1, sm: 3 }} 
                          sx={{ p: 2, alignItems: { xs: 'stretch', sm: 'center' } }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, minWidth: 0 }}>
                            <img src={img.displayUrl} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '8px' }} />
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{img.file.name}</Typography>
                              <Stack spacing={0}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography variant="caption" color="text.secondary">{formatSize(img.originalSize)}</Typography>
                                  {img.compressedSize && (
                                    <Typography variant="caption" color="success.main" fontWeight={700}>→ {formatSize(img.compressedSize)}</Typography>
                                  )}
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{img.originalDimensions || '---'}</Typography>
                                  {img.compressedDimensions && (
                                    <Typography variant="caption" color="success.main" fontWeight={600} sx={{ fontSize: '0.7rem' }}>→ {img.compressedDimensions}</Typography>
                                  )}
                                </Stack>
                              </Stack>
                            </Box>
                          </Box>

                          <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: '1px solid var(--ifm-color-emphasis-100)' }}>
                            <Button size="small" startIcon={<CropIcon />} onClick={() => onCropClick(img)}>クロップ</Button>
                            {img.status === 'completed' && (
                              <Button size="small" startIcon={<CompareIcon />} color="info" onClick={() => setCompareImages({ before: img.displayUrl, after: img.compressedUrl! })}>比較</Button>
                            )}
                            <IconButton size="small" color="error" onClick={() => removeImage(img.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            <Tooltip title={translate({ id: 'resize.action.crop', message: 'クロップ' })}>
                              <IconButton onClick={() => onCropClick(img)} color="primary"><CropIcon /></IconButton>
                            </Tooltip>
                            {img.status === 'completed' && (
                              <Tooltip title={translate({ id: 'resize.compare.label', message: 'Before/After 比較' })}>
                                <IconButton onClick={() => setCompareImages({ before: img.displayUrl, after: img.compressedUrl! })} color="info"><CompareIcon /></IconButton>
                              </Tooltip>
                            )}
                            <IconButton color="error" onClick={() => removeImage(img.id)}><DeleteIcon /></IconButton>
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>

                  {/* 3. Settings Section */}
                  <Card sx={{ borderRadius: '16px', border: '1px solid var(--ifm-color-emphasis-200)', bgcolor: 'rgba(0,0,0,0.01)' }} elevation={0}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>⚙️ {translate({ id: 'resize.settings.title', message: '最適化設定' })}</Typography>
                      <Grid2 container spacing={4} sx={{ mt: 1 }}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>{translate({ id: 'resize.settings.format', message: '出力フォーマット' })}</InputLabel>
                            <Select 
                              value={settings.format} 
                              label={translate({ id: 'resize.settings.format', message: '出力フォーマット' })} 
                              onChange={(e) => setSettings({ ...settings, format: e.target.value as ImageFormat })}
                            >
                              <MenuItem value="original">{translate({ id: 'resize.format.original', message: 'オリジナル' })}</MenuItem>
                              <MenuItem value="webp" disabled={!webpSupported}>
                                WebP {webpSupported ? translate({ id: 'resize.format.recommended', message: '(推奨)' }) : translate({ id: 'resize.format.webpUnsupported', message: '(非対応のブラウザです)' })}
                              </MenuItem>
                              <MenuItem value="jpeg">JPEG</MenuItem>
                              <MenuItem value="png">PNG</MenuItem>
                            </Select>
                            {!webpSupported && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                {translate({ id: 'resize.format.webpWarning', message: '※お使いのブラウザはWebP変換に未対応のため、JPEGを推奨します。' })}
                              </Typography>
                            )}
                          </FormControl>                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={SNS_PRESETS}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              return option.label;
                            }}
                            value={SNS_PRESETS.find(p => p.width === settings.maxWidth && p.width !== undefined) || (settings.maxWidth ? settings.maxWidth.toString() : translate({ id: 'resize.noLimit', message: '制限なし' }))}
                            onInputChange={(event, newValue) => {
                              const noLimit = translate({ id: 'resize.noLimit', message: '制限なし' });
                              if (newValue === noLimit || newValue === '') {
                                setSettings({ ...settings, maxWidth: undefined });
                              } else {
                                const num = parseInt(newValue.replace(/[^0-9]/g, ''), 10);
                                if (!isNaN(num)) {
                                  setSettings({ ...settings, maxWidth: num });
                                }
                              }
                            }}
                            onChange={(event, newValue) => {
                              const noLimit = translate({ id: 'resize.noLimit', message: '制限なし' });
                              if (newValue && typeof newValue === 'object') {
                                setSettings({ ...settings, maxWidth: newValue.width });
                              } else if (newValue === noLimit || !newValue) {
                                setSettings({ ...settings, maxWidth: undefined });
                              }
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label={translate({ id: 'resize.settings.maxWidth', message: '最大幅 (px)' })} placeholder={translate({ id: 'resize.settings.maxWidthPlaceholder', message: '数値(px)を入力' })} />
                            )}
                          />
                        </Grid2>                        <Grid2 size={12}>
                          <Box sx={{ px: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>{translate({ id: 'resize.settings.quality', message: '画質:' })} {Math.round(settings.quality * 100)}%</Typography>
                            <Slider value={settings.quality} min={0.1} max={1.0} step={0.05} onChange={(_, v) => setSettings({ ...settings, quality: v as number })} />
                          </Box>
                        </Grid2>
                        <Grid2 size={12}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={settings.preserveExif && (settings.format === 'jpeg' || (settings.format === 'original' && images.length > 0 && images[0].file.type === 'image/jpeg'))}
                                disabled={settings.format === 'webp' || settings.format === 'png'}
                                onChange={(e) => setSettings({ ...settings, preserveExif: e.target.checked })}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Tooltip title={(settings.format === 'webp' || settings.format === 'png') ? translate({ id: 'resize.exif.webpNote', message: 'WebP/PNG形式への変換時は、ブラウザの制限によりEXIF情報を保持できません。' }) : ""}>
                                  <Typography variant="body2" sx={{ color: (settings.format === 'webp' || settings.format === 'png') ? 'text.disabled' : 'text.primary', cursor: (settings.format === 'webp' || settings.format === 'png') ? 'help' : 'default' }}>
                                    {translate({ id: 'resize.settings.preserveExif', message: 'EXIF情報を保持する (JPEGのみ)' })}
                                  </Typography>
                                </Tooltip>
                              </Box>
                            }
                          />                        </Grid2>
                      </Grid2>
                    </CardContent>
                  </Card>

                  {/* 4. Action Buttons */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      size="large" 
                      onClick={processImages} 
                      disabled={images.length === 0 || isProcessing} 
                      sx={{ borderRadius: '12px', py: 2, fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}
                    >
                      {isProcessing ? <CircularProgress size={28} color="inherit" /> : translate({ id: 'resize.action.start', message: '最適化を開始' })}
                    </Button>
                    {images.some(img => img.status === 'completed') && (
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        size="large"
                        startIcon={<DownloadIcon />} 
                        onClick={downloadAll} 
                        sx={{ borderRadius: '12px', py: 2, fontWeight: 800, fontSize: '1.1rem' }}
                      >
                        {translate({ id: 'common.download', message: 'ダウンロード' })}
                      </Button>
                    )}
                  </Stack>
                </>
              )}

              {/* 使い方の説明 */}
              <div className={common.guideCard}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>📖</span>
                  {translate({ id: 'resize.guide.title', message: '使い方' })}
                </h2>
                <ol className={common.guideList}>
                  <li>{translate({ id: 'resize.guide.step1', message: '軽量化したい画像ファイルをドラッグ＆ドロップ、またはクリックして選択します（複数選択対応）。' })}</li>
                  <li>{translate({ id: 'resize.guide.step2', message: '必要に応じて、「クロップ」ボタンから画像の切り抜きを行えます。' })}</li>
                  <li>{translate({ id: 'resize.guide.step3', message: '「最適化設定」から、出力フォーマット（WebP推奨）、最大幅、画質などを調整します。' })}</li>
                  <li>{translate({ id: 'resize.guide.step4', message: '「最適化を開始」をクリックすると、ブラウザ内で変換処理が実行されます。' })}</li>
                  <li>{translate({ id: 'resize.guide.step5', message: '処理完了後、「比較」ボタンで画質を確認し、「ダウンロード」から画像を保存してください。' })}</li>
                </ol>
                <div className={common.securityBox}>
                  {translate({ id: 'resize.guide.security', message: '🔒 画像の軽量化やクロップ処理はすべてお使いの端末（ブラウザ内 ）で実行され、外部サーバーにデータが送信されることは一切ありません。' })}
                </div>
              </div>

            </Stack>

          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={!!cropTarget} onClose={() => setCropTarget(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>{translate({ id: 'resize.crop.title', message: '画像をクロップ' })}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>{translate({ id: 'resize.crop.aspect', message: '比率を選択:' })}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {ASPECT_RATIOS.map(r => (
                  <Button key={r.value !== undefined ? r.value : 'free'} size="small" variant={aspect === r.value ? 'contained' : 'outlined'} sx={{ borderRadius: '20px', mb: 1 }} onClick={() => {
                    setAspect(r.value);
                    if (r.value && imgRef.current) {
                      setCrop(centerAspectCrop(imgRef.current.width, imgRef.current.height, r.value));
                    }
                  }}>
                    {typeof r.label === 'function' ? r.label() : r.label}
                  </Button>
                ))}
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', p: 1 }}>
              {cropTarget && (
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect}>
                  <img ref={imgRef} src={cropTarget.previewUrl} style={{ maxHeight: '60vh' }} onLoad={(e) => {
                    if (aspect) setCrop(centerAspectCrop(e.currentTarget.width, e.currentTarget.height, aspect));
                  }} />
                </ReactCrop>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCropTarget(null)}>{translate({ id: 'common.cancel', message: 'キャンセル' })}</Button>
            <Button onClick={onCropComplete} variant="contained" sx={{ borderRadius: '10px', px: 4 }}>{translate({ id: 'resize.crop.apply', message: '決定' })}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!compareImages} onClose={() => setCompareImages(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
            {translate({ id: 'resize.compare.dialogTitle', message: '比較プレビュー' })}
            <IconButton onClick={() => setCompareImages(null)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ pb: 4 }}>
            {compareImages && <BeforeAfterSlider beforeUrl={compareImages.before} afterUrl={compareImages.after} />}
          </DialogContent>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
        </Snackbar>
      </MuiTheme>
    </Layout>
  );
}
