export const ROLE_HOME = {
  STUDENT: '/dashboard',
  SRC: '/src/dashboard',
  ADMIN: '/admin',
  DELIVERY: '/delivery/queue',
};

export const VALID_ROLES = Object.keys(ROLE_HOME);

export const normalizeRole = (role) => {
  if (!role) return '';
  return String(role).toUpperCase().trim();
};

export const isRoleValid = (role) => {
  const normalized = normalizeRole(role);
  return VALID_ROLES.includes(normalized);
};

export const getRoleHome = (role) => {
  const normalized = normalizeRole(role);
  return ROLE_HOME[normalized] || null;
};
