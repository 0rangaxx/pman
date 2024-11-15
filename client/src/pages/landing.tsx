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
    <div className="min-h-screen bg-background dark:bg-background flex flex-col">
      <header className="border-b border-border p-4 bg-background dark:bg-background/95">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground/90">Prompt Palette</h1>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button 
                variant="outline"
                className="dark:bg-background/80 dark:border-border dark:text-foreground/90 dark:hover:bg-accent/90"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                variant="outline"
                className="dark:bg-background/80 dark:border-border dark:text-foreground/90 dark:hover:bg-accent/90"
              >
                Register
              </Button>
            </Link>
            <Button 
              onClick={handleGetStarted}
              className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground/90">
              Your Personal Prompt Management System
            </h2>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground/90">
              Organize, filter, and manage your prompts with powerful tools and real-time updates
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="dark:bg-background/80 dark:border-border">
              <CardHeader>
                <CardTitle className="dark:text-foreground/90">Dual-Panel Interface</CardTitle>
                <CardDescription className="dark:text-muted-foreground/90">
                  Efficient workspace with side-by-side viewing and editing
                </CardDescription>
              </CardHeader>
              <CardContent className="dark:text-foreground/90">
                Split-screen design allows you to browse your collection while editing prompts
              </CardContent>
            </Card>

            <Card className="dark:bg-background/80 dark:border-border">
              <CardHeader>
                <CardTitle className="dark:text-foreground/90">Advanced Search</CardTitle>
                <CardDescription className="dark:text-muted-foreground/90">
                  Find exactly what you need
                </CardDescription>
              </CardHeader>
              <CardContent className="dark:text-foreground/90">
                Search by title, content, tags, or metadata with support for special characters
              </CardContent>
            </Card>

            <Card className="dark:bg-background/80 dark:border-border">
              <CardHeader>
                <CardTitle className="dark:text-foreground/90">Smart Organization</CardTitle>
                <CardDescription className="dark:text-muted-foreground/90">
                  Keep your prompts organized
                </CardDescription>
              </CardHeader>
              <CardContent className="dark:text-foreground/90">
                Tag-based organization with filtering by date ranges and custom metadata
              </CardContent>
            </Card>

            <Card className="dark:bg-background/80 dark:border-border">
              <CardHeader>
                <CardTitle className="dark:text-foreground/90">Real-time Updates</CardTitle>
                <CardDescription className="dark:text-muted-foreground/90">
                  Always in sync
                </CardDescription>
              </CardHeader>
              <CardContent className="dark:text-foreground/90">
                Instant UI updates with every change, ensuring your data is always current
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="mt-8 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              onClick={handleGetStarted}
            >
              Start Managing Your Prompts
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
