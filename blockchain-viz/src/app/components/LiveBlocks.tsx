// app/components/LiveBlocks.tsx
'use client';
import * as React from 'react';
import useLiveBlocks from '../hooks/useLiveBlocks';
import { useBlocksStore } from '../stores/useBlockStore';
import {
  Box,
  Card,
  CardContent,
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
import { uiBlockToRawBlock, UiBlock, RawBlock } from '../stores/useBlockStore';
import Block from './Block/Block';
import BlockDetailsPopup from './Block/BlockDetailsPopup';

export default function LiveBlocks() {
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
    setCurrentPosition,
  } = useBlocksStore();

  // Always call the hook, but it will be conditional internally
  useLiveBlocks();

  const [searchBlock, setSearchBlock] = React.useState('');
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Block details popup state
  const [selectedBlock, setSelectedBlock] = React.useState<UiBlock | null>(
    null
  );
  const [selectedRawBlock, setSelectedRawBlock] =
    React.useState<RawBlock | null>(null);
  const [selectedConfirmations, setSelectedConfirmations] = React.useState(0);
  const [popupOpen, setPopupOpen] = React.useState(false);

  // L1 block highlighting state
  const [selectedL1Block, setSelectedL1Block] = React.useState<number | null>(
    null
  );

  const visible = getVisibleBlocks();

  // Debug: Log tip number changes
  React.useEffect(() => {
    console.log('Tip number changed to:', tipNumber);
  }, [tipNumber]);

  // Debug: Log visible blocks changes
  React.useEffect(() => {
    console.log(
      '🔍 LiveBlocks - visible blocks changed:',
      visible.map(b => b.number),
      'count:',
      visible.length
    );
    console.log('🔍 LiveBlocks - current state:', {
      isLiveMode,
      currentPosition,
      tipNumber,
      isLoadingHistorical,
    });
  }, [visible, isLiveMode, currentPosition, tipNumber, isLoadingHistorical]);

  const blocks = React.useMemo(() => {
    console.log(
      '🔄 Processing visible blocks for display:',
      visible.map(b => b.number)
    );
    const seen = new Set<string>(); // use hash to survive reorgs; fall back to number if needed
    const unique: typeof visible = [];
    for (const b of visible) {
      const k = b.hash ?? String(b.number);
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(b);
    }
    const reversed = unique.reverse();
    console.log(
      '🎨 Final blocks for display:',
      reversed.map(b => b.number)
    );
    return reversed;
  }, [visible]);

  const handleSearch = async () => {
    const blockNum = parseInt(searchBlock);
    if (!isNaN(blockNum)) {
      console.log('🔍 Starting search for block:', blockNum);
      setIsNavigating(true);
      setSearchError(null); // Clear any previous errors

      try {
        console.log('🚀 Calling navigateToBlock with:', blockNum);
        await navigateToBlock(blockNum);
        console.log('✅ navigateToBlock completed for block:', blockNum);
      } catch (error) {
        console.error('❌ Error during navigation:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setSearchError(errorMessage);
      } finally {
        setIsNavigating(false);
        setSearchBlock('');
        console.log('🏁 Search completed, navigation state reset');
      }
    } else {
      setSearchError('Please enter a valid block number');
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

    // Toggle L1 block selection for highlighting
    if (selectedL1Block === l1Block.l1Number) {
      setSelectedL1Block(null); // Deselect if same block is clicked
      return;
    } else {
      setSelectedL1Block(l1Block.l1Number); // Select the L1 block
    }

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

  const handleBlockClick = (
    block: UiBlock,
    rawBlock: RawBlock,
    confirmations: number
  ) => {
    // Set the clicked block as current position and switch to historical mode
    setCurrentPosition(block.number);
    setLiveMode(false);

    // Open the popup with block details
    setSelectedBlock(block);
    setSelectedRawBlock(rawBlock);
    setSelectedConfirmations(confirmations);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedBlock(null);
    setSelectedRawBlock(null);
    setSelectedConfirmations(0);
  };

  const handleBackgroundClick = (event: React.MouseEvent) => {
    // Clear L1 selection when clicking on background
    if (event.target === event.currentTarget) {
      setSelectedL1Block(null);
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

        {/* Desktop Header Controls */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
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

        {/* Mobile Header Controls */}
        <Stack
          spacing={2}
          alignItems="center"
          sx={{ display: { xs: 'flex', md: 'none' } }}
        >
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
          {/* Desktop Layout */}
          <Box
            sx={{
              width: '100%',
              position: 'relative',
              minHeight: '40px',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
            }}
          >
            {/* Left side - Current Position */}
            <Typography
              variant="h6"
              sx={{
                color: '#e0e0e0',
                fontWeight: 'bold',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              Current Position: #{currentPosition}
            </Typography>

            {/* Center - Navigation Arrows */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
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

            {/* Right side - Search Bar */}
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
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                '& .MuiInputBase-input': {
                  color: '#e0e0e0',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#a0a0a0',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Mobile Layout */}
          <Stack
            spacing={2}
            sx={{
              display: { xs: 'flex', md: 'none' },
              width: '100%',
            }}
          >
            {/* Current Position - Mobile */}
            <Typography
              variant="h6"
              sx={{
                color: '#e0e0e0',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Current Position: #{currentPosition}
            </Typography>

            {/* Navigation Arrows - Mobile */}
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
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

            {/* Search Bar - Mobile */}
            <TextField
              size="small"
              placeholder="Block number..."
              value={searchBlock}
              onChange={e => setSearchBlock(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isNavigating || isLoadingHistorical}
              fullWidth
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

      {/* Error Display */}
      {searchError && (
        <Card
          variant="outlined"
          sx={{
            mb: 3,
            backgroundColor: '#2d1b1b',
            borderColor: '#d32f2f',
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{ color: '#f44336', textAlign: 'center' }}
            >
              {searchError}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Main Blocks Container */}
      <Box
        onClick={handleBackgroundClick}
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
                const conf = Math.max(0, tipNumber - b.number);
                const isCurrentBlock = b.number === currentPosition;
                // Check if this L2 block belongs to the selected L1 block
                const isHighlighted =
                  selectedL1Block !== null && b.l1Number === selectedL1Block;
                // If L1 is selected, current block should use highlighting instead of current styling
                const shouldUseCurrentStyling =
                  isCurrentBlock && !isHighlighted;

                // Debug: Log confirmation calculation
                if (index < 2) {
                  console.log(
                    `Block ${b.number}: tip=${tipNumber}, conf=${conf}`
                  );
                }

                // Convert UI block back to raw block for display (string -> BigInt)
                const rawBlock = uiBlockToRawBlock(b);

                // Calculate position - center the current block, reverse order
                const blockOffset = (index - currentBlockIndex) * 220; // 220px spacing between blocks

                return (
                  <Block
                    key={b.hash} // <-- key belongs here, not inside child
                    block={b}
                    isCurrentBlock={shouldUseCurrentStyling}
                    isHighlighted={isHighlighted}
                    confirmations={conf}
                    offsetPx={blockOffset}
                    rawBlock={rawBlock}
                    onBlockClick={handleBlockClick}
                  />
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
                  const isSelected = selectedL1Block === l1Block.l1Number;

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
                            transform: isSelected
                              ? 'scale(1.15)'
                              : 'scale(1.05)',
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
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Navigation Instructions */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
          Use the navigation buttons or scroll horizontally to explore blocks.
          Click on any block to select it, view details, and switch to
          historical mode.
        </Typography>
      </Box>

      {/* Block Details Popup */}
      <BlockDetailsPopup
        open={popupOpen}
        onClose={handleClosePopup}
        block={selectedBlock}
        rawBlock={selectedRawBlock}
        confirmations={selectedConfirmations}
      />
    </Box>
  );
}
