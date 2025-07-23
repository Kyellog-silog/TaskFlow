import { useEffect } from 'react';
import api from '../services/api';

export const useAuthInit = () => {
  useEffect(() => {
    const initializeCSRF = async () => {
      try {
        await api.get('/sanctum/csrf-cookie');
      } catch (error) {
        console.error('CSRF initialization failed:', error);
      }
    };
    
    initializeCSRF();
  }, []);
};