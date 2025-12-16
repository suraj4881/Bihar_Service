import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { Verified, Schedule, Cancel, Star } from '@mui/icons-material';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: 'verified' | 'pending' | 'rejected' | 'new' | 'active' | 'completed' | 'cancelled';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified',
          color: 'success' as const,
          icon: <Verified sx={{ fontSize: 16 }} />,
        };
      case 'pending':
        return {
          label: 'Pending',
          color: 'warning' as const,
          icon: <Schedule sx={{ fontSize: 16 }} />,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'error' as const,
          icon: <Cancel sx={{ fontSize: 16 }} />,
        };
      case 'new':
        return {
          label: 'New',
          color: 'info' as const,
          icon: <Star sx={{ fontSize: 16 }} />,
        };
      case 'active':
        return {
          label: 'Active',
          color: 'primary' as const,
          icon: null,
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'success' as const,
          icon: <Verified sx={{ fontSize: 16 }} />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'error' as const,
          icon: <Cancel sx={{ fontSize: 16 }} />,
        };
      default:
        return {
          label: status,
          color: 'default' as const,
          icon: null,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon || undefined}
      size="small"
      {...props}
      sx={{
        fontWeight: 600,
        ...props.sx,
      }}
    />
  );
};

export default StatusBadge;

