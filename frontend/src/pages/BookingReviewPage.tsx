import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Alert,
  Rating,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/api';
import AppBar from '../components/AppBar';
import {
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const BookingReviewPage: React.FC = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [rating, setRating] = useState<number | null>(4);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!bookingId || !user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          getApiUrl(`bookings/${bookingId}?customerUserId=${encodeURIComponent(user.id)}`),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        if (!response.ok || !data.success || !data.data) {
          setError(data.message || 'Could not load booking');
          return;
        }
        if (cancelled) return;
        const b = data.data;
        if (b.userId !== user.id) {
          setError('This booking does not belong to your account.');
          setBooking(b);
          return;
        }
        if (b.status !== 'COMPLETED') {
          setError('You can rate only after the service is completed.');
        }
        setBooking(b);
      } catch {
        setError('Could not load booking');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, user?.id]);

  const handleSubmit = async () => {
    if (!bookingId || !rating || rating < 1) {
      setError('Please choose a rating from 1 to 5 stars.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        rating: String(rating),
        feedback: feedback.trim() || '—',
      });
      const response = await fetch(getApiUrl(`bookings/${bookingId}/rating?${params.toString()}`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || 'Could not save your review');
        return;
      }
      setSuccess('Thank you! Your rating has been saved.');
      setTimeout(() => navigate('/customer-dashboard'), 1500);
    } catch {
      setError('Could not save your review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar title="Rate your service" />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              How was your experience?
            </Typography>
            {booking && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {booking.serviceName || booking.service || 'Service'} · ₹
                {booking.totalAmount ?? booking.price ?? '—'}
              </Typography>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Rating
            </Typography>
            <Rating
              name="booking-rating"
              value={rating}
              onChange={(_, v) => setRating(v)}
              size="large"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Feedback (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                disabled={submitting || booking?.userId !== user?.id || booking?.status !== 'COMPLETED'}
                onClick={handleSubmit}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  background: sewaPrimaryButtonGradient,
                  '&:hover': { background: sewaPrimaryButtonHover },
                }}
              >
                {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit rating'}
              </Button>
              <Button variant="text" onClick={() => navigate('/customer-dashboard')} sx={{ textTransform: 'none' }}>
                Back to dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default BookingReviewPage;
