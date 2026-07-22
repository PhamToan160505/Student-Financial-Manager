import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Controller Hook: useAuth
 * Coordinates authentication actions across components and pages.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider according to MVC guidelines');
  }
  return context;
}
