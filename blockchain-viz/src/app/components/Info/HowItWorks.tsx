'use client';

import * as React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { Speed } from '@mui/icons-material';

export default function HowItWorks() {
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
          <Speed sx={{ color: '#9c27b0' }} />
          How it Works
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              Live Mode
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
              Automatically tracks new blocks as they're added to the
              blockchain. The visualization updates in real-time, showing the
              latest blocks and their confirmations.
            </Typography>

            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              Historical Mode
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
              Allows you to explore past blocks by searching for specific
              block numbers or navigating through the blockchain history.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              L1/L2 Integration
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
              Shows the relationship between Ethereum (L1) blocks and Base
              (L2) blocks. Each L2 block is derived from an L1 block, creating
              a hierarchical structure.
            </Typography>

            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              Data Sources
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Fetches data directly from the Base blockchain RPC endpoints,
              providing accurate and up-to-date information about blocks and
              transactions.
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
