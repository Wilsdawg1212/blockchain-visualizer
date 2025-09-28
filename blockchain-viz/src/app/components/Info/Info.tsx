'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import ProjectOverview from './ProjectOverview';
import HowItWorks from './HowItWorks';
import ExampleBlock from './ExampleBlock';
import TechnicalArchitecture from './TechnicalArchitecture';
import UsageInstructions from './UsageInstructions';

export default function Info() {
  return (
    <Box p={3} sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{
          color: '#e0e0e0',
          fontWeight: 'bold',
          mb: 4,
          textAlign: 'center',
        }}
      >
        About Base Viz
      </Typography>

      <ProjectOverview />
      <HowItWorks />
      <ExampleBlock />
      <TechnicalArchitecture />
      <UsageInstructions />
    </Box>
  );
}
