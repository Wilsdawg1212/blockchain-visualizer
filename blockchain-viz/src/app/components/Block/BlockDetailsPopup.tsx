'use client';

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Close, ContentCopy, CheckCircle } from '@mui/icons-material';
import { formatGwei } from 'viem';
import { UiBlock, RawBlock } from '../../stores/useBlockStore';

interface BlockDetailsPopupProps {
  open: boolean;
  onClose: () => void;
  block: UiBlock | null;
  rawBlock: RawBlock | null;
  confirmations: number;
}

export default function BlockDetailsPopup({
  open,
  onClose,
  block,
  rawBlock,
  confirmations,
}: BlockDetailsPopupProps) {
  const [copiedFields, setCopiedFields] = React.useState<Set<string>>(
    new Set()
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFields(prev => new Set([...prev, field]));
      setTimeout(() => {
        setCopiedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatTimestamp = (timestampMs: number) => {
    const date = new Date(timestampMs);
    return {
      local: date.toLocaleString(),
      utc: date.toUTCString(),
      relative: getRelativeTime(timestampMs),
    };
  };

  const getRelativeTime = (timestampMs: number) => {
    const now = Date.now();
    const diff = now - timestampMs;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  };

  const formatGasUsed = (gasUsed: bigint | undefined) => {
    if (!gasUsed) return '—';
    const gasUsedStr = gasUsed.toString();
    return gasUsedStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatGasLimit = (gasLimit: bigint | undefined) => {
    if (!gasLimit) return '—';
    const gasLimitStr = gasLimit.toString();
    return gasLimitStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const CopyableField = ({
    label,
    value,
    fieldName,
    monospace = false,
  }: {
    label: string;
    value: string;
    fieldName: string;
    monospace?: boolean;
  }) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        sx={{ color: '#ba68c8', mb: 0.5, fontWeight: 'bold' }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#1a1a1a',
          padding: 1,
          borderRadius: 1,
          border: '1px solid #4a4a4a',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#e0e0e0',
            fontFamily: monospace ? 'monospace' : 'inherit',
            wordBreak: 'break-all',
            flex: 1,
            fontSize: '12px',
          }}
        >
          {value}
        </Typography>
        <IconButton
          size="small"
          onClick={() => copyToClipboard(value, fieldName)}
          sx={{
            color: copiedFields.has(fieldName) ? '#4caf50' : '#9c27b0',
            '&:hover': {
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
            },
          }}
        >
          {copiedFields.has(fieldName) ? (
            <CheckCircle sx={{ fontSize: 16 }} />
          ) : (
            <ContentCopy sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );

  if (!block || !rawBlock) return null;

  const timestampInfo = formatTimestamp(block.timestampMs);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#0f0f0f',
          border: '2px solid #9c27b0',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#1a0a2e',
          color: '#ba68c8',
          borderBottom: '1px solid #9c27b0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Block #{block.number}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#ba68c8',
            '&:hover': {
              backgroundColor: 'rgba(186, 104, 200, 0.1)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 4 }}>
        {/* Header Info */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card
                sx={{ backgroundColor: '#1a1a1a', border: '1px solid #4a4a4a' }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#ba68c8', display: 'block' }}
                  >
                    Transactions
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: '#e0e0e0', fontWeight: 'bold' }}
                  >
                    {block.txCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                sx={{ backgroundColor: '#1a1a1a', border: '1px solid #4a4a4a' }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#ba68c8', display: 'block' }}
                  >
                    Confirmations
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: '#e0e0e0', fontWeight: 'bold' }}
                  >
                    {confirmations}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                sx={{ backgroundColor: '#1a1a1a', border: '1px solid #4a4a4a' }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#ba68c8', display: 'block' }}
                  >
                    Gas Used
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#e0e0e0',
                      fontWeight: 'bold',
                    }}
                  >
                    {formatGasUsed(rawBlock.gasUsed)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                sx={{ backgroundColor: '#1a1a1a', border: '1px solid #4a4a4a' }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#ba68c8', display: 'block' }}
                  >
                    Base Fee
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#e0e0e0',
                      fontWeight: 'bold',
                      fontSize: '19px',
                    }}
                  >
                    {rawBlock?.baseFeePerGas !== undefined &&
                    rawBlock?.baseFeePerGas !== null
                      ? `${formatGwei(rawBlock.baseFeePerGas)} gwei`
                      : '—'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Status Indicators */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={confirmations >= 5 ? 'Finalized' : 'Pending'}
              size="small"
              sx={{
                backgroundColor: confirmations >= 5 ? '#2e7d32' : '#f57c00',
                color: '#fff',
                fontWeight: 'bold',
              }}
            />
            {block.l1Number && (
              <Chip
                label={`L1 Block #${block.l1Number}`}
                size="small"
                sx={{
                  backgroundColor: '#4a148c',
                  color: '#ba68c8',
                  border: '1px solid #9c27b0',
                }}
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#4a4a4a', mb: 3 }} />

        {/* Detailed Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ba68c8', mb: 2 }}>
              Block Information
            </Typography>

            <CopyableField
              label="Block Hash"
              value={block.hash}
              fieldName="hash"
              monospace
            />

            <CopyableField
              label="Parent Hash"
              value={block.parentHash}
              fieldName="parentHash"
              monospace
            />

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: '#ba68c8', mb: 0.5, fontWeight: 'bold' }}
              >
                Timestamp
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#1a1a1a',
                  padding: 1,
                  borderRadius: 1,
                  border: '1px solid #4a4a4a',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e0e0', fontSize: '12px' }}
                >
                  {timestampInfo.local}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#a0a0a0', fontSize: '11px' }}
                >
                  {timestampInfo.relative}
                </Typography>
              </Box>
            </Box>

            {rawBlock.gasLimit && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#ba68c8', mb: 0.5, fontWeight: 'bold' }}
                >
                  Gas Limit
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#e0e0e0',
                    fontFamily: 'monospace',
                    backgroundColor: '#1a1a1a',
                    padding: 1,
                    borderRadius: 1,
                    border: '1px solid #4a4a4a',
                    fontSize: '12px',
                  }}
                >
                  {formatGasLimit(rawBlock.gasLimit)}
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ba68c8', mb: 2 }}>
              Layer 1 Connection
            </Typography>

            {block.l1Number && block.l1Hash ? (
              <>
                <CopyableField
                  label="L1 Block Number"
                  value={block.l1Number.toString()}
                  fieldName="l1Number"
                />

                <CopyableField
                  label="L1 Block Hash"
                  value={block.l1Hash}
                  fieldName="l1Hash"
                  monospace
                />

                {block.l1TimestampMs && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#ba68c8', mb: 0.5, fontWeight: 'bold' }}
                    >
                      L1 Timestamp
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: '#1a1a1a',
                        padding: 1,
                        borderRadius: 1,
                        border: '1px solid #4a4a4a',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#e0e0e0', fontSize: '12px' }}
                      >
                        {formatTimestamp(block.l1TimestampMs).local}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#a0a0a0', fontSize: '11px' }}
                      >
                        {formatTimestamp(block.l1TimestampMs).relative}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <Typography
                variant="body2"
                sx={{ color: '#a0a0a0', fontStyle: 'italic' }}
              >
                No L1 connection data available
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #4a4a4a',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#9c27b0',
            color: '#9c27b0',
            '&:hover': {
              borderColor: '#ba68c8',
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
