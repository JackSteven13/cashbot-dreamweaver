
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

  return (
    <div className="flex items-center gap-2">
      <Sun size={16} className="text-yellow-500 dark:text-gray-400" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-[#4CAF50] data-[state=unchecked]:bg-gray-200"
      />
      <Moon size={16} className="text-gray-400 dark:text-[#4CAF50]" />
    </div>
  );
};

export default DarkModeToggle;
