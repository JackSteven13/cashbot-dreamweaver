# User Hooks Documentation

This directory contains hooks related to user data management that were refactored from larger hooks to follow the single responsibility principle.

## Overview of Hook Structure

The user data management system is built with a set of specialized hooks that work together:

```
useUserData (main hook)
├── useUserDataState (state management)
├── useUserDataSynchronization (syncs local state with fetched data)
├── useUserLimitAlert (handles limit alert logic)
└── useUserDataRefresher (handles manual refreshing)

useUserFetch (data fetching hook)
├── useUserDataState (state management) 
├── useUserAuthChecking (auth verification)
└── useUserRefetching (handles refetching logic)
```

## Detailed Hook Documentation

### `useUserDataState.ts`

**Purpose**: Manages the core state for user data and provides tracking for previous values.

**Returns**:
- `userData`: Current user data
- `dailySessionCount`: Current daily session count
- `showLimitAlert`: Whether to show limit alerts
- `isNewUser`: Whether the user is new
- Setter functions for all state values
- References to track previous values

**Usage Example**:
```typescript
const { 
  userData, 
  setUserData,
  previousUserDataRef
} = useUserDataState(initialUserData);
```

### `useUserDataSynchronization.ts`

**Purpose**: Synchronizes local state with data fetched from the server to prevent unnecessary updates.

**Parameters**:
- Fetched data values from the server
- Local state setter functions
- References to track previous values

**Behavior**: Uses `useEffect` to compare incoming data with previous values and only updates local state when necessary.

### `useUserLimitAlert.ts`

**Purpose**: Manages the display of limit alerts based on user state.

**Parameters**:
- `isNewUser`: Whether user is new
- `setShowLimitAlert`: Local state setter for the alert
- `setFetchedShowLimitAlert`: Server state setter for the alert
- `previousLimitAlertRef`: Reference to track previous value

**Returns**:
- `handleSetShowLimitAlert`: Function to update limit alert state properly

### `useUserDataRefresher.ts`

**Purpose**: Provides functionality to manually refresh user data.

**Parameters**:
- `refetchUserData`: Function to fetch fresh data from the server

**Returns**:
- `refreshUserData`: Function that calls the refetch function and handles errors

### `useUserAuthChecking.ts`

**Purpose**: Manages authentication verification and error handling during data fetching.

**Parameters**:
- `isMounted`: Reference to check if component is still mounted
- `updateUserData`: Function to update user data state
- `initialFetchAttempted`: Reference to track initial fetch

**Returns**:
- `fetchUserData`: Function to fetch user data with auth verification
- `isLoading`: Loading state
- `setIsLoading`: Function to update loading state

### `useUserRefetching.ts`

**Purpose**: Handles manual refetching of user data with throttling and error handling.

**Parameters**:
- `isMounted`: Reference to check if component is still mounted
- `fetchUserData`: Base function to fetch user data

**Returns**:
- `refetchUserData`: Enhanced function with throttling and error handling

### `useUserDataFetching.ts`

**Purpose**: Handles the actual fetching of user data from various sources.

**Parameters**:
- `loadUserProfile`: Function to load user profile
- `loadUserBalance`: Function to load user balance
- `updateUserData`: Function to update local state
- `setIsLoading`: Function to update loading state
- `isNewUser`: Whether user is new

**Returns**:
- `fetchUserData`: Function to fetch all user data

## Integration Example

The hooks are designed to work together in a modular fashion. Here's how they integrate in `useUserFetch`:

```typescript
export const useUserFetch = (): UserFetchResult => {
  // Track component mounting status
  const isMounted = useRef(true);
  const initialFetchAttempted = useRef(false);
  
  // Manage state with a dedicated hook
  const userDataState = useUserDataState();
  
  // Handle authentication checks
  const { 
    fetchUserData, 
    isLoading, 
    setIsLoading 
  } = useUserAuthChecking(
    isMounted, 
    userDataState.updateUserData,
    initialFetchAttempted
  );
  
  // Add refetching capability
  const { refetchUserData } = useUserRefetching(
    isMounted,
    fetchUserData
  );
  
  // Clean up on unmount
  useEffect(() => {
    // ...unmount cleanup logic
  }, []);
  
  return {
    userData: userDataState.userData,
    // ...other returned values
    refetchUserData
  };
};
```

## Best Practices

1. **Single Responsibility**: Each hook has a specific responsibility, making the code more maintainable.
2. **Dependency Injection**: Hooks receive their dependencies as parameters rather than importing them directly.
3. **Reference Tracking**: Use refs to track previous values and avoid unnecessary re-renders.
4. **Error Handling**: Each hook includes proper error handling for its domain.
5. **Loading States**: Loading states are properly managed and propagated.

## Migration from Legacy Hooks

The legacy hooks (`src/hooks/useUserData.ts` and `src/hooks/useUserFetch.ts`) have been kept as wrappers around the new, modular hooks to maintain backward compatibility. They should be considered deprecated and new code should use the refactored hooks directly.
