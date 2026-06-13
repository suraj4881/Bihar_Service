import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  SupportAgent,
  Send,
  ConfirmationNumber,
  PriorityHigh,
  Subject,
  Description,
  AttachFile,
  Category,
} from '@mui/icons-material';
import AppBar from '../components/AppBar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const categoryOptions = [
  { value: 'BOOKING', label: 'Booking Issue' },
  { value: 'SERVICE', label: 'Service Issue' },
  { value: 'PAYMENT', label: 'Payment Issue' },
  { value: 'ACCOUNT', label: 'Account Issue' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const SupportRequestPage: React.FC = () => {
  const { user, provider } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = user?.id || provider?.id || '';
  const currentRole = user?.role || (provider ? 'PROVIDER' : '');
  const currentName = user?.name || provider?.name || '';
  const currentPhone = user?.phone || provider?.phone || '';

  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  const [form, setForm] = useState({
    category: 'BOOKING',
    bookingId: '',
    subject: '',
    description: '',
    priority: 'NORMAL',
  });

  useEffect(() => {
    const state = location.state as { bookingId?: string; category?: string } | null;
    const params = new URLSearchParams(location.search);
    const bookingIdFromState = state?.bookingId || params.get('bookingId');
    const categoryFromState = state?.category || params.get('category');

    if (bookingIdFromState) {
      setForm((prev) => ({ ...prev, bookingId: bookingIdFromState }));
    }
    if (categoryFromState) {
      setForm((prev) => ({ ...prev, category: categoryFromState }));
    }
  }, [location.search, location.state]);

  useEffect(() => {
    if (!currentUserId || !currentRole) return;
    setLoadingBookings(true);
    const fetchBookings = async () => {
      try {
        const endpoint =
          currentRole === 'PROVIDER'
            ? getApiUrl(`bookings/provider/${currentUserId}`)
            : getApiUrl(`bookings/user/${currentUserId}`);
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.success && data.data) {
          setBookings(data.data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [currentUserId, currentRole]);

  useEffect(() => {
    if (!currentUserId) return;
    let isActive = true;
    const fetchTickets = async () => {
      try {
        const response = await fetch(getApiUrl(`support/tickets/user/${currentUserId}`));
        const data = await response.json();
        if (isActive && data.success && data.data) {
          const openTicket = data.data.find((ticket: any) => ticket.status !== 'CLOSED');
          setActiveTicket(openTicket || null);
        }
      } catch (err) {
        if (isActive) {
          setActiveTicket(null);
        }
      }
    };
    fetchTickets();
    const intervalId = setInterval(fetchTickets, 10000);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [currentUserId]);

  const bookingOptions = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        label: `${booking.serviceName || booking.service || 'Service'} • ${booking.status || 'PENDING'}`,
        serviceId: booking.serviceId,
      })),
    [bookings]
  );

  const selectedBooking = bookingOptions.find((booking) => booking.id === form.bookingId);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!form.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!form.description.trim()) {
      setError('Please describe your issue');
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('userId', currentUserId);
      if (currentRole) payload.append('userRole', currentRole);
      if (currentName) payload.append('userName', currentName);
      if (currentPhone) payload.append('userPhone', currentPhone);
      if (form.bookingId) payload.append('bookingId', form.bookingId);
      if (selectedBooking?.serviceId) payload.append('serviceId', selectedBooking.serviceId);
      payload.append('category', form.category);
      payload.append('subject', form.subject);
      payload.append('description', form.description);
      payload.append('priority', form.priority);
      attachments.forEach((file) => {
        payload.append('attachments', file);
      });

      const response = await fetch('http://localhost:8080/api/support/tickets', {
        method: 'POST',
        body: payload,
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;
      if (response.ok && data?.success) {
        setSuccess(`Ticket created successfully. Ticket ID: ${data.data?.id || ''}`);
        setActiveTicket(data.data || null);
        setForm({
          category: 'BOOKING',
          bookingId: '',
          subject: '',
          description: '',
          priority: 'NORMAL',
        });
        setAttachments([]);
      } else {
        const fallbackMessage = data?.message || `Failed to create ticket (status ${response.status})`;
        setError(fallbackMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeTicket || !chatMessage.trim()) return;
    try {
      const payload = {
        senderRole: currentRole,
        senderName: currentName,
        message: chatMessage.trim(),
      };
      const response = await fetch(getApiUrl(`support/tickets/${activeTicket.id}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data?.success) {
        setActiveTicket(data.data);
        setChatMessage('');
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar variant="simple" position="sticky" showBackButton showNavLinks={false} showAuthButtons={false} />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Card
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 4 },
            color: '#fff',
            background: sewaHeroBarGradient,
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 48px rgba(0, 77, 64, 0.28)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12) 0%, transparent 45%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
              {language === 'hi' ? 'मदद और सहायता' : 'Help & support'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 640 }}>
              {language === 'hi'
                ? 'बुकिंग, सेवा, भुगतान या खाते से जुड़ी समस्या के लिए तेज़ सहायता।'
                : 'Fast help for booking, service, payment, or account questions.'}
            </Typography>
          </Box>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {activeTicket && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You already have an active support ticket. Please use the chat. New ticket opens after closure.
          </Alert>
        )}

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <ConfirmationNumber fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                      Create Support Ticket
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Share details so our agent can resolve faster.
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Issue Category"
                      value={form.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      disabled={Boolean(activeTicket)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Category fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {categoryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Priority"
                      value={form.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      disabled={Boolean(activeTicket)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PriorityHigh fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {priorityOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Related Booking (optional)"
                      value={form.bookingId}
                      onChange={(e) => handleChange('bookingId', e.target.value)}
                      helperText={loadingBookings ? 'Loading bookings...' : 'Choose a booking if this issue is booking related'}
                      disabled={loadingBookings || Boolean(activeTicket)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ConfirmationNumber fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">No booking selected</MenuItem>
                      {bookingOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      disabled={Boolean(activeTicket)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Subject fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Describe your issue"
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      multiline
                      rows={5}
                      disabled={Boolean(activeTicket)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="file"
                      label="Attachments (optional)"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ multiple: true, accept: '.jpg,.jpeg,.png,.pdf' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachFile fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      onChange={(e) => {
                        const files = (e.target as HTMLInputElement).files;
                        setAttachments(Array.from(files || []));
                      }}
                      helperText="Upload screenshots or documents (JPG, PNG, PDF up to 10MB each)"
                      disabled={Boolean(activeTicket)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={() => navigate(-1)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting || Boolean(activeTicket)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 999,
                          px: 3,
                          background: sewaPrimaryButtonGradient,
                          '&:hover': { background: sewaPrimaryButtonHover },
                        }}
                      >
                        {submitting ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Submit Ticket'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.1)' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 180 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'rgba(37, 99, 235, 0.12)', color: 'primary.main', width: 36, height: 36 }}>
                      <SupportAgent fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Support Status
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Average response: 5-10 minutes • 24/7 support
                  </Typography>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Ticket
                    </Typography>
                    <Chip
                      label={activeTicket ? activeTicket.status : 'NONE'}
                      color={activeTicket ? (activeTicket.status === 'OPEN' ? 'warning' : activeTicket.status === 'IN_PROGRESS' ? 'info' : 'success') : 'default'}
                    />
                  </Box>
                  {activeTicket && (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      #{activeTicket.id?.slice(-6)} • {activeTicket.subject}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 4, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36 }}>
                      <SupportAgent fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                        Support Agent
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Live Support • 24/7
                      </Typography>
                    </Box>
                  </Box>
                  {activeTicket && (
                    <Chip
                      label={activeTicket.status}
                      color={activeTicket.status === 'OPEN' ? 'warning' : activeTicket.status === 'IN_PROGRESS' ? 'info' : 'success'}
                      size="small"
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {activeTicket ? `Ticket #${activeTicket.id?.slice(-6)} • ${activeTicket.subject || 'Support'}` : 'Create a ticket to start chat.'}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    maxHeight: 280,
                    overflowY: 'auto',
                    mb: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                  }}
                >
                  {(activeTicket?.messages || []).map((msg: any, index: number) => {
                    const senderRole = (msg.senderRole || '').toUpperCase();
                    const isSelf = currentRole && senderRole === currentRole.toUpperCase();
                    return (
                      <Box
                        key={`${activeTicket?.id}-${index}`}
                        sx={{
                          display: 'flex',
                          justifyContent: isSelf ? 'flex-end' : 'flex-start',
                          mb: 1.2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isSelf ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: 1,
                            maxWidth: '85%',
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: isSelf ? 'primary.main' : 'grey.800',
                              fontSize: 12,
                            }}
                          >
                            {isSelf ? (currentName || 'U').charAt(0).toUpperCase() : 'A'}
                          </Avatar>
                          <Box
                            sx={{
                              maxWidth: '75%',
                              px: 1.5,
                              py: 1,
                              borderRadius: 2.5,
                              bgcolor: isSelf ? 'primary.main' : 'background.paper',
                              color: isSelf ? 'primary.contrastText' : 'text.primary',
                              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                            }}
                          >
                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                              {msg.senderName || msg.senderRole || 'User'} •{' '}
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {msg.message}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  {(!activeTicket || !activeTicket.messages || activeTicket.messages.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      No messages yet.
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    multiline
                    minRows={2}
                    disabled={!activeTicket || activeTicket.status === 'CLOSED'}
                  />
                  <Tooltip title="Send message">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!activeTicket || !chatMessage.trim() || activeTicket.status === 'CLOSED'}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                          width: 48,
                          height: 48,
                        }}
                      >
                        <Send fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SupportRequestPage;
