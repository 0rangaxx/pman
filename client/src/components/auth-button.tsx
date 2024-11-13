import { Button } from "@/components/ui/button";
import { useUser } from "../hooks/use-user";

export function AuthButton() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <form action="/logout" method="POST">
        <Button type="submit">Logout</Button>
      </form>
    );
  }

  return (
    <Button asChild>
      <a href="/auth/google">Login with Google</a>
    </Button>
  );
}
