'use client';

import * as React from 'react';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { formatGwei } from 'viem';
import { UiBlock, RawBlock } from '../../stores/useBlockStore';

const CONFIRMATIONS_TARGET = 5;

type BlockProps = {
  block: UiBlock;
  isCurrentBlock: boolean;
  confirmations: number;
  offsetPx: number;
  rawBlock: RawBlock;
};

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString();
}

export default function Block({
  block,
  isCurrentBlock,
  confirmations,
  offsetPx,
  rawBlock,
}: BlockProps) {
  return (
    <Box
      key={block.hash}
      sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateX(${offsetPx}px)`,
        zIndex: 2,
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <Card
        variant="outlined"
        sx={{
          width: '200px',
          height: '180px',
          border: isCurrentBlock ? 3 : 1,
          borderColor: isCurrentBlock ? '#9c27b0' : '#4a4a4a',
          backgroundColor: isCurrentBlock ? '#1a0a2e' : '#1a1a1a',
          boxShadow: isCurrentBlock
            ? '0 0 20px rgba(156, 39, 176, 0.3)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Block Number at Top */}
        <Box
          sx={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isCurrentBlock ? '#9c27b0' : '#4a4a4a',
            color: '#e0e0e0',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {block.number}
        </Box>

        {/* Current Block Indicator */}
        {isCurrentBlock && (
          <Box
            sx={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#9c27b0',
              color: '#e0e0e0',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            CURRENT
          </Box>
        )}

        <CardContent
          sx={{
            padding: '20px 8px 8px 8px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: isCurrentBlock ? '#1a0a2e' : '#1a1a1a',
          }}
        >
          {/* Hash (truncated) */}
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
              wordBreak: 'break-all',
              fontSize: '10px',
              lineHeight: 1.2,
              textAlign: 'center',
              mb: 1,
            }}
          >
            {block.hash.slice(0, 8)}...{block.hash.slice(-6)}
          </Typography>

          {/* Transaction Count */}
          <Typography
            variant="caption"
            sx={{
              color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
              fontSize: '10px',
              textAlign: 'center',
              mb: 1,
            }}
          >
            {block.txCount} tx
          </Typography>

          {/* Gas Used */}
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
              fontSize: '9px',
              textAlign: 'center',
              display: 'block',
              mb: 1,
            }}
          >
            Gas: {rawBlock?.gasUsed?.toString().slice(0, 6) || '—'}
          </Typography>

          {/* Base Fee */}
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
              fontSize: '9px',
              textAlign: 'center',
              display: 'block',
              mb: 1,
            }}
          >
            {rawBlock?.baseFeePerGas !== undefined &&
            rawBlock?.baseFeePerGas !== null
              ? `${formatGwei(rawBlock.baseFeePerGas)} gwei`
              : '—'}
          </Typography>

          {/* L1 Block Info */}
          {block.l1Number && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Chip
                label={`L1 #${block.l1Number}`}
                size="small"
                sx={{
                  backgroundColor: isCurrentBlock ? '#4a148c' : '#2a2a2a',
                  color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
                  fontSize: '9px',
                  height: '18px',
                  border: '1px solid #9c27b0',
                }}
              />
            </Box>
          )}

          {/* Confirmations */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Chip
              label={`${confirmations} confs`}
              size="small"
              sx={{
                backgroundColor:
                  confirmations >= CONFIRMATIONS_TARGET
                    ? isCurrentBlock
                      ? '#4a148c'
                      : '#2a2a2a'
                    : isCurrentBlock
                      ? '#4a148c'
                      : '#2a2a2a',
                color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
                fontSize: '9px',
                height: '18px',
                border: '1px solid #9c27b0',
              }}
            />
          </Box>

          {/* Time */}
          <Typography
            variant="caption"
            sx={{
              color: isCurrentBlock ? '#ba68c8' : '#e0e0e0',
              fontSize: '9px',
              textAlign: 'center',
              fontFamily: 'monospace',
              display: 'block',
              mt: 0.5,
            }}
          >
            {fmtTime(block.timestampMs)}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
