
import { useState, useCallback } from 'react';

export const useResetHandler = () => {
  const [forceReset, setForceReset] = useState(false);
  
  const handleForceReset = useCallback(() => {
    setForceReset(true);
  }, []);

  return {
    forceReset,
    setForceReset,
    handleForceReset
  };
};

export default useResetHandler;
