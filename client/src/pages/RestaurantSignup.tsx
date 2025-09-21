import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { publicInsertRestaurantSchema } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

// Combined signup schema for user + restaurant data
const restaurantSignupSchema = z.object({
  // User data
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Restaurant data
  restaurant: publicInsertRestaurantSchema,
});

type RestaurantSignupData = z.infer<typeof restaurantSignupSchema>;

export default function RestaurantSignup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handler for address autocomplete selection
  const handleAddressSelect = (address: { 
    street?: string; 
    city: string; 
    state: string; 
    zipCode?: string; 
  }) => {
    // Auto-populate city, state, and zip code fields when address is selected
    form.setValue("restaurant.city", address.city);
    form.setValue("restaurant.state", address.state);
    if (address.zipCode) {
      form.setValue("restaurant.zipCode", address.zipCode);
    }
  };
  
  const form = useForm<RestaurantSignupData>({
    resolver: zodResolver(restaurantSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      restaurant: {
        name: "",
        description: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        email: "",
        website: "",
        cuisineTypes: [],
        latitude: "",
        longitude: "",
        imageUrl: "",
      },
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: RestaurantSignupData) => apiRequest("POST", "/api/signup/restaurant", data),
    onSuccess: () => {
      // Invalidate auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({ 
        title: "Registration successful!", 
        description: "Welcome to Today's Special. You're now logged in." 
      });
      
      // Navigate to dashboard after successful signup
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      let message = "Failed to register restaurant. Please try again.";
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error === "Email already exists") {
          message = "An account with this email already exists";
        } else if (errorData.error === "Restaurant already exists") {
          message = "User already has a restaurant account";
        } else if (errorData.details) {
          message = errorData.details;
        }
      } catch {
        // If error parsing fails, use simple string matching
        if (error.message.includes("Email already exists")) {
          message = "An account with this email already exists";
        } else if (error.message.includes("Restaurant already exists")) {
          message = "User already has a restaurant account";
        }
      }
      
      toast({ 
        title: "Registration failed", 
        description: message, 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: RestaurantSignupData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Join Today's Special</CardTitle>
            <CardDescription>
              Register your restaurant and start attracting more customers with daily deals
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
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
                            <Input {...field} data-testid="input-last-name" />
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
                          <Input type="email" {...field} data-testid="input-email" />
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
                </div>

                {/* Restaurant Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Restaurant Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="restaurant.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-restaurant-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="restaurant.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell customers about your restaurant..."
                            data-testid="input-restaurant-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="restaurant.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <AddressAutocomplete 
                            value={field.value}
                            onChange={field.onChange}
                            onAddressSelect={handleAddressSelect}
                            placeholder="Start typing an address..."
                            data-testid="input-restaurant-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="restaurant.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="restaurant.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CA" data-testid="input-restaurant-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="restaurant.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="restaurant.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(555) 123-4567" data-testid="input-restaurant-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="restaurant.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Email (Optional)</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-restaurant-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="restaurant.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://yourrestaurant.com"
                            data-testid="input-restaurant-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={signupMutation.isPending}
                    data-testid="button-signup-submit"
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Create Restaurant Account"}
                  </Button>
                  
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <Link href="/" className="text-primary hover:underline">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}