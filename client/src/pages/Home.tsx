import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DealGrid } from "@/components/DealGrid";
import { SearchFilters } from "@/components/SearchFilters";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, User as UserIcon, LogOut, Grid3X3, List, Map, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Deal, User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Customer profile update schema
const customerProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type CustomerProfile = z.infer<typeof customerProfileSchema>;


// Transform deal data from backend to frontend format
const transformDeal = (apiDeal: any): any => {
  return {
    id: apiDeal.id,
    restaurantName: apiDeal.restaurantName || "Restaurant", 
    restaurantPhone: apiDeal.restaurantPhone,
    restaurantAddress: apiDeal.restaurantAddress,
    restaurantCity: apiDeal.restaurantCity,
    restaurantState: apiDeal.restaurantState,
    dealTitle: apiDeal.title,
    originalPrice: parseFloat(apiDeal.originalPrice),
    dealPrice: parseFloat(apiDeal.dealPrice),
    imageUrl: apiDeal.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    timeRemaining: apiDeal.endTime ? formatTimeRemaining(new Date(apiDeal.endTime)) : "N/A",
    distance: apiDeal.distance ? `${apiDeal.distance.toFixed(1)} mi` : "N/A",
    rating: 4.5, // Placeholder until we have restaurant ratings
    cuisineType: apiDeal.cuisineTypes?.length > 0 ? apiDeal.cuisineTypes[0] : "Various",
  };
};

