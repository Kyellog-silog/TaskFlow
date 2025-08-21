import { useEffect } from 'react';
import api from '../services/api';
import logger from '../lib/logger';

export const useAuthInit = () => {
  useEffect(() => {
    const initializeCSRF = async () => {
      try {
        await api.get('/sanctum/csrf-cookie');
      } catch (error) {
        logger.error('CSRF initialization failed:', error);
      }
    };
    
    initializeCSRF();
  }, []);
};