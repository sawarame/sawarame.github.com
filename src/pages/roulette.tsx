import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import {
  Button,
  TextField,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';

const STORAGE_KEY = 'sawara_roulette_state';

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(75, 0, 130, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className={common.pageHeaderContent}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🎯</span>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          margin: '0 0 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #d8b4fe 60%, #8a2be2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}><Translate id="roulette.header.title">ルーレットメーカー</Translate></h1>
        <p className={common.pageHeaderDesc}>
          <Translate id="roulette.header.desc">ブラウザ上で完結し、入力したリストからサクッと抽選ができる「ルーレットメーカー」です。</Translate>
        </p>
      </div>
    </div>
  );
}

interface RemovedItem {
  text: string;
  index: number;
}

interface RouletteState {
  items: string[];
  drawnItems: string[];
  removeAfterDraw: boolean;
  removedItems?: Array<string | RemovedItem>;
}

export default function Roulette(): JSX.Element {
  const [items, setItems] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [drawnItems, setDrawnItems] = useState<string[]>([]);
  const [removeAfterDraw, setRemoveAfterDraw] = useState(false);
  const [removedItems, setRemovedItems] = useState<Array<string | RemovedItem>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDraw, setCurrentDraw] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: RouletteState = JSON.parse(saved);
        setItems(parsed.items || []);
        setInputText((parsed.items || []).join('\n'));
        setDrawnItems(parsed.drawnItems || []);
        setRemoveAfterDraw(!!parsed.removeAfterDraw);
        setRemovedItems(parsed.removedItems || []);
      } catch (e) {
        console.error('Failed to parse roulette state', e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const state: RouletteState = { items, drawnItems, removeAfterDraw, removedItems };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [items, drawnItems, removeAfterDraw, removedItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setItems(text.split('\n').map(s => s.trim()).filter(s => s !== ''));
    setRemovedItems([]); // Reset removed items if user manually edits to avoid index mismatch
  };

  const handleExport = () => {
    const blob = new Blob([items.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roulette_items.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const newItems = text.split('\n').map(s => s.trim()).filter(s => s !== '');
        setItems(newItems);
        setInputText(newItems.join('\n'));
        setRemovedItems([]); // インポート時は除外リストをリセット
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startDraw = () => {
    if (items.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setCurrentDraw(null);

    let duration = 50; 
    let elapsed = 0;
    const totalDuration = 3000; 

    const drawStep = () => {
      const randomIndex = Math.floor(Math.random() * items.length);
      setCurrentDraw(items[randomIndex]);

      elapsed += duration;
      if (elapsed < totalDuration) {
        duration = duration * 1.1; 
        setTimeout(drawStep, duration);
      } else {
        const finalIndex = Math.floor(Math.random() * items.length);
        const winner = items[finalIndex];
        setCurrentDraw(winner);
        setDrawnItems(prev => [winner, ...prev]);

        if (removeAfterDraw) {
          const newItems = [...items];
          newItems.splice(finalIndex, 1);
          setItems(newItems);
          setInputText(newItems.join('\n'));
          setRemovedItems(prev => [...prev, { text: winner, index: finalIndex }]);
        }
        setIsDrawing(false);
      }
    };

    drawStep();
  };

  const clearHistory = () => {
    if (removedItems.length > 0) {
      let restoredItems = [...items];
      
      // Iterate in reverse to correctly place items back at their original positions
      for (let i = removedItems.length - 1; i >= 0; i--) {
        const removed = removedItems[i];
        if (typeof removed === 'string') {
          // Fallback for legacy state: just append to the end
          restoredItems.push(removed);
        } else {
          // Splice inserts the item at the specified index without removing existing items
          const insertIndex = Math.min(removed.index, restoredItems.length);
          restoredItems.splice(insertIndex, 0, removed.text);
        }
      }
      
      setItems(restoredItems);
      setInputText(restoredItems.join('\n'));
      setRemovedItems([]);
    }
    setDrawnItems([]);
  };

  return (
    <Layout
      title={translate({ id: 'roulette.header.title', message: 'ルーレットメーカー' })}
      description={translate({ id: 'roulette.header.desc', message: 'ブラウザ上で完結し、入力したリストからサクッと抽選ができる「ルーレットメーカー」です。' })}
    >
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDrawing ? 'action.hover' : 'background.paper', borderRadius: '16px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              {currentDraw ? (
                <Typography variant="h2" component="div" fontWeight="bold" color={isDrawing ? 'text.secondary' : 'primary'} sx={{ wordBreak: 'break-word' }}>
                  {currentDraw}
                </Typography>
              ) : (
                <Typography variant="h5" color="text.disabled" sx={{ fontWeight: 'bold' }}>
                  <Translate id="roulette.display.ready">準備完了</Translate>
                </Typography>
              )}
            </Paper>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={startDraw}
                disabled={isDrawing || items.length === 0}
                startIcon={!isDrawing && <PlayArrowIcon />}
                sx={{ px: 8, py: 2, fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '12px', boxShadow: '0 4px 14px 0 rgba(138,43,226,0.39)' }}
              >
                {isDrawing ? <CircularProgress size={24} color="inherit" /> : <Translate id="roulette.action.start">抽選開始</Translate>}
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    <Translate id="roulette.input.title">項目リスト</Translate> ({items.length})
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={removeAfterDraw}
                        onChange={(e) => setRemoveAfterDraw(e.target.checked)}
                        disabled={isDrawing}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{translate({ id: 'roulette.settings.remove', message: '一度出た項目をリストから除外する' })}</Typography>}
                  />
                </Box>
                <TextField
                  multiline
                  rows={10}
                  fullWidth
                  variant="outlined"
                  placeholder={translate({ id: 'roulette.input.placeholder', message: '項目を改行で入力してください' })}
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={isDrawing}
                  sx={{ bgcolor: 'var(--ifm-background-color)', mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <input
                    accept=".txt"
                    style={{ display: 'none' }}
                    id="import-file"
                    type="file"
                    onChange={handleImport}
                  />
                  <label htmlFor="import-file" style={{ flex: 1 }}>
                    <Button component="span" variant="outlined" fullWidth startIcon={<FileUploadIcon />}>
                      <Translate id="roulette.action.import">インポート</Translate>
                    </Button>
                  </label>
                  <Button variant="outlined" fullWidth sx={{ flex: 1 }} onClick={handleExport} disabled={items.length === 0} startIcon={<FileDownloadIcon />}>
                    <Translate id="roulette.action.export">エクスポート</Translate>
                  </Button>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    <Translate id="roulette.history.title">抽選履歴</Translate> ({drawnItems.length})
                  </Typography>
                  <Button size="small" color="error" variant="outlined" onClick={clearHistory} disabled={drawnItems.length === 0 || isDrawing} startIcon={<DeleteIcon />}>
                    <Translate id="roulette.action.clearHistory">履歴クリア</Translate>
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List sx={{ maxHeight: '300px', overflow: 'auto', bgcolor: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)', p: 1 }}>
                  {drawnItems.map((item, index) => (
                    <ListItem key={index} divider={index !== drawnItems.length - 1} sx={{ py: 0.5 }}>
                      <ListItemText primary={`${drawnItems.length - index}. ${item}`} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItem>
                  ))}
                  {drawnItems.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                      <Translate id="roulette.history.empty">履歴はありません</Translate>
                    </Typography>
                  )}
                </List>
              </Paper>
            </Box>
          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
