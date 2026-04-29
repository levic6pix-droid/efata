import { useCallback, useEffect, useState } from 'react';
import { fetchMe, loginRequest } from '../services/auth';

const TOKEN_KEY = 'admin_token';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = useCallback(async ({ username, password }) => {
    setLoading(true);
    setError('');

    try {
      const response = await loginRequest({ username, password });
      localStorage.setItem(TOKEN_KEY, response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao autenticar');
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fetchedUser = await fetchMe();
      setUser(fetchedUser);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setIsAuthenticated(false);
      setError(err.response?.data?.error || 'Falha ao validar sessão');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
  };
}
