// app/components/L1Blocks.tsx
'use client';
import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { UiBlock } from '../../stores/useBlockStore';
import L1Block from './L1Block';

interface L1BlockData {
  l1Number: number;
  l1Hash: string;
  l2Blocks: UiBlock[];
}

interface L1BlocksProps {
  blocks: UiBlock[];
  currentPosition: number;
  selectedL1Block: number | null;
  onL1BlockClick: (l1Block: L1BlockData) => Promise<void>;
  onBackgroundClick: (event: React.MouseEvent) => void;
}

export default function L1Blocks({
  blocks,
  currentPosition,
  selectedL1Block,
  onL1BlockClick,
  onBackgroundClick,
}: L1BlocksProps) {
  // Group L1 blocks to avoid duplicates
  const l1BlocksMap = React.useMemo(() => {
    const map = new Map<number, L1BlockData>();
    blocks.forEach(block => {
      if (block.l1Number && block.l1Hash) {
        if (!map.has(block.l1Number)) {
          map.set(block.l1Number, {
            l1Number: block.l1Number,
            l1Hash: block.l1Hash,
            l2Blocks: [],
          });
        }
        map.get(block.l1Number)!.l2Blocks.push(block);
      }
    });
    return map;
  }, [blocks]);

  if (l1BlocksMap.size === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="h6"
        sx={{ color: '#e0e0e0', mb: 2, textAlign: 'center' }}
      >
        Connected L1 Blocks (Ethereum)
      </Typography>
      <Box
        onClick={onBackgroundClick}
        sx={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '150px',
          backgroundColor: '#0f0f0f',
          borderRadius: '8px',
          border: '1px solid #9c27b0',
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1a1a1a',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#9c27b0',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#ba68c8',
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            minWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {Array.from(l1BlocksMap.values()).map((l1Block, index) => {
              const isSelected = selectedL1Block === l1Block.l1Number;

              // Calculate position for L1 blocks
              const l1BlockOffset =
                (index - Math.floor(l1BlocksMap.size / 2)) * 180;

              return (
                <L1Block
                  key={l1Block.l1Number}
                  l1Block={l1Block}
                  currentPosition={currentPosition}
                  isSelected={isSelected}
                  offsetPx={l1BlockOffset}
                  onL1BlockClick={onL1BlockClick}
                />
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
