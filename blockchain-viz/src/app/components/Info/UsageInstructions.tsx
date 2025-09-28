'use client';

import * as React from 'react';
import { Card, CardContent, Typography, Stack, Box } from '@mui/material';

export default function UsageInstructions() {
  return (
    <Card sx={{ backgroundColor: '#0f0f0f', borderColor: '#9c27b0' }}>
      <CardContent>
        <Typography variant="h5" sx={{ color: '#ba68c8', mb: 2 }}>
          How to Use
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              1. Live Mode (Default)
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              The application starts in live mode, automatically showing new
              blocks as they're added to the blockchain. Toggle the "Live
              Mode" switch to pause real-time updates.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              2. Search for Specific Blocks
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Use the search box to find a specific block number. The
              application will load the block and surrounding blocks for
              context.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              3. Navigate Through History
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Use the arrow buttons to move forward and backward through
              blocks. The current block is highlighted with a purple border
              and "CURRENT" indicator.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              4. Explore L1 Connections
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Click on L1 blocks (circular icons below) to navigate to the
              associated L2 blocks. This helps you understand how Base blocks
              are anchored to Ethereum.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
              5. Reset and Start Over
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Use the "Reset" button to clear the current view and return to
              live mode with the latest blocks.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
