import React from 'react';
import { Box, Typography, Stack, Link as MuiLink } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import MuiTheme from '@site/src/components/MuiTheme';

export interface ExtensionLink {
  label: string;
  href?: string;
  isComingSoon?: boolean;
}

interface ExtensionDownloadSectionProps {
  title: string;
  links: ExtensionLink[];
}

export default function ExtensionDownloadSection({ title, links }: ExtensionDownloadSectionProps) {
  return (
    <MuiTheme>
      <Box sx={{ 
        p: 3, 
        mb: 4, 
        mt: -2,
        borderRadius: '16px', 
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        gap: 3
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {title}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {links.map((link, index) => (
              link.isComingSoon ? (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  p: '8px 16px', 
                  borderRadius: '8px', 
                  border: '1px dashed rgba(0,0,0,0.2)',
                  color: 'text.disabled',
                  fontSize: '0.9rem'
                }}>
                  {link.label} (Coming Soon)
                </Box>
              ) : (
                <MuiLink
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ifm-color-primary)',
                    color: '#fff !important',
                    fontWeight: 'bold',
                    textDecoration: 'none !important',
                    '&:hover': { opacity: 0.9 }
                  }}
                >
                  <span>{link.label}</span>
                  <LaunchIcon sx={{ fontSize: '1rem' }} />
                </MuiLink>
              )
            ))}
          </Stack>
        </Box>
      </Box>
    </MuiTheme>
  );
}
