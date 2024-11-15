import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAuth } from "../hooks/use-auth";

export function Landing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/prompts");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b p-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompt Palette</h1>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Register</Button>
            </Link>
            <Button onClick={handleGetStarted}>Get Started</Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Your Personal Prompt Management System
            </h2>
            <p className="text-xl text-muted-foreground">
              Organize, filter, and manage your prompts with powerful tools and real-time updates
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dual-Panel Interface</CardTitle>
                <CardDescription>
                  Efficient workspace with side-by-side viewing and editing
                </CardDescription>
              </CardHeader>
              <CardContent>
                Split-screen design allows you to browse your collection while editing prompts
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription>
                  Find exactly what you need
                </CardDescription>
              </CardHeader>
              <CardContent>
                Search by title, content, tags, or metadata with support for special characters
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Smart Organization</CardTitle>
                <CardDescription>
                  Keep your prompts organized
                </CardDescription>
              </CardHeader>
              <CardContent>
                Tag-based organization with filtering by date ranges and custom metadata
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  Always in sync
                </CardDescription>
              </CardHeader>
              <CardContent>
                Instant UI updates with every change, ensuring your data is always current
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="mt-8" onClick={handleGetStarted}>
              Start Managing Your Prompts
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
