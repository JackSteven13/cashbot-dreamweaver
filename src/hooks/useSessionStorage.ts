
import { useState, useEffect } from 'react';

export function useSessionStorage<T>(
  key: string, 
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // État pour stocker notre valeur
  // Passez la fonction d'état initial à useState afin que la logique
  // ne soit exécutée qu'une fois
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      // Obtenir la valeur de sessionStorage ou retourner initialValue
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // En cas d'erreur, retourner initialValue
      console.error("Error reading from sessionStorage:", error);
      return initialValue;
    }
  });
  
  // Retourner une version enveloppée de la fonction useState
  // qui persiste la nouvelle valeur dans sessionStorage
  const setValue = (value: React.SetStateAction<T>) => {
    try {
      // Permettre que la valeur soit une fonction pour qu'elle ressemble
      // au comportement de useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder l'état
      setStoredValue(valueToStore);
      
      // Sauvegarder dans sessionStorage
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error writing to sessionStorage:", error);
    }
  };
  
  useEffect(() => {
    // Gestion des changements de stockage dans d'autres onglets
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.sessionStorage) {
        try {
          const newValue = event.newValue 
            ? JSON.parse(event.newValue) 
            : initialValue;
          setStoredValue(newValue);
        } catch (e) {
          console.error("Error parsing sessionStorage value:", e);
        }
      }
    };
    
    // Écouter les changements de stockage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);
  
  return [storedValue, setValue];
}

export default useSessionStorage;
