
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Use useEffect to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle toggle change
  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  // Don't render anything until component is mounted to avoid hydration mismatch
  if (!mounted) return null;

  const isDarkMode = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Sun 
        size={18} 
        className={`transition-colors duration-300 ${
          isDarkMode 
            ? 'text-gray-500' 
            : 'text-yellow-500 drop-shadow-sm'
        }`} 
      />
      <Switch
        checked={isDarkMode}
        onCheckedChange={handleToggle}
        className={`${
          isDarkMode 
            ? 'data-[state=checked]:bg-[#4CAF50] data-[state=unchecked]:bg-gray-700' 
            : 'data-[state=checked]:bg-[#4CAF50] data-[state=unchecked]:bg-gray-200'
        } transition-colors duration-300`}
      />
      <Moon 
        size={18} 
        className={`transition-colors duration-300 ${
          isDarkMode 
            ? 'text-[#4CAF50] drop-shadow-sm' 
            : 'text-gray-400'
        }`} 
      />
    </div>
  );
};

export default DarkModeToggle;
