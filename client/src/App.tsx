import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import RestaurantDashboard from "@/pages/RestaurantDashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Determine if user is a restaurant owner (mock logic for prototype)
  // In real implementation, this would check user role/type from the backend
  const isRestaurantOwner = (user as any)?.email?.includes('restaurant') || (user as any)?.role === 'restaurant';

  return (
    <Switch>
      <Route path="/" component={isRestaurantOwner ? RestaurantDashboard : Home} />
      <Route path="/dashboard" component={RestaurantDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="todays-special-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;