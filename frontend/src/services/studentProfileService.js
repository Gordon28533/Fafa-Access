export async function fetchStudentProfile(authFetch) {
  const response = await authFetch('/api/student/profile');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load profile');
  }

  return data.data;
}

export async function saveStudentProfile(authFetch, payload) {
  const response = await authFetch('/api/student/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }

  return data.data;
}

export async function fetchUniversities(authFetch) {
  const response = await authFetch('/api/student/universities');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load universities');
  }

  return data.data;
}
