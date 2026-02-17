const API_BASE = '/api/support';

export const createSupportTicket = async (authFetch, ticketData) => {
  const response = await authFetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to create support ticket');
  }

  return result.data;
};

export const listMyTickets = async (authFetch) => {
  const response = await authFetch(`${API_BASE}/tickets`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch tickets');
  }

  const result = await response.json();
  return result.data;
};

export const getTicketById = async (authFetch, ticketId) => {
  const response = await authFetch(`${API_BASE}/tickets/${ticketId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch ticket');
  }

  const result = await response.json();
  return result.data;
};

export const replyToTicket = async (authFetch, ticketId, replyData) => {
  const response = await authFetch(`${API_BASE}/tickets/${ticketId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(replyData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to add reply');
  }

  return result.data;
};

export const closeTicket = async (authFetch, ticketId) => {
  const response = await authFetch(`${API_BASE}/tickets/${ticketId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to close ticket');
  }

  return result.data;
};
