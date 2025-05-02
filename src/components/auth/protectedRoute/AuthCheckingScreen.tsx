
import React from 'react';
import AuthLoadingScreen from '../AuthLoadingScreen';

interface AuthCheckingScreenProps {
  onManualRetry: () => void;
}

const AuthCheckingScreen: React.FC<AuthCheckingScreenProps> = ({ onManualRetry }) => {
  return <AuthLoadingScreen onManualRetry={onManualRetry} />;
};

export default AuthCheckingScreen;
