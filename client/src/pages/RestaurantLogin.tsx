import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { restaurantLoginSchema, type RestaurantLogin } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function RestaurantLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RestaurantLogin>({
    resolver: zodResolver(restaurantLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: RestaurantLogin) => apiRequest("POST", "/api/login/restaurant", data),
    onSuccess: () => {
      // Invalidate auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Login successful",
        description: "Welcome back to your restaurant dashboard!",
      });
      
      // Redirect to root path which handles user type routing correctly
      setLocation("/");
    },
    onError: (error: any) => {
      let message = "Please check your credentials and try again.";
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.details) {
          message = errorData.details;
        } else if (errorData.error) {
          message = errorData.error;
        }
      } catch {
        // If error parsing fails, use the error message directly
        if (error.message) {
          message = error.message;
        }
      }
      
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RestaurantLogin) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Restaurant Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your restaurant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        data-testid="input-email"
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        data-testid="input-password"
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Not registered?{" "}
              <Link href="/signup/restaurant">
                <span className="text-primary hover:underline cursor-pointer" data-testid="link-signup">
                  Sign up
                </span>
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}