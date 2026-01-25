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

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const SupportDashboard: React.FC = () => {
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
        ? `http://localhost:8080/api/support/tickets?status=${statusFilter}`
        : 'http://localhost:8080/api/support/tickets';
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
      await fetch(`http://localhost:8080/api/support/tickets/${id}/status`, {
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
      await fetch(`http://localhost:8080/api/support/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderRole: 'SUPPORT', senderName: 'Support Team', message: resolutionNote }),
      });
      await fetch(`http://localhost:8080/api/support/tickets/${id}/status`, {
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
      await fetch(`http://localhost:8080/api/support/tickets/${id}/close`, {
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
      await fetch(`http://localhost:8080/api/support/tickets/${id}/assign?assignee=${encodeURIComponent(assignee)}`, {
        method: 'PUT',
      });
      fetchTickets();
    } catch (err) {
      setError('Failed to assign ticket');
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card
          sx={{
            mb: 3,
            p: { xs: 3, md: 4 },
            color: '#fff',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Support Team Dashboard
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Track, reply, and resolve tickets with real-time updates.
          </Typography>
        </Card>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFF 100%)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Support Team Dashboard
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

            <Paper sx={{ mt: 3, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
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
                                    onClick={() =>
                                      window.open(
                                        `http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(filePath)}`,
                                        '_blank'
                                      )
                                    }
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
                              <Box sx={{ p: 2, bgcolor: '#F9FAFF' }}>
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
