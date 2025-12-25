import * as SecureStore from 'expo-secure-store';

export const useSecureStore = () => {
  const saveSecureItem = async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error('Error saving to secure store:', error);
      return false;
    }
  };

  const getSecureItem = async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error('Error reading from secure store:', error);
      return null;
    }
  };

  const deleteSecureItem = async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('Error deleting from secure store:', error);
      return false;
    }
  };

  return {
    saveSecureItem,
    getSecureItem,
    deleteSecureItem,
  };
};
