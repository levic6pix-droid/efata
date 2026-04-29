import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  
  login: async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ user, token });
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