// Helper function to format time remaining
const formatTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function Home() {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  const [zipCode, setZipCode] = useState(""); // For zip code search
  const [viewMode, setViewMode] = useState("grid"); // View mode for deals display
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Profile form
  const profileForm = useForm<CustomerProfile>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });


  // Set default zip code from user's profile when user data is available
  useEffect(() => {
    if (user?.zipCode && !zipCode) {
      setZipCode(user.zipCode);
    }
  }, [user, zipCode]);


  // Populate profile form when user data is available
  useEffect(() => {
    if (user && showProfileDialog) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
      });
    }
  }, [user, showProfileDialog, profileForm]);

  // Build query URL with parameters (using location for zip code)
  const buildDealsQuery = () => {
    const params = new URLSearchParams();
    
    if (zipCode.trim()) {
      params.append('location', zipCode); // Use 'location' parameter that the API expects
      params.append('radius', '25'); // Default 25 mile radius for broader search
    }
    
    params.append('limit', '50');
    
    return `/api/deals${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Fetch deals using useQuery (only when Find Deals is clicked or zipCode exists)
  const { data: dealsData = [], isLoading: dealsLoading, error: dealsError, refetch } = useQuery<Deal[]>({
    queryKey: [buildDealsQuery()],
    enabled: false, // Don't auto-run, only when Find Deals is clicked
  });

  // Function to handle Find Deals button click
  const handleFindDeals = () => {
    if (!zipCode.trim()) {
      toast({
        title: "ZIP code required",
        description: "Please enter a ZIP code to find deals near you",
        variant: "destructive",
      });
      return;
    }
    
    // Manually trigger both deals and restaurants queries
    refetch();
    refetchRestaurants();
  };

  // Remove restaurants query since we're simplifying to just deals

  // Fetch user favorites
  const { data: favoritesData = [], isLoading: favoritesLoading, error: favoritesError } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: true,
  });

  // Create favorites state for quick lookup
  const favoriteDeals = new Set(favoritesData.filter(fav => fav.type === 'deal').map(fav => fav.dealId));

  // Update favorite restaurants state when favorites data changes
  useEffect(() => {
    if (favoritesData) {
      const restaurantFavorites = new Set(
        favoritesData.filter(fav => fav.type === 'restaurant').map(fav => fav.restaurantId)
      );
      setFavoriteRestaurants(restaurantFavorites);
    }
  }, [favoritesData]);

  // Fetch restaurants using the same zip code search
  const buildRestaurantsQuery = () => {
    const params = new URLSearchParams();
    if (zipCode.trim()) {
      params.append('location', zipCode);
    }
    return `/api/restaurants${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Fetch restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading, error: restaurantsError, refetch: refetchRestaurants } = useQuery<any[]>({
    queryKey: [buildRestaurantsQuery()],
    enabled: false, // Don't auto-run, only when Find Deals is clicked
  });

  // Handle restaurant favorite toggle
  const handleRestaurantFavoriteToggle = (restaurantId: string) => {
    if (favoriteRestaurants.has(restaurantId)) {
      // Remove from favorites
      removeFavoriteMutation.mutate({ type: 'restaurant', id: restaurantId });
      setFavoriteRestaurants(prev => {
        const newFavorites = new Set(prev);
        newFavorites.delete(restaurantId);
        return newFavorites;
      });
    } else {
      // Add to favorites
      addFavoriteMutation.mutate({ type: 'restaurant', restaurantId });
      setFavoriteRestaurants(prev => {
        const newFavorites = new Set(prev);
        newFavorites.add(restaurantId);
        return newFavorites;
      });
    }
  };

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: (data: { type: string, restaurantId?: string, dealId?: string }) => 
      apiRequest("POST", "/api/favorites", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Added to favorites",
        description: "Item added to your favorites successfully",
      });
    },
    onError: (error: any) => {
      let message = "Failed to add to favorites";
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error) {
          message = errorData.error;
        }
      } catch {}
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (data: { type: string, id: string }) => 
      apiRequest("DELETE", `/api/favorites/${data.type}/${data.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Removed from favorites",
        description: "Item removed from your favorites successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: CustomerProfile) => 
      apiRequest("PATCH", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowProfileDialog(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      let message = "Failed to update profile";
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error) {
          message = errorData.error;
        }
      } catch {}
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Transform deals for display
  const deals = dealsData.map(transformDeal);


  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleProfileClick = () => {
    setShowProfileDialog(true);
  };

  const handleProfileSubmit = (data: CustomerProfile) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-primary">Today's Special</h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Customer
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                data-testid="button-view-map"
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>

            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProfileClick}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Favorites clicked')}>
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-muted-foreground">
            Discover today's hottest deals from restaurants near you
          </p>
        </div>

        {/* ZIP Code Search */}
        <div className="mb-8">
          <div className="flex gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={zipCode.trim() === "" ? "Enter location zip code" : "Enter Zip code"}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="text-center"
                data-testid="input-zipcode"
              />
            </div>
            <Button 
              onClick={handleFindDeals}
              disabled={dealsLoading}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-find-deals"
            >
              {dealsLoading ? "Searching..." : "Find Deals"}
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="deals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deals" data-testid="tab-deals">Deals</TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="tab-restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">Favorites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deals" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-semibold">
                Available Deals
              </h3>
              <Badge variant="outline">
                {dealsLoading ? "Loading..." : `${deals.length} deals found`}
              </Badge>
            </div>
            
            {dealsError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive">
                  Failed to load deals. Please try again later.
                </p>
              </div>
            )}
            
{viewMode === "map" ? (
              <div className="bg-muted/30 rounded-lg p-12 text-center">
                <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-semibold mb-2">Map View</h4>
                <p className="text-muted-foreground">
                  Interactive map showing deals would be displayed here
                </p>
              </div>
            ) : deals.length === 0 && !dealsLoading ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground bg-muted rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">No deals found</h4>
                <p className="text-muted-foreground mb-4">
                  {zipCode.trim() ? `No deals found in ${zipCode}. Try expanding your search area.` : "Enter a ZIP code above to find deals!"}
                </p>
              </div>
            ) : (
              <DealGrid 
                deals={deals}
                loading={dealsLoading}
                onDealClick={(dealId) => console.log('Deal clicked:', dealId)}
              />
            )}
          </TabsContent>
          
          <TabsContent value="restaurants" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-semibold">
                Restaurants Near You
              </h3>
              <Badge variant="outline">
                {restaurantsLoading ? "Loading..." : `${restaurants.length} restaurants found`}
              </Badge>
            </div>
            
            {restaurantsError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive">
                  Failed to load restaurants. Please try again later.
                </p>
              </div>
            )}
            
            {restaurants.length === 0 && !restaurantsLoading ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground bg-muted rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">No restaurants found</h4>
                <p className="text-muted-foreground mb-4">
                  {zipCode.trim() ? `No restaurants found in ${zipCode}. Try expanding your search area.` : "Enter a ZIP code above to find restaurants!"}
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    id={restaurant.id}
                    name={restaurant.name}
                    imageUrl={restaurant.imageUrl || '/placeholder-restaurant.jpg'}
                    rating={4.5}
                    reviewCount={128}
                    cuisineTypes={restaurant.cuisineType ? [restaurant.cuisineType] : ['Restaurant']}
                    distance="0.5 mi"
                    estimatedDelivery="25-35 min"
                    activeDealCount={restaurant.activeDealCount || 0}
                    isFavorite={favoriteRestaurants.has(restaurant.id)}
                    onFavoriteToggle={handleRestaurantFavoriteToggle}
                    onRestaurantClick={(id) => console.log('Restaurant clicked:', id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="favorites" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-semibold">
                Your Favorites
              </h3>
              <Badge variant="outline">
                {favoritesLoading ? "Loading..." : `${favoritesData.length} favorites`}
              </Badge>
            </div>
            
            {favoritesError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive">
                  Failed to load favorites. Please try again later.
                </p>
              </div>
            )}

            {favoritesData.length === 0 && !favoritesLoading ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  No Favorites Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Save deals and restaurants you love to quickly find them later
                </p>
                <Button variant="outline" onClick={() => console.log('Browse deals clicked')}>
                  Browse Deals to Add Favorites
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  Favorites Feature Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  We're working on the favorites feature to help you save your preferred deals
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and address details.
            </DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street address" {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={profileForm.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter zip code" {...field} data-testid="input-zip-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowProfileDialog(false)}
                  data-testid="button-cancel-profile"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}