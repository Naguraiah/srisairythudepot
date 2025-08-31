const DEMO_CREDENTIALS = {
  username: 'Rehansai',
  password: 'Anunagu@2025'
};

export const authService = {
  login: (username, password) => {
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      localStorage.setItem('session', 'true');
      localStorage.setItem('user', JSON.stringify({ username, role: 'Admin' }));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  },

  logout: () => {
    localStorage.removeItem('session');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return localStorage.getItem('session') === 'true';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};