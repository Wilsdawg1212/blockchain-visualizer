// app/components/L1Block.tsx
'use client';
import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { UiBlock } from '../../stores/useBlockStore';

interface L1BlockData {
  l1Number: number;
  l1Hash: string;
  l2Blocks: UiBlock[];
}

interface L1BlockProps {
  l1Block: L1BlockData;
  currentPosition: number;
  isSelected: boolean;
  offsetPx: number;
  onL1BlockClick: (l1Block: L1BlockData) => Promise<void>;
}

export default function L1Block({
  l1Block,
  currentPosition,
  isSelected,
  offsetPx,
  onL1BlockClick,
}: L1BlockProps) {
  const isConnectedToCurrent = l1Block.l2Blocks.some(
    l2Block => l2Block.number === currentPosition
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateX(${offsetPx}px)`,
        zIndex: 2,
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      {/* Circular L1 Block */}
      <Box
        onClick={() => onL1BlockClick(l1Block)}
        sx={{
          width: '120px',
          height: '120px',
          backgroundColor: isSelected
            ? '#2e1065' // Darker purple when selected
            : isConnectedToCurrent
              ? '#1a0a2e'
              : '#1a1a1a',
          border: isSelected
            ? '4px solid #e91e63' // Pink border when selected
            : isConnectedToCurrent
              ? '3px solid #9c27b0'
              : '2px solid #4a4a4a',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isSelected
            ? '0 0 30px rgba(233, 30, 99, 0.6)' // Pink glow when selected
            : isConnectedToCurrent
              ? '0 0 20px rgba(156, 39, 176, 0.4)'
              : '0 2px 8px rgba(0,0,0,0.3)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)', // Slightly larger when selected
          '&:hover': {
            transform: isSelected ? 'scale(1.15)' : 'scale(1.05)',
            boxShadow: isSelected
              ? '0 0 35px rgba(233, 30, 99, 0.8)'
              : '0 0 25px rgba(156, 39, 176, 0.6)',
          },
        }}
      >
        {/* L1 Label */}
        <Typography
          variant="caption"
          sx={{
            color: isSelected
              ? '#f48fb1' // Light pink when selected
              : isConnectedToCurrent
                ? '#ba68c8'
                : '#e0e0e0',
            fontSize: '8px',
            fontWeight: 'bold',
            mb: 0.5,
          }}
        >
          L1
        </Typography>

        {/* Block Number */}
        <Typography
          variant="caption"
          sx={{
            color: isSelected
              ? '#f48fb1' // Light pink when selected
              : isConnectedToCurrent
                ? '#ba68c8'
                : '#e0e0e0',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}
        >
          #{l1Block.l1Number}
        </Typography>

        {/* Connection Count */}
        <Typography
          variant="caption"
          sx={{
            color: isSelected
              ? '#f48fb1' // Light pink when selected
              : isConnectedToCurrent
                ? '#ba68c8'
                : '#e0e0e0',
            fontSize: '8px',
            textAlign: 'center',
            mt: 0.5,
          }}
        >
          {l1Block.l2Blocks.length} L2
        </Typography>
      </Box>
    </Box>
  );
}
