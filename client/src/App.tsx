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
import RestaurantSignup from "@/pages/RestaurantSignup";
import CustomerSignup from "@/pages/CustomerSignup";
import CustomerLogin from "@/pages/CustomerLogin";
import RestaurantLogin from "@/pages/RestaurantLogin";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login/customer" component={CustomerLogin} />
        <Route path="/login/restaurant" component={RestaurantLogin} />
        <Route path="/signup/restaurant" component={RestaurantSignup} />
        <Route path="/signup/customer" component={CustomerSignup} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Determine if user is a restaurant owner based on userType from authentication
  const isRestaurantOwner = (user as any)?.userType === 'restaurant';

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