
import React from 'react';
import ProtectedRouteRecovery from '../ProtectedRouteRecovery';

interface AuthRecoveryWrapperProps {
  isRetrying: boolean;
  autoRetryCount: number;
  maxAutoRetries: number;
  onRetry: () => void;
  onCleanLogin: () => void;
}

const AuthRecoveryWrapper: React.FC<AuthRecoveryWrapperProps> = ({
  isRetrying,
  autoRetryCount,
  maxAutoRetries,
  onRetry,
  onCleanLogin
}) => {
  return (
    <ProtectedRouteRecovery
      isRetrying={isRetrying}
      autoRetryCount={autoRetryCount}
      maxAutoRetries={maxAutoRetries}
      onRetry={onRetry}
      onCleanLogin={onCleanLogin}
    />
  );
};

export default AuthRecoveryWrapper;
