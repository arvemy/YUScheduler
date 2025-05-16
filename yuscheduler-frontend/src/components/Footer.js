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
        mt: { xs: 4, sm: 8 },
        py: { xs: 1.5, sm: 2.5 },
        px: { xs: 1, sm: 3 },
        textAlign: 'center',
        color: 'primary.dark',
        background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
        borderRadius: 3,
        boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.08)',
        fontFamily: 'Montserrat, Roboto, Arial',
        maxWidth: { xs: 280, sm: 340 },
        mx: 'auto',
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: 15, sm: 17 },
          letterSpacing: 1,
          color: 'primary.dark',
          fontFamily: 'Montserrat, Roboto, Arial',
        }}
      >
        Made with ❤️ for{' '}
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            animation: `${dropAnimation} 2s infinite`
          }}
        >
          YOU
        </Box>
      </Typography>
    </Box>
  );
};

export default Footer; 