import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import { Toaster } from "@/components/ui/toaster";
import { Home } from "./pages/home";
import { Landing } from "./pages/landing";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { Settings } from "./pages/settings";
import { AuthGuard } from "./components/auth-guard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig value={{ fetcher }}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/prompts">
          <AuthGuard>
            <Home />
          </AuthGuard>
        </Route>
        <Route path="/settings">
          <AuthGuard>
            <Settings />
          </AuthGuard>
        </Route>
        <Route>Page Not Found</Route>
      </Switch>
      <Toaster />
    </SWRConfig>
  </StrictMode>
);
