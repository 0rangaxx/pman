import { AuthButton } from "../components/auth-button";

export function Login() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Prompt Manager</h1>
        <AuthButton />
      </div>
    </div>
  );
}
