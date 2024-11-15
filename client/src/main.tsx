import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route, useLocation, Redirect } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import { Toaster } from "@/components/ui/toaster";
import { Home } from "./pages/home";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { useUser } from "./hooks/use-user";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to={`/login?redirect=${location}`} />;
  }

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig value={{ fetcher }}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/">
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        </Route>
        <Route>404 Page Not Found</Route>
      </Switch>
      <Toaster />
    </SWRConfig>
  </StrictMode>,
);
