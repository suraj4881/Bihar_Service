import React, { useState } from 'react';
import {
  Drawer,
  Fab,
  Box,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import { SupportAgent, Close } from '@mui/icons-material';
import SupportChatWidget from './SupportChatWidget';

interface SupportChatFloatingWidgetProps {
  userId?: string;
  userRole?: string;
  userName?: string;
}

const SupportChatFloatingWidget: React.FC<SupportChatFloatingWidgetProps> = ({
  userId,
  userRole,
  userName,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1400,
          bgcolor: '#2563EB',
          '&:hover': { bgcolor: '#1D4ED8' },
          boxShadow: '0 16px 40px rgba(37, 99, 235, 0.35)',
        }}
      >
        <SupportAgent />
      </Fab>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            height: { xs: '85vh', md: '70vh' },
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3)',
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0F172A',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#1E3A8A', width: 34, height: 34 }}>
              <SupportAgent fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                Support Agent
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Live Support • 24/7
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, bgcolor: '#F4F7FF', height: '100%', overflow: 'auto' }}>
          <SupportChatWidget userId={userId} userRole={userRole} userName={userName} variant="plain" />
        </Box>
      </Drawer>
    </>
  );
};

export default SupportChatFloatingWidget;
