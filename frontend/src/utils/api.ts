// Utility for making authenticated API requests

export const api = {
  // Get stored token
  getToken: () => localStorage.getItem('token'),
  
  // Get stored user
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Check if user is logged in
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Make authenticated request
  fetch: async (url: string, options: RequestInit = {}) => {
    const token = api.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // If unauthorized, logout
    if (response.status === 401) {
      api.logout();
      window.location.href = '/login';
    }
    
    return response;
  },
};

// Example usage:
// const response = await api.fetch('/api/user/profile');
// const data = await response.json();
