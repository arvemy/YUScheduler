import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';

const dropAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(10px); }
  100% { transform: translateY(0); }
`;

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        Made with ❤️ for <span style={{ animation: `${dropAnimation} 2s infinite` }}>YOU</span>
      </Typography>
    </Box>
  );
};

export default Footer; 