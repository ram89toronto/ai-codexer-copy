import { Code, Moon, Sun, User, LogOut, MessageSquare, Folder, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Code className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">Codeflow</span>
          </NavLink>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground hover:text-primary hover:bg-accent/50'
                }`
              }
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </NavLink>
            <NavLink 
              to="/projects" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground hover:text-primary hover:bg-accent/50'
                }`
              }
            >
              <Folder className="w-4 h-4" />
              Projects
            </NavLink>
            <NavLink 
              to="/sessions" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground hover:text-primary hover:bg-accent/50'
                }`
              }
            >
              <History className="w-4 h-4" />
              Sessions
            </NavLink>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="flex-col items-start">
                    <div className="font-medium">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.user_metadata?.username || 'User'}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;