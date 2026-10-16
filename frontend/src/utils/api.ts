<<<<<<< HEAD
=======
// Get the base URL from your environment variables
// In production, this will be your Render URL
const BASE_URL = 'https://anonyworks.onrender.com'; // Change to your production URL as needed

>>>>>>> 7df093b1d76213b2c4e7d24502f5d96f331aee9e
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
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
    const response = await fetch(endpoint, {
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
