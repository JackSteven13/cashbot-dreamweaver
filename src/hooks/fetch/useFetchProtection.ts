
import { useRef } from 'react';

/**
 * Hook that provides protection mechanisms for fetch operations
 * to prevent race conditions and excessive API calls
 */
export const useFetchProtection = () => {
  // Refs to track fetch status
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const retryCount = useRef(0);
  const initialFetchAttempted = useRef(false);
  const lastFetchTimestamp = useRef(0);
  const fetchQueueRef = useRef<number>(0);
  const lastRefreshTimestamp = useRef(0);
  const initialFetchDelayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if fetch should be throttled
  const shouldThrottleFetch = () => {
    const now = Date.now();
    return now - lastFetchTimestamp.current < 3000;
  };
  
  // Check if authentication refresh should be throttled
  const shouldThrottleRefresh = () => {
    const now = Date.now();
    return now - lastRefreshTimestamp.current < 30000; // 30 seconds between refreshes
  };
  
  // Update the fetch timestamp
  const updateFetchTimestamp = () => {
    lastFetchTimestamp.current = Date.now();
  };
  
  // Update the refresh timestamp
  const updateRefreshTimestamp = () => {
    lastRefreshTimestamp.current = Date.now();
  };
  
  // Increment the queue counter and get the current queue ID
  const getNextQueueId = () => {
    fetchQueueRef.current++;
    return fetchQueueRef.current;
  };
  
  return {
    isMounted,
    fetchInProgress,
    retryCount,
    initialFetchAttempted,
    initialFetchDelayRef,
    shouldThrottleFetch,
    shouldThrottleRefresh,
    updateFetchTimestamp,
    updateRefreshTimestamp,
    getNextQueueId,
    fetchQueueRef
  };
};
