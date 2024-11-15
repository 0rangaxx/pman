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

// Initialize theme from localStorage or system preference
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const storedTheme = localStorage.getItem("theme") || "system";
const theme = storedTheme === "system" ? (prefersDark ? "dark" : "light") : storedTheme;

// Apply theme class immediately to avoid flash
if (theme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// Store the initial theme
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "system");
}

// Listen for system theme changes
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", (e) => {
  if (localStorage.getItem("theme") === "system") {
    document.documentElement.classList.toggle("dark", e.matches);
  }
});

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
