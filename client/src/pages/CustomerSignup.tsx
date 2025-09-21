import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { customerSignupSchema, type CustomerSignup } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function CustomerSignup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<CustomerSignup>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: CustomerSignup) => apiRequest("POST", "/api/signup/customer", data),
    onSuccess: () => {
      toast({ 
        title: "Registration successful!", 
        description: "Welcome to Today's Special. You're now logged in." 
      });
      // Navigate to home page after successful signup
      setLocation("/");
    },
    onError: (error: any) => {
      let message = "Failed to register account. Please try again.";
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error === "Email already exists") {
          message = "An account with this email already exists";
        } else if (errorData.details) {
          message = errorData.details;
        }
      } catch {
        // If error parsing fails, use the original message
        if (error.message.includes("Email already exists")) {
          message = "An account with this email already exists";
        }
      }
      
      toast({ 
        title: "Registration failed", 
        description: message, 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: CustomerSignup) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back link */}
        <Link href="/" data-testid="link-back-home">
          <Button variant="ghost" className="gap-2 p-0 h-auto text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              Join Today's Special
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Create your customer account to discover amazing local deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                          data-testid="input-email"
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
                          type="password" 
                          placeholder="Enter a password (min 8 characters)" 
                          {...field} 
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700" 
                  disabled={signupMutation.isPending}
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link href="/login/customer" data-testid="link-sign-in">
                      <span className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline">
                        Sign In
                      </span>
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Restaurant owner?{" "}
            <Link href="/signup/restaurant" data-testid="link-restaurant-signup">
              <span className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline">
                Create a restaurant account
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}