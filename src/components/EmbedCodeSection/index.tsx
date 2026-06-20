import React, { useState, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import { Button, Tooltip, IconButton, TextField, Box, Typography, Paper } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MuiTheme from '@site/src/components/MuiTheme';

interface EmbedCodeSectionProps {
  path: string;
}

export default function EmbedCodeSection({ path }: EmbedCodeSectionProps): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // クライアントサイドで現在のオリジンを取得する（ローカル開発対応）
    setBaseUrl(window.location.origin);
  }, []);

  // SSR時はsiteConfig.urlをフォールバックとして使用する
  const embedUrl = `${baseUrl || siteConfig.url}${path}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <MuiTheme>
      <Paper elevation={0} sx={{ p: 3, my: 4, background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '8px' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'var(--ifm-color-emphasis-900)' }}>
          🔗 {translate({ id: 'embed.section.title', message: 'このツールをサイトに埋め込む' })}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'var(--ifm-color-emphasis-700)' }}>
            {translate({ id: 'embed.section.iframeLabel', message: 'iframe埋め込みタグ' })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth 
              size="small" 
              value={iframeCode} 
              InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--ifm-background-color)' } }} 
            />
            <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
              <Button variant="contained" disableElevation onClick={() => handleCopy(iframeCode)} startIcon={<ContentCopyIcon />} sx={{ whiteSpace: 'nowrap' }}>
                {translate({ id: 'common.copy', message: 'コピー' })}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 1, color: 'var(--ifm-color-emphasis-700)' }}>
            {translate({ id: 'embed.section.urlLabel', message: '埋め込み用URL（直接リンク）' })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth 
              size="small" 
              value={embedUrl} 
              InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--ifm-background-color)' } }} 
            />
            <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
              <Button variant="outlined" onClick={() => handleCopy(embedUrl)} startIcon={<ContentCopyIcon />} sx={{ whiteSpace: 'nowrap', bgcolor: 'var(--ifm-background-color)' }}>
                {translate({ id: 'common.copy', message: 'コピー' })}
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </MuiTheme>
  );
}
