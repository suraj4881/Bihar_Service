import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { SupportAgent, Send } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface SupportChatWidgetProps {
  userId?: string;
  userRole?: string;
  userName?: string;
  variant?: 'card' | 'plain';
}

const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  userId,
  userRole,
  userName,
  variant = 'card',
}) => {
  const navigate = useNavigate();
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const subscribedTicketRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isActive = true;
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/support/tickets/user/${userId}`);
        const data = await response.json();
        if (isActive && data.success && data.data) {
          const openTicket = data.data.find((ticket: any) => ticket.status !== 'CLOSED');
          setActiveTicket(openTicket || null);
        }
      } catch (err) {
        if (isActive) {
          setActiveTicket(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    fetchTicket();
    const intervalId = setInterval(fetchTicket, 10000);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  useEffect(() => {
    if (!activeTicket?.id) {
      return () => {
        if (stompClientRef.current) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
          subscribedTicketRef.current = null;
        }
        setWsConnected(false);
      };
    }

    const ticketId = activeTicket.id;
    if (subscribedTicketRef.current === ticketId && stompClientRef.current) {
      return;
    }

    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true);
        subscribedTicketRef.current = ticketId;
        client.subscribe(`/topic/support/${ticketId}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            setActiveTicket((prev: any) => {
              if (!prev) return prev;
              const existing = prev.messages || [];
              const alreadyExists = existing.some((m: any) => m.id && payload.id && m.id === payload.id);
              if (alreadyExists) {
                return prev;
              }
              return {
                ...prev,
                messages: [...existing, payload],
              };
            });
          } catch (err) {
            // Ignore parsing errors
          }
        });
      },
      onDisconnect: () => {
        setWsConnected(false);
      },
      onStompError: () => {
        setWsConnected(false);
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      stompClientRef.current = null;
      subscribedTicketRef.current = null;
      setWsConnected(false);
    };
  }, [activeTicket?.id]);

  const handleSendMessage = async () => {
    if (!activeTicket || !chatMessage.trim()) return;
    try {
      setError('');
      const payload = {
        senderRole: userRole,
        senderName: userName,
        message: chatMessage.trim(),
      };
      const response = await fetch(`http://localhost:8080/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data?.success) {
        setActiveTicket(data.data);
        setChatMessage('');
      } else {
        setError(data?.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const content = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#1E3A8A', width: 36, height: 36 }}>
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeTicket && (
            <Chip
              label={activeTicket.status}
              color={activeTicket.status === 'OPEN' ? 'warning' : activeTicket.status === 'IN_PROGRESS' ? 'info' : 'success'}
              size="small"
            />
          )}
          <Chip
            label={wsConnected ? 'Live' : 'Reconnecting'}
            color={wsConnected ? 'success' : 'warning'}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {activeTicket
          ? `Ticket #${activeTicket.id?.slice(-6)} • ${activeTicket.subject || 'Support'}`
          : 'No active ticket. Create one to start chat with support.'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Divider sx={{ mb: 2 }} />

      {!activeTicket ? (
        <Button variant="contained" onClick={() => navigate('/support')} disabled={loading}>
          {loading ? 'Checking...' : 'Create Support Ticket'}
        </Button>
      ) : (
        <>
          <Box
            sx={{
              maxHeight: 260,
              overflowY: 'auto',
              mb: 2,
              bgcolor: '#F8FAFF',
              borderRadius: 3,
              border: '1px solid #E6ECF7',
              p: 2,
            }}
          >
            {(activeTicket.messages || []).map((msg: any, index: number) => {
              const senderRole = (msg.senderRole || '').toUpperCase();
              const isSelf = userRole && senderRole === userRole.toUpperCase();
              return (
                <Box
                  key={`${activeTicket.id}-${index}`}
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
                        bgcolor: isSelf ? '#2563EB' : '#0F172A',
                        fontSize: 12,
                      }}
                    >
                      {isSelf ? (userName || 'U').charAt(0).toUpperCase() : 'A'}
                    </Avatar>
                    <Box
                      sx={{
                      maxWidth: '75%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 2.5,
                      bgcolor: isSelf ? '#2563EB' : '#FFFFFF',
                      color: isSelf ? 'white' : '#0F172A',
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
            {(!activeTicket.messages || activeTicket.messages.length === 0) && (
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
              disabled={activeTicket.status === 'CLOSED'}
            />
            <Tooltip title="Send message">
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || activeTicket.status === 'CLOSED'}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: '#1D4ED8' },
                    width: 48,
                    height: 48,
                  }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </>
      )}
    </>
  );

  if (variant === 'plain') {
    return <Box>{content}</Box>;
  }

  return (
    <Card
      sx={{
        mt: 2,
        borderRadius: 3,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)',
        border: '1px solid #E6ECF7',
      }}
    >
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default SupportChatWidget;
