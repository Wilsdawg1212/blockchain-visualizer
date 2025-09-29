'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import { ContentCopy, Favorite } from '@mui/icons-material';

export default function Footer() {
  const walletAddress = '0x32389a49eb85cdD88D353528Faba8112ea3674Bf'; // Replace with your actual wallet address

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#0a0a0a',
        borderTop: '1px solidrgb(43, 40, 44)',
        mt: 8,
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', sm: 'column' }}
          spacing={4}
          alignItems={{ xs: 'center', sm: 'center' }}
          justifyContent="space-between"
        >
          {/* Right side - Support section */}
          <Box sx={{ textAlign: { xs: 'center', sm: 'center' } }}>
            <Typography variant="h6" sx={{ color: '#ba68c8', mb: 2 }}>
              Support the Project
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              justifyContent={{ xs: 'center', sm: 'flex-end' }}
            >
              <Box
                sx={{
                  backgroundColor: '#1a0a2e',
                  border: '1px solid #9c27b0',
                  borderRadius: 2,
                  p: 2,
                  minWidth: { xs: '280px', sm: '320px' },
                }}
              >
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Wallet Address:
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    backgroundColor: '#0f0f0f',
                    borderRadius: 1,
                    p: 1,
                    border: '1px solid #333',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#e0e0e0',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      wordBreak: 'break-all',
                      flex: 1,
                    }}
                  >
                    {walletAddress}
                  </Typography>
                  <IconButton
                    onClick={copyToClipboard}
                    size="small"
                    sx={{
                      color: '#ba68c8',
                      '&:hover': {
                        backgroundColor: 'rgba(186, 104, 200, 0.1)',
                      },
                    }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Stack>
            <Chip
              label="ETH • USDC • USDT accepted"
              sx={{
                backgroundColor: '#1a0a2e',
                color: '#ba68c8',
                border: '1px solid #9c27b0',
                mt: 2,
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </Stack>

        {/* Bottom section */}
        <Box
          sx={{
            borderTop: '1px solid #333',
            mt: 3,
            pt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#888' }}>
            © 2024 Base Blockchain Visualizer. Open source and
            community-driven.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
