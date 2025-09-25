// app/components/LiveBlocks.tsx
'use client';
import * as React from 'react';
import useLiveBlocks from '../hooks/useLiveBlocks';
import { useBlocksStore } from '../stores/useBlockStore';
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  NavigateBefore,
  NavigateNext,
  Search,
  Refresh,
} from '@mui/icons-material';
import { formatGwei } from 'viem';
import { uiBlockToRawBlock } from '../stores/useBlockStore';
import { Block } from './Block/Block';

const CONFIRMATIONS_TARGET = 5;

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString();
}

export default function LiveBlocks() {
  useLiveBlocks();
  const {
    getVisibleBlocks,
    isLiveMode,
    currentPosition,
    tipNumber,
    isLoadingHistorical,
    setLiveMode,
    navigateRelative,
    navigateToBlock,
    reset,
  } = useBlocksStore();

  const [searchBlock, setSearchBlock] = React.useState('');
  const [isNavigating, setIsNavigating] = React.useState(false);
  const tip = tipNumber;

  const visible = getVisibleBlocks();

  const blocks = React.useMemo(() => {
    const seen = new Set<string>(); // use hash to survive reorgs; fall back to number if needed
    const unique: typeof visible = [];
    for (const b of visible) {
      const k = b.hash ?? String(b.number);
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(b);
    }
    return unique.reverse();
  }, [visible]);


  const handleSearch = async () => {
    const blockNum = parseInt(searchBlock);
    if (!isNaN(blockNum)) {
      setIsNavigating(true);
      try {
        await navigateToBlock(blockNum);
      } finally {
        setIsNavigating(false);
        setSearchBlock('');
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleNavigateRelative = async (direction: 'prev' | 'next') => {
    setIsNavigating(true);
    try {
      await navigateRelative(direction);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleL1BlockClick = async (l1Block: {
    l1Number: number;
    l1Hash: string;
    l2Blocks: typeof blocks;
  }) => {
    if (l1Block.l2Blocks.length === 0) return;

    setIsNavigating(true);
    try {
      // Calculate the middle block number from the associated L2 blocks
      const l2BlockNumbers = l1Block.l2Blocks
        .map(block => block.number)
        .sort((a, b) => a - b);
      const middleIndex = Math.floor(l2BlockNumbers.length / 2);
      const middleBlockNumber = l2BlockNumbers[middleIndex];

      // Navigate to the middle L2 block
      await navigateToBlock(middleBlockNumber);
    } finally {
      setIsNavigating(false);
    }
  };

  // Find the current block index for centering
  const currentBlockIndex = blocks.findIndex(b => b.number === currentPosition);

  // Group L1 blocks to avoid duplicates
  const l1BlocksMap = new Map<
    number,
    { l1Number: number; l1Hash: string; l2Blocks: typeof blocks }
  >();
  blocks.forEach(block => {
    if (block.l1Number && block.l1Hash) {
      if (!l1BlocksMap.has(block.l1Number)) {
        l1BlocksMap.set(block.l1Number, {
          l1Number: block.l1Number,
          l1Hash: block.l1Hash,
          l2Blocks: [],
        });
      }
      l1BlocksMap.get(block.l1Number)!.l2Blocks.push(block);
    }
  });

  return (
    <Box p={3} sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ color: '#e0e0e0', fontWeight: 'bold' }}>
          Base Blockchain Visualizer
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={isLiveMode}
                onChange={e => setLiveMode(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#9c27b0',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#9c27b0',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: '#e0e0e0' }}>
                {isLiveMode ? 'Live Mode' : 'Historical Mode'}
              </Typography>
            }
          />

          <Button
            variant="outlined"
            onClick={reset}
            startIcon={<Refresh />}
            sx={{
              borderColor: '#9c27b0',
              color: '#9c27b0',
              '&:hover': {
                borderColor: '#ba68c8',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
              },
            }}
          >
            Reset
          </Button>
        </Stack>
      </Stack>

      {/* Controls */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          backgroundColor: '#0f0f0f',
          borderColor: '#9c27b0',
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography
              variant="subtitle2"
              sx={{ minWidth: 'fit-content', color: '#e0e0e0' }}
            >
              Current Position: #{currentPosition}
            </Typography>

            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => handleNavigateRelative('prev')}
                disabled={isNavigating || isLoadingHistorical}
                sx={{
                  color: '#9c27b0',
                  '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' },
                }}
              >
                <NavigateBefore />
              </IconButton>

              <IconButton
                onClick={() => handleNavigateRelative('next')}
                disabled={isNavigating || isLoadingHistorical}
                sx={{
                  color: '#9c27b0',
                  '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' },
                }}
              >
                <NavigateNext />
              </IconButton>
            </Stack>

            <TextField
              size="small"
              placeholder="Block number..."
              value={searchBlock}
              onChange={e => setSearchBlock(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isNavigating || isLoadingHistorical}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSearch}
                      disabled={isNavigating || isLoadingHistorical}
                      edge="end"
                      sx={{ color: '#9c27b0' }}
                    >
                      {isNavigating ? (
                        <CircularProgress size={20} sx={{ color: '#9c27b0' }} />
                      ) : (
                        <Search />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  color: '#e0e0e0',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#9c27b0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ba68c8',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ba68c8',
                  },
                },
              }}
              sx={{
                minWidth: '200px',
                '& .MuiInputBase-input': {
                  color: '#e0e0e0',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#a0a0a0',
                  opacity: 1,
                },
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Live Mode Indicator */}
      {isLiveMode && (
        <Card
          variant="outlined"
          sx={{
            mb: 3,
            backgroundColor: '#1a0a2e',
            borderColor: '#9c27b0',
            borderWidth: 2,
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <PlayArrow sx={{ color: '#9c27b0' }} />
              <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
                Live Mode - Watching for new blocks
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {isLoadingHistorical && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            sx={{
              backgroundColor: '#1a1a1a',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#9c27b0',
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{ color: '#e0e0e0', textAlign: 'center', mt: 1 }}
          >
            Loading historical blocks...
          </Typography>
        </Box>
      )}

      {/* Main Blocks Container */}
      <Box
        sx={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '300px',
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
          {blocks.length === 0 ? (
            <Card
              variant="outlined"
              sx={{
                backgroundColor: '#1a1a1a',
                borderColor: '#4a4a4a',
              }}
            >
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e0e0', textAlign: 'center' }}
                >
                  {isLoadingHistorical
                    ? 'Loading blocks...'
                    : 'No blocks found in this range'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
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
              {/* L2 Blocks - reversed order so newer blocks come from the right */}
              {blocks.map((b, index) => {
                const conf = Math.max(0, tip - b.number);
                const isCurrentBlock = b.number === currentPosition;

                // Convert UI block back to raw block for display (string -> BigInt)
                const rawBlock = uiBlockToRawBlock(b);

                // Calculate position - center the current block, reverse order
                const blockOffset = (index - currentBlockIndex) * 220; // 220px spacing between blocks

                return (
                  <Block block={b.hash} />
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* L1 Blocks Section - Below L2 blocks */}
      {l1BlocksMap.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="h6"
            sx={{ color: '#e0e0e0', mb: 2, textAlign: 'center' }}
          >
            Connected L1 Blocks (Ethereum)
          </Typography>
          <Box
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
                  const isConnectedToCurrent = l1Block.l2Blocks.some(
                    l2Block => l2Block.number === currentPosition
                  );

                  // Calculate position for L1 blocks
                  const l1BlockOffset =
                    (index - Math.floor(l1BlocksMap.size / 2)) * 180;

                  return (
                    <Box
                      key={l1Block.l1Number}
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translateX(${l1BlockOffset}px)`,
                        zIndex: 2,
                        transition: 'transform 0.3s ease-in-out',
                      }}
                    >
                      {/* Circular L1 Block */}
                      <Box
                        onClick={() => handleL1BlockClick(l1Block)}
                        sx={{
                          width: '120px',
                          height: '120px',
                          backgroundColor: isConnectedToCurrent
                            ? '#1a0a2e'
                            : '#1a1a1a',
                          border: isConnectedToCurrent
                            ? '3px solid #9c27b0'
                            : '2px solid #4a4a4a',
                          borderRadius: '50%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isConnectedToCurrent
                            ? '0 0 20px rgba(156, 39, 176, 0.4)'
                            : '0 2px 8px rgba(0,0,0,0.3)',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 0 25px rgba(156, 39, 176, 0.6)',
                          },
                        }}
                      >
                        {/* L1 Label */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: isConnectedToCurrent ? '#ba68c8' : '#e0e0e0',
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
                            color: isConnectedToCurrent ? '#ba68c8' : '#e0e0e0',
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
                            color: isConnectedToCurrent ? '#ba68c8' : '#e0e0e0',
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
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Navigation Instructions */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
          Use the navigation buttons or scroll horizontally to explore blocks
        </Typography>
      </Box>
    </Box>
  );
}
