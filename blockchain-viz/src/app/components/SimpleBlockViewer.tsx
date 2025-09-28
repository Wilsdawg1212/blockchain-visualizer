'use client';
import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button,
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import {
  useBlocksStore,
  UiBlock,
  uiBlockToRawBlock,
} from '../stores/useBlockStore';
import BlockDetailsPopup from './Block/BlockDetailsPopup';

export default function SimpleBlockViewer() {
  const {
    navigateToBlock,
    isLoadingHistorical,
    currentPosition,
    blocks,
    tipNumber,
    setCurrentPosition,
    setLiveMode,
  } = useBlocksStore();
  const [searchBlock, setSearchBlock] = React.useState('');
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [searchedBlock, setSearchedBlock] = React.useState<UiBlock | null>(
    null
  );
  const [lastSearchedNumber, setLastSearchedNumber] = React.useState<
    number | null
  >(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Block details popup state
  const [popupOpen, setPopupOpen] = React.useState(false);

  // Watch for when the searched block appears in the store
  React.useEffect(() => {
    if (lastSearchedNumber !== null) {
      const foundBlock = blocks.find(b => b.number === lastSearchedNumber);
      if (foundBlock) {
        console.log(
          '🎯 SimpleBlockViewer - Block found in store after loading:',
          foundBlock
        );
        setSearchedBlock(foundBlock);
        setLastSearchedNumber(null); // Reset to avoid re-triggering
      }
    }
  }, [blocks, lastSearchedNumber]);

  const handleSearch = async () => {
    const blockNum = parseInt(searchBlock);
    if (!isNaN(blockNum)) {
      console.log(
        '🔍 SimpleBlockViewer - Starting search for block:',
        blockNum
      );
      setIsNavigating(true);
      setSearchError(null); // Clear any previous errors

      try {
        console.log(
          '🚀 SimpleBlockViewer - Calling navigateToBlock with:',
          blockNum
        );
        await navigateToBlock(blockNum);
        console.log(
          '✅ SimpleBlockViewer - navigateToBlock completed for block:',
          blockNum
        );

        // Set the searched number so the useEffect can watch for it
        setLastSearchedNumber(blockNum);
        console.log(
          '🔍 SimpleBlockViewer - Set lastSearchedNumber to:',
          blockNum
        );
      } catch (error) {
        console.error('❌ SimpleBlockViewer - Error during navigation:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setSearchError(errorMessage);
      } finally {
        setIsNavigating(false);
        setSearchBlock('');
        console.log('🏁 SimpleBlockViewer - Search completed');
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

  const handleReset = () => {
    setSearchedBlock(null);
    setSearchBlock('');
    setLastSearchedNumber(null);
    setSearchError(null);
  };

  const handleBlockClick = () => {
    if (searchedBlock) {
      // Set the searched block as current position and switch to historical mode
      setCurrentPosition(searchedBlock.number);
      setLiveMode(false);

      // Open the popup with block details
      setPopupOpen(true);
    }
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
  };

  return (
    <Box p={3} sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ color: '#e0e0e0', fontWeight: 'bold' }}>
          Simple Block Viewer
        </Typography>

        <Button
          variant="outlined"
          onClick={handleReset}
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

      {/* Search Controls */}
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

      {/* Loading Indicator */}
      {isLoadingHistorical && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: '#e0e0e0', textAlign: 'center', mt: 1 }}
          >
            Loading historical block...
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

      {/* Debug Info */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          backgroundColor: '#0f0f0f',
          borderColor: '#4a4a4a',
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 2 }}>
            Debug Info
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Total blocks in store: {blocks.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Current position: {currentPosition}
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Is loading: {isLoadingHistorical ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Searched block found:{' '}
              {searchedBlock ? `Block #${searchedBlock.number}` : 'None'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Block numbers in store: {blocks.map(b => b.number).join(', ')}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Block Display */}
      {searchedBlock ? (
        <Card
          variant="outlined"
          onClick={handleBlockClick}
          sx={{
            backgroundColor: '#1a0a2e',
            borderColor: '#9c27b0',
            borderWidth: 3,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 25px rgba(156, 39, 176, 0.4)',
              borderColor: '#ba68c8',
            },
          }}
        >
          <CardContent>
            <Typography variant="h5" sx={{ color: '#ba68c8', mb: 2 }}>
              Block #{searchedBlock.number}
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                <strong>Hash:</strong> {searchedBlock.hash}
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                <strong>Parent Hash:</strong> {searchedBlock.parentHash}
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                <strong>Timestamp:</strong>{' '}
                {new Date(searchedBlock.timestampMs).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                <strong>Transaction Count:</strong> {searchedBlock.txCount}
              </Typography>
              {searchedBlock.l1Number && (
                <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                  <strong>L1 Block:</strong> #{searchedBlock.l1Number}
                </Typography>
              )}
            </Stack>
            <Typography
              variant="caption"
              sx={{
                color: '#ba68c8',
                mt: 2,
                display: 'block',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              Click to select this block and view detailed information
            </Typography>
          </CardContent>
        </Card>
      ) : (
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
                ? 'Loading block...'
                : 'Search for a block number to view its details'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Block Details Popup */}
      {searchedBlock && (
        <BlockDetailsPopup
          open={popupOpen}
          onClose={handleClosePopup}
          block={searchedBlock}
          rawBlock={uiBlockToRawBlock(searchedBlock)}
          confirmations={Math.max(0, tipNumber - searchedBlock.number)}
        />
      )}
    </Box>
  );
}
