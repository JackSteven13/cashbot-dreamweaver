
export const persistToLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Failed to store value for key ${key}:`, e);
  }
};

export const getFromLocalStorage = (key: string, defaultValue: string = '0'): string => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.error(`Failed to load value for key ${key}:`, e);
    return defaultValue;
  }
};
