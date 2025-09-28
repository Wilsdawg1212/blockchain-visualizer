'use client';

import * as React from 'react';
import { Card, CardContent, Typography, Grid, Stack } from '@mui/material';
import { Code } from '@mui/icons-material';

export default function TechnicalArchitecture() {
  return (
    <Card sx={{ mb: 4, backgroundColor: '#0f0f0f', borderColor: '#9c27b0' }}>
      <CardContent>
        <Typography
          variant="h5"
          sx={{
            color: '#ba68c8',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Code sx={{ color: '#9c27b0' }} />
          Technical Architecture
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              Frontend
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
              Built with Next.js 15, React 19, and Material-UI. Uses Zustand
              for state management to efficiently handle real-time block data
              and user navigation state.
            </Typography>

            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              Data Layer
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Connects directly to Base blockchain RPC endpoints using Viem
              library. Fetches block data, transaction information, and L1/L2
              relationships in real-time.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              Features
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                • Real-time block streaming and updates
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                • Historical block search and navigation
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                • L1/L2 block relationship visualization
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                • Responsive design with dark theme
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                • Persistent state management
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
