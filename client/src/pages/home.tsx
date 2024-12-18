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
import { ChevronDown, Settings as SettingsIcon, LogOut, Users } from "lucide-react";

export function Home() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompt Manager</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                {user?.username}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              {user?.isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin/users")} className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User Management
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1">
        <PromptPanel />
      </main>
    </div>
  );
}
