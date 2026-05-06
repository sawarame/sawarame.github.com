import React, { useState, useRef, useEffect } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import {
  Button,
  Stack,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Autocomplete,
  Snackbar,
  Alert,
  Checkbox,
  Divider,
  CardActionArea,
  Dialog,
  IconButton,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import common from '@site/src/css/common.module.css';
import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist';

// pdfjs worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// --- Utils ---

const FORMATS = [
  { label: 'PNG', value: 'image/png', ext: 'png' },
  { label: 'JPEG', value: 'image/jpeg', ext: 'jpg' },
  { label: 'WebP', value: 'image/webp', ext: 'webp' },
];

const WIDTH_PRESETS = [
  { label: translate({ id: 'pdf2img.pages.noLimit', message: '制限なし' }), value: undefined },
  { label: '2560px (2K)', value: 2560 },
  { label: '1920px (Full HD)', value: 1920 },
  { label: '1280px (HD)', value: 1280 },
  { label: '1080px', value: 1080 },
  { label: '800px', value: 800 },
];

interface SelectedPdf {
  id: string;
  file: File;
  pdf: pdfjs.PDFDocumentProxy;
  totalPages: number;
  selectedPages: number[];
  thumbnails: string[];
  isGeneratingThumbnails: boolean;
}

// --- Sub Components ---

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255, 126, 179, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255, 117, 140, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className={common.pageHeaderContent}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📄</span>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          margin: '0 0 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #ff7e5f 60%, #feb47b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>{translate({ id: 'pdf2img.header.title', message: 'PDF画像変換ツール' })}</h1>
        <p className={common.pageHeaderDesc}>
          {translate({ id: 'pdf2img.header.desc', message: 'PDFファイルを1ページずつ画像（PNG, JPEG, WebP）に変換します。ブラウザ内ですべての処理を行うため、ファイルがサーバーに送信されることはありません。' })}
        </p>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function PdfToImg(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [pdfFiles, setPdfFiles] = useState<SelectedPdf[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    format: 'image/png',
    maxWidth: undefined as number | undefined,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [previewIndex, setPreviewIndex] = useState<{ fileId: string, pageIdx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePdf = pdfFiles.find(f => f.id === activeFileId) || (pdfFiles.length > 0 ? pdfFiles[0] : null);

  const generateThumbnails = async (id: string, pdfDoc: pdfjs.PDFDocumentProxy) => {
    setPdfFiles(prev => prev.map(f => f.id === id ? { ...f, isGeneratingThumbnails: true } : f));
    const thumbUrls: string[] = [];
    
    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbUrls.push(canvas.toDataURL('image/jpeg', 0.6));
        }
        
        if (i % 5 === 0 || i === pdfDoc.numPages) {
          setPdfFiles(prev => prev.map(f => f.id === id ? { ...f, thumbnails: [...thumbUrls] } : f));
        }
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
    } finally {
      setPdfFiles(prev => prev.map(f => f.id === id ? { ...f, isGeneratingThumbnails: false } : f));
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newPdfs: SelectedPdf[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const selectedFile = files[i];
      if (selectedFile.type !== 'application/pdf') {
        setSnackbar({ open: true, message: `${selectedFile.name}: ${translate({ id: 'pdf2img.error.notPdf', message: 'PDFファイルを選択してください。' })}`, severity: 'error' });
        continue;
      }

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
        });
        const loadedPdf = await loadingTask.promise;
        const id = Math.random().toString(36).substr(2, 9);
        
        const newPdf: SelectedPdf = {
          id,
          file: selectedFile,
          pdf: loadedPdf,
          totalPages: loadedPdf.numPages,
          selectedPages: Array.from({ length: loadedPdf.numPages }, (_, i) => i + 1),
          thumbnails: [],
          isGeneratingThumbnails: false,
        };
        newPdfs.push(newPdf);
        generateThumbnails(id, loadedPdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setSnackbar({ open: true, message: translate({ id: 'pdf2img.error.load', message: 'PDFの読み込みに失敗しました。' }), severity: 'error' });
      }
    }

    if (newPdfs.length > 0) {
      setPdfFiles(prev => [...prev, ...newPdfs]);
      setActiveFileId(newPdfs[0].id);
    }
  };

  const handlePageToggle = (fileId: string, page: number) => {
    setPdfFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const newSelected = f.selectedPages.includes(page) 
        ? f.selectedPages.filter(p => p !== page) 
        : [...f.selectedPages, page].sort((a, b) => a - b);
      return { ...f, selectedPages: newSelected };
    }));
  };

  const handleSelectAll = (fileId: string) => {
    setPdfFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const newSelected = f.selectedPages.length === f.totalPages 
        ? [] 
        : Array.from({ length: f.totalPages }, (_, i) => i + 1);
      return { ...f, selectedPages: newSelected };
    }));
  };

  const removeFile = (id: string) => {
    setPdfFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const convertAndDownload = async () => {
    if (pdfFiles.length === 0) return;
    const totalSelected = pdfFiles.reduce((acc, f) => acc + f.selectedPages.length, 0);
    if (totalSelected === 0) return;

    setIsProcessing(true);

    try {
      const zip = new JSZip();
      const allBlobs: { blob: Blob, fileName: string }[] = [];

      for (const pdfFile of pdfFiles) {
        const { pdf, selectedPages, file, id } = pdfFile;
        const baseFileName = file.name.replace(/\.pdf$/i, '');

        for (const pageNum of selectedPages) {
          const page = await pdf.getPage(pageNum);
          const initialViewport = page.getViewport({ scale: 2.0 });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          let scale = 2.0;
          if (settings.maxWidth && initialViewport.width > settings.maxWidth) {
            scale = settings.maxWidth / (initialViewport.width / 2.0);
          }
          
          const adjustedViewport = page.getViewport({ scale });
          canvas.width = adjustedViewport.width;
          canvas.height = adjustedViewport.height;

          await page.render({ canvasContext: ctx, viewport: adjustedViewport }).promise;

          const formatExt = FORMATS.find(f => f.value === settings.format)?.ext || 'png';
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, settings.format, 0.9));
          
          if (blob) {
            const fileName = pdfFiles.length === 1 && selectedPages.length === 1
              ? `${baseFileName}_page${pageNum}.${formatExt}`
              : `${baseFileName}/${baseFileName}_page${pageNum}.${formatExt}`;
            allBlobs.push({ blob, fileName });
          }
        }
      }

      if (allBlobs.length === 1) {
        const { blob, fileName } = allBlobs[0];
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        allBlobs.forEach(({ blob, fileName }) => {
          zip.file(fileName, blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pdf_converted_images.zip`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setSnackbar({ open: true, message: translate({ id: 'pdf2img.success', message: '変換が完了しました。' }), severity: 'success' });
    } catch (error) {
      console.error('Conversion error:', error);
      setSnackbar({ open: true, message: translate({ id: 'pdf2img.error.convert', message: '変換中にエラーが発生しました。' }), severity: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout title={`${translate({ id: 'pdf2img.header.title', message: 'PDF画像変換' })} | ${siteConfig.title}`}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Stack spacing={4}>
              
              {/* 1. Upload Section (Always visible) */}
              <div className={common.card}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>📁</span>
                  {translate({ id: 'pdf2img.upload.title', message: 'PDFを選択' })}
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
                  <PictureAsPdfIcon sx={{ fontSize: 48, color: 'var(--ifm-color-emphasis-500)', marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--ifm-color-emphasis-800)' }}>
                    {translate({ id: 'pdf2img.upload.dropLabel', message: 'クリックまたはドラッグ＆ドロップでPDFを追加' })}
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </Box>
              </div>

              {/* 1.5 Selected Files List */}
              {pdfFiles.length > 0 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', px: 1 }}>
                    {translate({ id: 'pdf2img.list.title', message: '選択中のファイル' })} ({pdfFiles.length})
                  </Typography>
                  {pdfFiles.map((pdfFile) => (
                    <Card 
                      key={pdfFile.id} 
                      sx={{ 
                        borderRadius: '12px', 
                        border: '1px solid',
                        borderColor: activeFileId === pdfFile.id ? 'primary.main' : 'var(--ifm-color-emphasis-200)',
                        bgcolor: activeFileId === pdfFile.id ? 'rgba(255, 126, 179, 0.04)' : 'background.paper',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }} 
                      elevation={0}
                      onClick={() => setActiveFileId(pdfFile.id)}
                    >
                      <CardContent sx={{ py: '12px !important', px: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <PictureAsPdfIcon color={activeFileId === pdfFile.id ? "primary" : "action"} sx={{ fontSize: 28 }} />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{pdfFile.file.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB / {pdfFile.totalPages} {translate({ id: 'pdf2img.list.pages', message: 'ページ' })}
                              {pdfFile.selectedPages.length !== pdfFile.totalPages && ` (${translate({ id: 'pdf2img.list.selected', message: '選択中' })}: ${pdfFile.selectedPages.length})`}
                            </Typography>
                          </Box>
                          <Tooltip title={translate({ id: 'pdf2img.action.remove', message: '削除' })}>
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={(e) => { e.stopPropagation(); removeFile(pdfFile.id); }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              {/* 2. Settings & Page Selection */}
              {pdfFiles.length > 0 && (
                <>
                  <Card sx={{ borderRadius: '16px', border: '1px solid var(--ifm-color-emphasis-200)', bgcolor: 'rgba(0,0,0,0.01)' }} elevation={0}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>⚙️ {translate({ id: 'pdf2img.settings.title', message: '変換設定' })}</Typography>
                      <Grid2 container spacing={3} sx={{ mt: 1 }}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>{translate({ id: 'pdf2img.settings.format', message: '出力フォーマット' })}</InputLabel>
                            <Select 
                              value={settings.format} 
                              label={translate({ id: 'pdf2img.settings.format', message: '出力フォーマット' })} 
                              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                            >
                              {FORMATS.map(f => (
                                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={WIDTH_PRESETS}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              return option.label;
                            }}
                            value={WIDTH_PRESETS.find(p => p.value === settings.maxWidth) || (settings.maxWidth ? settings.maxWidth.toString() : '制限なし')}
                            onInputChange={(event, newValue) => {
                              if (newValue === '制限なし' || newValue === '') {
                                setSettings({ ...settings, maxWidth: undefined });
                              } else {
                                const num = parseInt(newValue.replace(/[^0-9]/g, ''), 10);
                                if (!isNaN(num)) setSettings({ ...settings, maxWidth: num });
                              }
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label={translate({ id: 'pdf2img.settings.maxWidth', message: '最大横幅 (px)' })} placeholder={translate({ id: 'pdf2img.settings.maxWidthPlaceholder', message: '数値(px)を入力' })} />
                            )}
                          />
                        </Grid2>
                      </Grid2>

                      <Divider sx={{ my: 3 }} />

                      {activePdf && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>📄 {translate({ id: 'pdf2img.pages.title', message: 'ページ選択' })}: {activePdf.file.name}</Typography>
                              <Typography variant="caption" color="text.secondary">({activePdf.selectedPages.length} / {activePdf.totalPages} {translate({ id: 'pdf2img.pages.unit', message: '枚を選択中' })})</Typography>
                            </Box>
                            <Button size="small" onClick={() => handleSelectAll(activePdf.id)}>
                              {activePdf.selectedPages.length === activePdf.totalPages ? translate({ id: 'pdf2img.pages.deselectAll', message: '全解除' }) : translate({ id: 'pdf2img.pages.selectAll', message: '全選択' })}
                            </Button>
                          </Box>

                          {activePdf.isGeneratingThumbnails && activePdf.thumbnails.length < activePdf.totalPages && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <CircularProgress size={20} />
                              <Typography variant="caption">{translate({ id: 'pdf2img.pages.generating', message: 'プレビューを生成中...' })} ({activePdf.thumbnails.length}/{activePdf.totalPages})</Typography>
                            </Box>
                          )}

                          <Grid2 container spacing={2} sx={{ maxHeight: '500px', overflowY: 'auto', p: 1, bgcolor: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
                            {Array.from({ length: activePdf.totalPages }, (_, i) => i + 1).map((page, idx) => {
                              const isSelected = activePdf.selectedPages.includes(page);
                              return (
                                <Grid2 size={{ xs: 6, sm: 4, md: 3 }} key={`${activePdf.id}-${page}`}>
                                  <Card 
                                    sx={{ 
                                      position: 'relative',
                                      border: '2px solid',
                                      borderColor: isSelected ? 'primary.main' : 'transparent',
                                      transition: 'all 0.2s',
                                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                                    }}
                                    elevation={isSelected ? 4 : 1}
                                  >
                                    <CardActionArea onClick={() => handlePageToggle(activePdf.id, page)}>
                                      <Box sx={{ position: 'relative', pt: '141%', bgcolor: '#f5f5f5' }}>
                                        {activePdf.thumbnails[idx] ? (
                                          <img 
                                            src={activePdf.thumbnails[idx]} 
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} 
                                            alt={`Page ${page}`}
                                          />
                                        ) : (
                                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CircularProgress size={24} />
                                          </Box>
                                        )}
                                        <Box sx={{ 
                                          position: 'absolute', 
                                          top: 4, 
                                          left: 4, 
                                          bgcolor: 'rgba(0,0,0,0.6)', 
                                          color: 'white', 
                                          px: 1, 
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          zIndex: 1
                                        }}>
                                          {page}P
                                        </Box>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewIndex({ fileId: activePdf.id, pageIdx: idx });
                                          }}
                                          sx={{
                                            position: 'absolute',
                                            bottom: 4,
                                            right: 4,
                                            bgcolor: 'rgba(255,255,255,0.8)',
                                            color: 'primary.main',
                                            zIndex: 2,
                                            '&:hover': { bgcolor: 'white' },
                                            boxShadow: 1
                                          }}
                                        >
                                          <ZoomInIcon fontSize="small" />
                                        </IconButton>
                                        {isSelected && (
                                          <Box sx={{ position: 'absolute', top: 4, right: 4, color: 'primary.main', zIndex: 1, bgcolor: 'white', borderRadius: '50%', display: 'flex' }}>
                                            <CheckCircleIcon fontSize="small" />
                                          </Box>
                                        )}
                                      </Box>
                                    </CardActionArea>
                                  </Card>
                                </Grid2>
                              );
                            })}
                          </Grid2>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* 3. Action Buttons */}
                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large" 
                    onClick={convertAndDownload} 
                    disabled={pdfFiles.every(f => f.selectedPages.length === 0) || isProcessing} 
                    startIcon={!isProcessing && <DownloadIcon />}
                    sx={{ borderRadius: '12px', py: 2, fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 4px 14px 0 rgba(255,126,179,0.39)' }}
                  >
                    {isProcessing ? <CircularProgress size={28} color="inherit" /> : translate({ id: 'pdf2img.action.download', message: '選択したページをすべて変換してダウンロード' })}
                  </Button>
                </>
              )}

              {/* 使い方の説明 */}
              <div className={common.guideCard}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>
                    <PictureAsPdfIcon sx={{ fontSize: '1.1rem', verticalAlign: 'middle' }} />
                  </span>
                  {translate({ id: 'pdf2img.guide.title', message: '使い方' })}
                </h2>
                <ol className={common.guideList}>
                  <li>{translate({ id: 'pdf2img.guide.step1', message: '変換したいPDFファイルを選択またはドラッグ＆ドロップで追加します。複数追加可能です。' })}</li>
                  <li>{translate({ id: 'pdf2img.guide.step2', message: '出力フォーマットと最大横幅を設定します（すべてのファイルに適用されます）。' })}</li>
                  <li>{translate({ id: 'pdf2img.guide.step3', message: 'リストからファイルを選択し、画像化したいページを選びます。デフォルトでは全ページが選択されています。' })}</li>
                  <li>{translate({ id: 'pdf2img.guide.step4', message: '「変換してダウンロード」ボタンを押すと、すべての選択済みページが画像化され、ZIP形式でまとめて保存されます。' })}</li>
                </ol>
                <div className={common.securityBox}>
                  {translate({ id: 'pdf2img.guide.security', message: '🔒 アップロードしたPDFファイルはサーバーに送信されません。すべての処理はブラウザ内で完結するため、機密情報を含む文書でも安全にご利用いただけます。' })}
                </div>
              </div>
            </Stack>
          </div>
        </div>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
        </Snackbar>

        <Dialog 
          open={previewIndex !== null} 
          onClose={() => setPreviewIndex(null)} 
          maxWidth="xl" 
          fullWidth
          PaperProps={{ sx: { m: { xs: 1, sm: 2 }, height: 'calc(100% - 32px)', maxHeight: 'none', borderRadius: '12px', overflow: 'hidden' } }}
        >
          <Box sx={{ position: 'relative', bgcolor: '#f5f5f5', textAlign: 'center', p: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconButton 
              onClick={() => setPreviewIndex(null)} 
              sx={{ position: 'absolute', top: 16, right: 16, color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' }, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <CloseIcon />
            </IconButton>
            
            {previewIndex !== null && (
              (() => {
                const targetFile = pdfFiles.find(f => f.id === previewIndex.fileId);
                if (!targetFile) return null;
                const pageNum = previewIndex.pageIdx + 1;
                return (
                  <>
                    <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: '8px', px: 2, py: 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{pageNum} / {targetFile.totalPages}</Typography>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={targetFile.selectedPages.includes(pageNum)}
                            onChange={() => handlePageToggle(targetFile.id, pageNum)}
                            color="primary"
                            size="small"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{translate({ id: 'pdf2img.pages.select', message: '選択する' })}</Typography>}
                        sx={{ m: 0, ml: 1 }}
                      />
                    </Box>

                    <IconButton
                      onClick={() => setPreviewIndex({ ...previewIndex, pageIdx: previewIndex.pageIdx - 1 })}
                      disabled={previewIndex.pageIdx === 0}
                      sx={{ position: 'absolute', left: 16, color: 'text.primary', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' }, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.4)' } }}
                    >
                      <ArrowBackIosNewIcon />
                    </IconButton>

                    <img src={targetFile.thumbnails[previewIndex.pageIdx]} alt={`Preview Page ${pageNum}`} style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />

                    <IconButton
                      onClick={() => setPreviewIndex({ ...previewIndex, pageIdx: previewIndex.pageIdx + 1 })}
                      disabled={previewIndex.pageIdx === targetFile.totalPages - 1}
                      sx={{ position: 'absolute', right: 16, color: 'text.primary', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' }, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.4)' } }}
                    >
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </>
                );
              })()
            )}
          </Box>
        </Dialog>
      </MuiTheme>
    </Layout>
  );
}
