/**
 * Utility to clear all localStorage data
 * Useful for debugging and resetting the application state
 */
export const clearAllStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Storage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear storage:', error);
    return false;
  }
};

/**
 * Clear only AILesson related data
 */
export const clearAppStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('ailesson') || key.includes('zustand')) {
        localStorage.removeItem(key);
      }
    });
    console.log('✅ App storage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear app storage:', error);
    return false;
  }
};

/**
 * Get storage info for debugging
 */
export const getStorageInfo = () => {
  const info = {
    localStorage: {} as Record<string, string>,
    sessionStorage: {} as Record<string, string>,
    totalSize: 0
  };

  try {
    // Get localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          info.localStorage[key] = value;
          info.totalSize += key.length + value.length;
        }
      }
    }

    // Get sessionStorage data
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value) {
          info.sessionStorage[key] = value;
          info.totalSize += key.length + value.length;
        }
      }
    }

    console.log('📊 Storage Info:', info);
    return info;
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
    return info;
  }
};

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).clearAllStorage = clearAllStorage;
  (window as any).clearAppStorage = clearAppStorage;
  (window as any).getStorageInfo = getStorageInfo;
}
