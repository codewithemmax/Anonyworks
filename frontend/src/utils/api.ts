// Get the base URL from your environment variables
// In production, this will be your Render URL
const BASE_URL = 'https://anonyworks.onrender.com';

export const api = {
  getToken: () => localStorage.getItem('token'),
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Update the fetch method to use the BASE_URL
  fetch: async (endpoint: string, options: RequestInit = {}) => {
    const token = api.getToken();
    
    // 🔥 Ensure the URL is absolute if it starts with /api
    const fullUrl = endpoint.startsWith('/') 
      ? `${BASE_URL}${endpoint}` 
      : endpoint;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      api.logout();
      window.location.href = '/login';
    }
    
    return response;
  },
};