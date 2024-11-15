import { PromptPanel } from "../components/prompt-panel";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

export function Home() {
  const { user, isLoading, logout } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-2xl font-bold">Prompt Manager</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold">Welcome to Prompt Manager</h2>
            <p className="text-muted-foreground">Please login or register to continue</p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompt Manager</h1>
          <Button variant="ghost" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <PromptPanel />
      </main>
    </div>
  );
}
