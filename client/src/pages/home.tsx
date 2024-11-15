import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { PromptPanel } from "../components/prompt-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Settings as SettingsIcon, LogOut } from "lucide-react";

export function Home() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b p-4 bg-background">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Prompt Manager</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground dark:text-foreground/90 dark:hover:bg-accent/90"
              >
                <span className="font-medium">{user?.username}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-background/95 dark:border-border">
              <DropdownMenuItem 
                onClick={() => navigate("/settings")} 
                className="flex items-center gap-2 dark:text-foreground/90 dark:focus:bg-accent/90"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-border" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="flex items-center gap-2 dark:text-foreground/90 dark:focus:bg-accent/90"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 bg-background">
        <PromptPanel />
      </main>
    </div>
  );
}
