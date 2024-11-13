import { PromptPanel } from "../components/prompt-panel";

export function Home() {
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Prompt Manager</h1>
      </header>
      <main className="flex-1">
        <PromptPanel />
      </main>
    </div>
  );
}