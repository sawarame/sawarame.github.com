import React, { useState, useRef, useCallback, useEffect } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
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
  Grid,
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
  maxWidthOrHeight: number | undefined;
  preserveExif: boolean;
}

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  displayUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  compressedUrl?: string;
  error?: string;
  croppedBlob?: Blob;
}
const ASPECT_RATIOS = [
  { label: '自由', value: undefined },
  { label: '1:1 (正方形)', value: 1 },
  { label: '8:5 (1.6:1)', value: 1.6 },
  { label: '1.91:1 (OGP)', value: 1.91 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:1 (X ヘッダー)', value: 3 },
  { label: '4:5 (Instagram)', value: 4 / 5 },
  { label: '4:3', value: 4 / 3 },
];

const SNS_PRESETS = [
  { label: '制限なし', width: undefined },
  { label: '1280px (8:5等)', width: 1280 },
  { label: '640px (8:5等)', width: 640 },
  { label: 'OGP (1200px)', width: 1200 },
  { label: 'Instagram (1080px)', width: 1080 },
  { label: 'Full HD (1920px)', width: 1920 },
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
        }}>画像軽量化・クロップツール</h1>
        <p className={common.pageHeaderDesc}>
          ブラウザ上で画像をクロップ（切り抜き）し、WebPなどに変換して軽量化します。画像はサーバーに送信されず、すべてブラウザ内で完結するため安全です。
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
        <Typography variant="body2">ズーム: {zoom.toFixed(1)}x</Typography>
        <Slider
          value={zoom}
          min={1}
          max={5}
          step={0.1}
          onChange={(_, v) => setZoom(v as number)}
          sx={{ maxWidth: '200px' }}
        />
        <Button size="small" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>リセット</Button>
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
          圧縮後
        </Box>
        <Box sx={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', zIndex: 3, pointerEvents: 'none' }}>
          オリジナル
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
  const [settings, setSettings] = useState<OptimizationSettings>({
    format: 'webp',
    quality: 0.8,
    maxWidthOrHeight: undefined,
    preserveExif: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareImages, setCompareImages] = useState<{ before: string, after: string } | null>(null);
  
  const [cropTarget, setCropTarget] = useState<ImageFile | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => {
        const url = URL.createObjectURL(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: url,
          displayUrl: url,
          status: 'pending',
          originalSize: file.size,
        };
      });
    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

    for (let i = 0; i < updatedImages.length; i++) {
      // Always process or re-process
      updatedImages[i].status = 'processing';
      setImages([...updatedImages]);

      try {
        const sourceFile = updatedImages[i].croppedBlob || updatedImages[i].file;
        const options = {
          maxSizeMB: 10,
          maxWidthOrHeight: settings.maxWidthOrHeight,
          useWebWorker: true,
          initialQuality: settings.quality,
          fileType: settings.format === 'original' ? undefined : `image/${settings.format}`,
          preserveExif: settings.preserveExif,
        };

        let compressedFile = await imageCompression(sourceFile as File, options);

        if (settings.preserveExif && (settings.format === 'jpeg' || (settings.format === 'original' && updatedImages[i].file.type === 'image/jpeg'))) {
          compressedFile = await preserveExifManually(updatedImages[i].file, compressedFile) as File;
        }

        // Cleanup old compressed URL if it exists
        if (updatedImages[i].compressedUrl) {
          URL.revokeObjectURL(updatedImages[i].compressedUrl!);
        }

        updatedImages[i].status = 'completed';
        updatedImages[i].compressedSize = compressedFile.size;
        updatedImages[i].compressedBlob = compressedFile;
        updatedImages[i].compressedUrl = URL.createObjectURL(compressedFile);
      } catch (error) {
        updatedImages[i].status = 'error';
        updatedImages[i].error = '処理失敗';
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
      setImages(prev => prev.map(img => {
        if (img.id === cropTarget.id) {
          if (img.displayUrl !== img.previewUrl) URL.revokeObjectURL(img.displayUrl);
          return {
            ...img,
            displayUrl: url,
            croppedBlob: blob,
            status: 'pending',
            compressedSize: undefined,
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
    <Layout title={`画像軽量化・クロップツール | ${siteConfig.title}`}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <Stack spacing={4}>
              {/* 1. Upload Section */}
              <Box 
                onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }} 
                onDragOver={(e) => e.preventDefault()} 
                onClick={() => fileInputRef.current?.click()} 
                sx={{ border: '2px dashed var(--ifm-color-emphasis-300)', borderRadius: '16px', p: 6, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'var(--ifm-color-primary)', bgcolor: 'action.hover' } }}
              >
                <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" fontWeight={800}>画像をドラッグ＆ドロップしてアップロード</Typography>
                <Typography variant="body2" color="text.secondary">複数選択可。JPEG, PNG, WebPに対応</Typography>
                <input type="file" multiple accept="image/*" hidden ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} />
              </Box>

              {/* 2. Image List & Settings (Only visible after upload) */}
              {images.length > 0 && (
                <>
                  <Stack spacing={2}>
                    {images.map((img) => (
                      <Card key={img.id} sx={{ borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)' }} elevation={0}>
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <img src={img.displayUrl} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px' }} />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body1" fontWeight={700} noWrap>{img.file.name}</Typography>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Typography variant="body2" color="text.secondary">{formatSize(img.originalSize)}</Typography>
                              {img.compressedSize && (
                                <Typography variant="body2" color="success.main" fontWeight={700}>→ {formatSize(img.compressedSize)}</Typography>
                              )}
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="クロップ">
                              <IconButton onClick={() => onCropClick(img)} color="primary"><CropIcon /></IconButton>
                            </Tooltip>
                            {img.status === 'completed' && (
                              <Tooltip title="Before/After 比較">
                                <IconButton onClick={() => setCompareImages({ before: img.displayUrl, after: img.compressedUrl! })} color="info"><CompareIcon /></IconButton>
                              </Tooltip>
                            )}
                            <IconButton color="error" onClick={() => removeImage(img.id)}><DeleteIcon /></IconButton>
                          </Stack>
                        </Box>
                      </Card>
                    ))}
                  </Stack>

                  {/* 3. Settings Section */}
                  <Card sx={{ borderRadius: '16px', border: '1px solid var(--ifm-color-emphasis-200)', bgcolor: 'rgba(0,0,0,0.01)' }} elevation={0}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>⚙️ 最適化設定</Typography>
                      <Grid container spacing={4} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>出力フォーマット</InputLabel>
                            <Select value={settings.format} label="出力フォーマット" onChange={(e) => setSettings({ ...settings, format: e.target.value as ImageFormat })}>
                              <MenuItem value="original">オリジナル</MenuItem>
                              <MenuItem value="webp">WebP (推奨)</MenuItem>
                              <MenuItem value="jpeg">JPEG</MenuItem>
                              <MenuItem value="png">PNG</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={SNS_PRESETS}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              return option.label;
                            }}
                            value={SNS_PRESETS.find(p => p.width === settings.maxWidthOrHeight && p.width !== undefined) || (settings.maxWidthOrHeight ? settings.maxWidthOrHeight.toString() : '制限なし')}
                            onInputChange={(event, newValue) => {
                              if (newValue === '制限なし' || newValue === '') {
                                setSettings({ ...settings, maxWidthOrHeight: undefined });
                              } else {
                                const num = parseInt(newValue.replace(/[^0-9]/g, ''), 10);
                                if (!isNaN(num)) {
                                  setSettings({ ...settings, maxWidthOrHeight: num });
                                }
                              }
                            }}
                            onChange={(event, newValue) => {
                              if (newValue && typeof newValue === 'object') {
                                setSettings({ ...settings, maxWidthOrHeight: newValue.width });
                              } else if (newValue === '制限なし' || !newValue) {
                                setSettings({ ...settings, maxWidthOrHeight: undefined });
                              }
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="最大幅/高さ (px)" placeholder="数値(px)を入力" />
                            )}
                          />
                        </Grid>                        <Grid item xs={12}>
                          <Box sx={{ px: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>画質: {Math.round(settings.quality * 100)}%</Typography>
                            <Slider value={settings.quality} min={0.1} max={1.0} step={0.05} onChange={(_, v) => setSettings({ ...settings, quality: v as number })} />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
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
                                <Tooltip title={(settings.format === 'webp' || settings.format === 'png') ? "WebP/PNG形式への変換時は、ブラウザの制限によりEXIF情報を保持できません。" : ""}>
                                  <Typography variant="body2" sx={{ color: (settings.format === 'webp' || settings.format === 'png') ? 'text.disabled' : 'text.primary', cursor: (settings.format === 'webp' || settings.format === 'png') ? 'help' : 'default' }}>
                                    EXIF情報を保持する (JPEGのみ)
                                  </Typography>
                                </Tooltip>
                              </Box>
                            }
                          />                        </Grid>
                      </Grid>
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
                      {isProcessing ? <CircularProgress size={28} color="inherit" /> : '最適化を開始'}
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
                        一括ダウンロード
                      </Button>
                    )}
                  </Stack>
                </>
              )}

            </Stack>

          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={!!cropTarget} onClose={() => setCropTarget(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>画像をクロップ</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>比率を選択:</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {ASPECT_RATIOS.map(r => (
                  <Button key={r.label} size="small" variant={aspect === r.value ? 'contained' : 'outlined'} sx={{ borderRadius: '20px', mb: 1 }} onClick={() => {
                    setAspect(r.value);
                    if (r.value && imgRef.current) {
                      setCrop(centerAspectCrop(imgRef.current.width, imgRef.current.height, r.value));
                    }
                  }}>
                    {r.label}
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
            <Button onClick={() => setCropTarget(null)}>キャンセル</Button>
            <Button onClick={onCropComplete} variant="contained" sx={{ borderRadius: '10px', px: 4 }}>決定</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!compareImages} onClose={() => setCompareImages(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
            比較プレビュー
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
