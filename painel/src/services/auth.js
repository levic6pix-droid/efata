import http from './http';

export async function loginRequest(payload) {
  const response = await http.post('/auth/login', payload);
  return response.data;
}

export async function fetchMe() {
  const response = await http.get('/auth/me');
  return response.data.user;
}