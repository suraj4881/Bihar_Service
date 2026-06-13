import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import AppBar from '../components/AppBar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiUrl, getFileServeUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const SupportDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [assigneeDrafts, setAssigneeDrafts] = useState<Record<string, string>>({});
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? getApiUrl(`support/tickets?status=${statusFilter}`)
        : getApiUrl('support/tickets');
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.data) {
        setTickets(data.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      setError('Failed to load support tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const intervalId = setInterval(fetchTickets, 10000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(getApiUrl(`support/tickets/${id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchTickets();
    } catch (err) {
      setError('Failed to update ticket');
    }
  };

  const handleSendReply = async (id: string) => {
    const resolutionNote = resolutionDrafts[id];
    if (!resolutionNote) return;
    try {
      await fetch(getApiUrl(`support/tickets/${id}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderRole: 'SUPPORT', senderName: 'Support Team', message: resolutionNote }),
      });
      await fetch(getApiUrl(`support/tickets/${id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNote }),
      });
      setResolutionDrafts((prev) => ({ ...prev, [id]: '' }));
      fetchTickets();
    } catch (err) {
      setError('Failed to add reply');
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      await fetch(getApiUrl(`support/tickets/${id}/close`), {
        method: 'PUT',
      });
      fetchTickets();
    } catch (err) {
      setError('Failed to close ticket');
    }
  };

  const handleAssign = async (id: string) => {
    const assignee = assigneeDrafts[id];
    if (!assignee) return;
    try {
      await fetch(getApiUrl(`support/tickets/${id}/assign?assignee=${encodeURIComponent(assignee)}`), {
        method: 'PUT',
      });
      fetchTickets();
    } catch (err) {
      setError('Failed to assign ticket');
    }
  };

  const hour = new Date().getHours();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] ?? '';
  const greetingEn =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingHi =
    hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';

  const supportHeaderTitle = (
    <Box sx={{ maxWidth: { xs: 'min(56vw, 240px)', sm: 440 } }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: 'inherit',
          lineHeight: 1.3,
          fontSize: { xs: '0.78rem', sm: '0.95rem' },
        }}
      >
        {language === 'hi'
          ? `${greetingHi}${firstName ? `, ${firstName}` : ''}`
          : `${greetingEn}${firstName ? `, ${firstName}` : ''}`}
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.92, fontWeight: 500, mt: 0.25 }}
      >
        {language === 'hi'
          ? 'सपोर्ट कंसोल · टिकट प्रबंधन'
          : 'SewaBihar · Support console'}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar variant="dashboard" position="static" title={supportHeaderTitle} />
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
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
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
              {language === 'hi' ? 'सपोर्ट टीम डैशबोर्ड' : 'Support team dashboard'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 720 }}>
              {language === 'hi'
                ? 'टिकट ट्रैक करें, जवाब दें, और रीयल-टाइम अपडेट के साथ समाधान करें।'
                : 'Track, reply, and resolve tickets with timely updates.'}
            </Typography>
          </Box>
        </Card>
        <Card
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
            bgcolor: 'background.paper',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {language === 'hi' ? 'सभी टिकट' : 'All tickets'}
              </Typography>
              <TextField
                select
                label="Filter Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Paper
              variant="outlined"
              sx={{ mt: 3, overflow: 'auto', borderRadius: 2, borderColor: 'divider' }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell />
                    <TableCell>Ticket</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Attachments</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No support tickets found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <React.Fragment key={ticket.id}>
                        <TableRow>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setExpandedRows((prev) => ({ ...prev, [ticket.id]: !prev[ticket.id] }))
                              }
                            >
                              {expandedRows[ticket.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {ticket.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {ticket.userName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ticket.userRole || 'USER'}
                            </Typography>
                          </TableCell>
                          <TableCell>{ticket.category}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <Chip label={ticket.status} color={ticket.status === 'OPEN' ? 'warning' : ticket.status === 'RESOLVED' ? 'success' : 'default'} size="small" />
                          </TableCell>
                          <TableCell>{ticket.priority}</TableCell>
                          <TableCell>
                            {ticket.attachments && ticket.attachments.length > 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {ticket.attachments.map((filePath: string, index: number) => (
                                  <Button
                                    key={`${ticket.id}-file-${index}`}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => window.open(getFileServeUrl(filePath), '_blank')}
                                  >
                                    View File {index + 1}
                                  </Button>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{ticket.assignedTo || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <TextField
                                size="small"
                                placeholder="Assign to"
                                value={assigneeDrafts[ticket.id] || ''}
                                onChange={(e) =>
                                  setAssigneeDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                                }
                                sx={{ minWidth: 120 }}
                              />
                              <Button size="small" variant="outlined" onClick={() => handleAssign(ticket.id)}>
                                Assign
                              </Button>
                              <TextField
                                size="small"
                                select
                                value={ticket.status}
                                onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                              >
                                {statusOptions.map((status) => (
                                  <MenuItem key={status} value={status}>
                                    {status}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={10} sx={{ p: 0, borderBottom: 0 }}>
                            <Collapse in={expandedRows[ticket.id]} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                  Description
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {ticket.description || '—'}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                  Conversation
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                  {(ticket.messages || []).map((msg: any, index: number) => (
                                    <Box key={`${ticket.id}-msg-${index}`} sx={{ mb: 1.5 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        {msg.senderName || msg.senderRole || 'User'} •{' '}
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                                      </Typography>
                                      <Typography variant="body2">{msg.message}</Typography>
                                    </Box>
                                  ))}
                                  {(!ticket.messages || ticket.messages.length === 0) && (
                                    <Typography variant="body2" color="text.secondary">
                                      No messages yet.
                                    </Typography>
                                  )}
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                  Reply to user
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <TextField
                                    fullWidth
                                    placeholder="Write resolution note..."
                                    value={resolutionDrafts[ticket.id] ?? ticket.resolutionNote ?? ''}
                                    onChange={(e) =>
                                      setResolutionDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                                    }
                                    multiline
                                    minRows={2}
                                    disabled={ticket.status === 'CLOSED'}
                                  />
                                  <Button
                                    variant="contained"
                                    onClick={() => handleSendReply(ticket.id)}
                                    disabled={ticket.status === 'CLOSED'}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      borderRadius: 999,
                                      px: 2.5,
                                      background: sewaPrimaryButtonGradient,
                                      '&:hover': { background: sewaPrimaryButtonHover },
                                    }}
                                  >
                                    Send Reply
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    onClick={() => handleCloseTicket(ticket.id)}
                                    disabled={ticket.status === 'CLOSED'}
                                  >
                                    Close Ticket
                                  </Button>
                                </Box>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SupportDashboard;
