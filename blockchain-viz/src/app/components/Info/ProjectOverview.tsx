'use client';

import * as React from 'react';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { Timeline } from '@mui/icons-material';

export default function ProjectOverview() {
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
            justifyContent: { xs: 'center', sm: 'flex-start' },
            gap: 1,
          }}
        >
          <Timeline sx={{ color: '#9c27b0' }} />
          What is this project?
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: '#e0e0e0', mb: 2, lineHeight: 1.6 }}
        >
          The Base Blockchain Visualizer is a real-time visualization tool that
          helps you explore and understand the Base blockchain (an Ethereum
          Layer 2 solution). It provides an intuitive interface to view blocks,
          track transactions, and understand the relationship between Layer 1
          (Ethereum) and Layer 2 (Base) blocks.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          flexWrap="wrap"
          sx={{
            mt: 2,
            alignItems: { xs: 'center', sm: 'flex-start' },
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Chip
            label="Real-time Block Tracking"
            sx={{
              backgroundColor: '#1a0a2e',
              color: '#ba68c8',
              border: '1px solid #9c27b0',
            }}
          />
          <Chip
            label="L1/L2 Block Relationships"
            sx={{
              backgroundColor: '#1a0a2e',
              color: '#ba68c8',
              border: '1px solid #9c27b0',
            }}
          />
          <Chip
            label="Historical Block Exploration"
            sx={{
              backgroundColor: '#1a0a2e',
              color: '#ba68c8',
              border: '1px solid #9c27b0',
            }}
          />
          <Chip
            label="Interactive Navigation"
            sx={{
              backgroundColor: '#1a0a2e',
              color: '#ba68c8',
              border: '1px solid #9c27b0',
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
