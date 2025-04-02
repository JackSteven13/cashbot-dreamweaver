
// Re-export from the new location for backward compatibility
export { useDashboardInitialization } from './initialization/useDashboardInitialization';
export default useDashboardInitialization;

// This file is kept for backward compatibility
// It imports the refactored implementation from the initialization folder
import { useDashboardInitialization } from './initialization/useDashboardInitialization';
