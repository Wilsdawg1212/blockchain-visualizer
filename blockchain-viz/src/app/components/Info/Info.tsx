'use client';

import * as React from 'react';
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

export default function Info() {
  return (
    <Box p={3} sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ color: '#e0e0e0', fontWeight: 'bold' }}>
        Info
      </Typography>
    </Box>
  );
}
