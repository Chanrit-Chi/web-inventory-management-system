"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "./ui/switch";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-700 ease-in-out dark:scale-75 dark:opacity-50 scale-100 opacity-100" />
      <Switch
        id="dark-mode-toggle"
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
      />
      <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-700 ease-in-out dark:scale-100 dark:opacity-100 scale-75 opacity-50" />
    </div>
  );
}
