
import { ReactNode } from 'react';
import ProtectedRouteManager from './auth/ProtectedRouteManager';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Main Protected Route component that checks authentication
 * and prevents unauthorized access to protected routes
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <ProtectedRouteManager>{children}</ProtectedRouteManager>;
};

export default ProtectedRoute;
