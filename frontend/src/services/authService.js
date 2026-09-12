import api from './api';

// MOCK SERVICES
export const login = async (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { token: 'mock-jwt-token', user: { id: 1, name: 'Farmer John', email, location: 'California' } } });
    }, 1000);
  });
};

export const register = async (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { token: 'mock-jwt-token', user: { id: 1, ...userData } } });
    }, 1000);
  });
};
