const API_URL = import.meta.env.VITE_API_URL;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let user: any = {};
  try {
    const storedUser = localStorage.getItem('user');
    user = (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : {};
  } catch (e) {
    user = {};
  }
  const token = user?.token;
  const selectedProjectId = localStorage.getItem('selectedProjectId');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && token !== 'undefined' ? { Authorization: `Bearer ${token}` } : {}),
    ...(selectedProjectId ? { 'X-Project-Id': selectedProjectId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401 && !endpoint.includes('/auth/')) {
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: 'Network response was not ok' };
    }
    throw new Error(errorData.message || 'Something went wrong');
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};
