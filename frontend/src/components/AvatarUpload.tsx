import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button,
  Typography,
  Badge,
} from '@mui/material';
import {
  PhotoCamera,
  Person,
  EmojiEmotions,
  Face,
  AccountCircle,
} from '@mui/icons-material';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatar: string) => void;
  size?: number;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar = '',
  onAvatarChange,
  size = 120,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Default avatars
  const defaultAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedAvatar(result);
        onAvatarChange(result);
        setOpenDialog(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectDefault = (avatar: string) => {
    setSelectedAvatar(avatar);
    onAvatarChange(avatar);
    setOpenDialog(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <IconButton
              sx={{
                bgcolor: '#667eea',
                color: 'white',
                width: 40,
                height: 40,
                '&:hover': { bgcolor: '#764ba2' },
                boxShadow: 3,
              }}
              onClick={() => setOpenDialog(true)}
            >
              <PhotoCamera sx={{ fontSize: 20 }} />
            </IconButton>
          }
        >
          <Avatar
            src={selectedAvatar}
            sx={{
              width: size,
              height: size,
              bgcolor: '#667eea',
              fontSize: size / 3,
              border: '4px solid white',
              boxShadow: 4,
            }}
          >
            {!selectedAvatar && <Person sx={{ fontSize: size / 2 }} />}
          </Avatar>
        </Badge>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Click camera to change
        </Typography>
      </Box>

      {/* Avatar Selection Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>
          Choose Your Avatar
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              Upload Your Photo
            </Typography>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<PhotoCamera />}
              sx={{
                py: 2,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': { borderColor: '#764ba2', bgcolor: 'rgba(102,126,234,0.08)' },
              }}
            >
              Upload from Device
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Or Choose a Default Avatar
          </Typography>
          <Grid container spacing={2}>
            {defaultAvatars.map((avatar, index) => (
              <Grid item xs={3} key={index}>
                <Avatar
                  src={avatar}
                  onClick={() => handleSelectDefault(avatar)}
                  sx={{
                    width: 70,
                    height: 70,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: selectedAvatar === avatar ? '3px solid #667eea' : '2px solid #e0e0e0',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: 4,
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <Button
            fullWidth
            variant="text"
            onClick={() => setOpenDialog(false)}
            sx={{ mt: 3 }}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUpload;

