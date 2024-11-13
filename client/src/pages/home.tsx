import { PromptPanel } from "../components/prompt-panel";
import { AuthButton } from "../components/auth-button";
import { useUser } from "../hooks/use-user";

export function Home() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <AuthButton />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prompt Manager</h1>
        <AuthButton />
      </header>
      <main className="flex-1">
        <PromptPanel />
      </main>
    </div>
  );
}
