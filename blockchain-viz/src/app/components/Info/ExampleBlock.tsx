'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { ExpandMore, Code } from '@mui/icons-material';

export default function ExampleBlock() {
  return (
    <Card sx={{ mb: 4, backgroundColor: '#0f0f0f', borderColor: '#9c27b0' }}>
      <CardContent>
        <Typography
          variant="h5"
          sx={{
            color: '#ba68c8',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Code sx={{ color: '#9c27b0' }} />
          Example Block Structure
        </Typography>

        {/* Visual Block Example */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Card
            sx={{
              width: '200px',
              height: '180px',
              backgroundColor: '#1a0a2e',
              border: '3px solid #9c27b0',
              boxShadow: '0 0 20px rgba(156, 39, 176, 0.3)',
              position: 'relative',
            }}
          >
            {/* Block Number */}
            <Box
              sx={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#9c27b0',
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
              12345678
            </Box>

            <CardContent sx={{ padding: '20px 8px 8px 8px', height: '100%' }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#ba68c8',
                  fontSize: '10px',
                  display: 'block',
                  textAlign: 'center',
                  mb: 1,
                  fontFamily: 'monospace',
                }}
              >
                0x1234...5678
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#ba68c8',
                  fontSize: '10px',
                  display: 'block',
                  textAlign: 'center',
                  mb: 1,
                }}
              >
                42 tx
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#ba68c8',
                  fontSize: '9px',
                  display: 'block',
                  textAlign: 'center',
                  mb: 1,
                  fontFamily: 'monospace',
                }}
              >
                Gas: 15,000,000
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#ba68c8',
                  fontSize: '9px',
                  display: 'block',
                  textAlign: 'center',
                  mb: 1,
                  fontFamily: 'monospace',
                }}
              >
                0.001 gwei
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Chip
                  label="L1 #19876543"
                  size="small"
                  sx={{
                    backgroundColor: '#4a148c',
                    color: '#ba68c8',
                    fontSize: '9px',
                    height: '18px',
                    border: '1px solid #9c27b0',
                  }}
                />
              </Box>

              <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Chip
                  label="5 confs"
                  size="small"
                  sx={{
                    backgroundColor: '#4a148c',
                    color: '#ba68c8',
                    fontSize: '9px',
                    height: '18px',
                    border: '1px solid #9c27b0',
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: '#ba68c8',
                  fontSize: '9px',
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
              >
                14:32:15
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Field Explanations */}
        <Accordion
          sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              Block Number (Top Circle)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              The sequential number of this block in the blockchain. Each new
              block increments this number by 1. This is the primary
              identifier for locating and referencing blocks.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              Block Hash (Top Line)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              A unique cryptographic fingerprint of the block's contents. This
              hash is calculated from all the data in the block and serves as
              a tamper-proof identifier. Even a tiny change in the block would
              produce a completely different hash.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              Transaction Count
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              The number of transactions included in this block. Each
              transaction represents a transfer of value, smart contract
              interaction, or other blockchain operation. Higher transaction
              counts indicate more activity.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              Gas Used & Base Fee
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              <strong>Gas Used:</strong> The total computational work
              performed by all transactions in this block.
              <br />
              <br />
              <strong>Base Fee:</strong> The minimum fee (in gwei) required to
              include a transaction in this block. This fee adjusts
              dynamically based on network congestion.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              L1 Block Reference
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Shows which Ethereum (Layer 1) block this Base (Layer 2) block
              is derived from. This creates a connection between the two
              blockchains, allowing Base to inherit Ethereum's security while
              providing faster and cheaper transactions.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              Confirmations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              The number of blocks that have been added after this block.
              Higher confirmations mean the block is more secure and less
              likely to be reorganized. Blocks with 5+ confirmations are
              generally considered final.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#9c27b0' }} />}
          >
            <Typography sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
              Timestamp
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              The exact time when this block was mined, displayed in local
              time format. This helps you understand the timing and sequence
              of blockchain activity.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
