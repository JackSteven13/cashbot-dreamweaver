
import { FC, MutableRefObject } from 'react';
import AuthRecoveryScreen from './AuthRecoveryScreen';

interface ProtectedRouteRecoveryProps {
  isRetrying: boolean;
  autoRetryCount: MutableRefObject<number>;
  maxAutoRetries: number;
  onRetry: () => void;
  onCleanLogin: () => void;
}

/**
 * Component to display the auth recovery screen
 */
const ProtectedRouteRecovery: FC<ProtectedRouteRecoveryProps> = ({
  isRetrying,
  autoRetryCount,
  maxAutoRetries,
  onRetry,
  onCleanLogin
}) => {
  if (autoRetryCount.current >= maxAutoRetries) {
    return (
      <AuthRecoveryScreen 
        isRetrying={isRetrying}
        onRetry={() => {
          console.log("Manual retry requested");
          autoRetryCount.current = 0;
          onRetry();
        }}
        onCleanLogin={onCleanLogin}
      />
    );
  }
  
  return (
    <AuthRecoveryScreen 
      isRetrying={isRetrying}
      onRetry={onRetry}
      onCleanLogin={onCleanLogin}
    />
  );
};

export default ProtectedRouteRecovery;
