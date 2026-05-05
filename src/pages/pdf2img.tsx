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
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
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
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    format: 'image/png',
    maxWidth: undefined as number | undefined,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateThumbnails = async (pdfDoc: pdfjs.PDFDocumentProxy) => {
    setIsGeneratingThumbnails(true);
    const thumbUrls: string[] = [];
    
    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 }); // Scale 1.0 for better quality in modal
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbUrls.push(canvas.toDataURL('image/jpeg', 0.6));
        }
        // Update state periodically to show progress
        if (i % 5 === 0 || i === pdfDoc.numPages) {
          setThumbnails([...thumbUrls]);
        }
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selectedFile = files[0];
    if (selectedFile.type !== 'application/pdf') {
      setSnackbar({ open: true, message: translate({ id: 'pdf2img.error.notPdf', message: 'PDFファイルを選択してください。' }), severity: 'error' });
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
      });
      const loadedPdf = await loadingTask.promise;
      
      setFile(selectedFile);
      setPdf(loadedPdf);
      setTotalPages(loadedPdf.numPages);
      setSelectedPages(Array.from({ length: loadedPdf.numPages }, (_, i) => i + 1));
      setThumbnails([]);
      generateThumbnails(loadedPdf);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setSnackbar({ open: true, message: translate({ id: 'pdf2img.error.load', message: 'PDFの読み込みに失敗しました。' }), severity: 'error' });
    }
  };

  const handlePageToggle = (page: number) => {
    setSelectedPages(prev => 
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (selectedPages.length === totalPages) {
      setSelectedPages([]);
    } else {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
    }
  };

  const convertAndDownload = async () => {
    if (!pdf || selectedPages.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();
      const blobs: { blob: Blob, page: number }[] = [];

      for (const pageNum of selectedPages) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        let scale = 2.0;
        if (settings.maxWidth && viewport.width > settings.maxWidth) {
          scale = settings.maxWidth / (viewport.width / 2.0);
        }
        
        const adjustedViewport = page.getViewport({ scale });
        canvas.width = adjustedViewport.width;
        canvas.height = adjustedViewport.height;

        await page.render({ canvasContext: ctx, viewport: adjustedViewport }).promise;

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, settings.format, 0.9));
        if (blob) {
          blobs.push({ blob, page: pageNum });
        }
      }

      const formatExt = FORMATS.find(f => f.value === settings.format)?.ext || 'png';
      const baseFileName = file?.name.replace(/\.pdf$/i, '') || 'output';

      if (blobs.length === 1) {
        const url = URL.createObjectURL(blobs[0].blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseFileName}_page${blobs[0].page}.${formatExt}`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        blobs.forEach(({ blob, page }) => {
          zip.file(`${baseFileName}_page${page}.${formatExt}`, blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseFileName}_images.zip`;
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

  const reset = () => {
    setFile(null);
    setPdf(null);
    setTotalPages(0);
    setSelectedPages([]);
    setThumbnails([]);
  };

  return (
    <Layout title={`${translate({ id: 'pdf2img.header.title', message: 'PDF画像変換' })} | ${siteConfig.title}`}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Stack spacing={4}>
              
              {/* 1. Upload Section */}
              {!file ? (
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
                      {translate({ id: 'pdf2img.upload.dropLabel', message: 'クリックまたはドラッグ＆ドロップでPDFを選択' })}
                    </p>
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                  </Box>
                </div>
              ) : (
                <Card sx={{ borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)' }} elevation={0}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <PictureAsPdfIcon color="primary" sx={{ fontSize: 32 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{file.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB / {totalPages} ページ
                        </Typography>
                      </Box>
                      <Button startIcon={<DeleteIcon />} color="error" onClick={reset}>{translate({ id: 'pdf2img.action.change', message: '変更' })}</Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}



              {/* 2. Settings & Page Selection */}
              {file && (
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

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>📄 {translate({ id: 'pdf2img.pages.title', message: 'ページ選択' })} ({selectedPages.length} / {totalPages})</Typography>
                        <Button size="small" onClick={handleSelectAll}>
                          {selectedPages.length === totalPages ? translate({ id: 'pdf2img.pages.deselectAll', message: '全解除' }) : translate({ id: 'pdf2img.pages.selectAll', message: '全選択' })}
                        </Button>
                      </Box>

                      {isGeneratingThumbnails && thumbnails.length < totalPages && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <CircularProgress size={20} />
                          <Typography variant="caption">{translate({ id: 'pdf2img.pages.generating', message: 'プレビューを生成中...' })} ({thumbnails.length}/{totalPages})</Typography>
                        </Box>
                      )}

                      <Grid2 container spacing={2} sx={{ maxHeight: '500px', overflowY: 'auto', p: 1, bgcolor: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page, idx) => {
                          const isSelected = selectedPages.includes(page);
                          return (
                            <Grid2 size={{ xs: 6, sm: 4, md: 3 }} key={page}>
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
                                <CardActionArea onClick={() => handlePageToggle(page)}>
                                  <Box sx={{ position: 'relative', pt: '141%', bgcolor: '#f5f5f5' }}>
                                    {thumbnails[idx] ? (
                                      <img 
                                        src={thumbnails[idx]} 
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
                                        setPreviewImage(thumbnails[idx]);
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
                    </CardContent>
                  </Card>

                  {/* 3. Action Buttons */}
                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large" 
                    onClick={convertAndDownload} 
                    disabled={selectedPages.length === 0 || isProcessing} 
                    startIcon={!isProcessing && <DownloadIcon />}
                    sx={{ borderRadius: '12px', py: 2, fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 4px 14px 0 rgba(255,126,179,0.39)' }}
                  >
                    {isProcessing ? <CircularProgress size={28} color="inherit" /> : translate({ id: 'pdf2img.action.download', message: '画像をダウンロード' })}
                  </Button>
                </>
              )}

              {/* 使い方の説明 */}
              <div className={common.card}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>
                    <PictureAsPdfIcon sx={{ fontSize: '1.1rem', verticalAlign: 'middle' }} />
                  </span>
                  {translate({ id: 'pdf2img.guide.title', message: '使い方' })}
                </h2>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 2, color: 'var(--ifm-color-emphasis-700)', fontSize: '0.92rem' }}>
                  <li>{translate({ id: 'pdf2img.guide.step1', message: '変換したいPDFファイルを選択またはドラッグ＆ドロップでアップロードします。' })}</li>
                  <li>{translate({ id: 'pdf2img.guide.step2', message: '出力フォーマット（PNG / JPEG / WebP）と最大横幅を設定します。' })}</li>
                  <li>{translate({ id: 'pdf2img.guide.step3', message: '画像として保存したいページを選択します（複数選択可能）。' })}</li>
                  <li>{translate({ id: 'pdf2img.guide.step4', message: '「画像をダウンロード」ボタンを押すと、画像ファイル（複数の場合はZIP形式）がダウンロードされます。' })}</li>
                </ol>
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 126, 179, 0.08)',
                  border: '1px solid rgba(255, 126, 179, 0.2)',
                  fontSize: '0.85rem',
                  color: 'var(--ifm-color-emphasis-700)',
                }}>
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
          open={!!previewImage} 
          onClose={() => setPreviewImage(null)} 
          maxWidth="xl" 
          fullWidth
          PaperProps={{ sx: { m: { xs: 1, sm: 2 }, height: 'calc(100% - 32px)', maxHeight: 'none', borderRadius: '12px', overflow: 'hidden' } }}
        >
          <Box sx={{ position: 'relative', bgcolor: '#f5f5f5', textAlign: 'center', p: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconButton 
              onClick={() => setPreviewImage(null)} 
              sx={{ position: 'absolute', top: 16, right: 16, color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' }, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <CloseIcon />
            </IconButton>
            {previewImage && (
              <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            )}
          </Box>
        </Dialog>
      </MuiTheme>
    </Layout>
  );
}
