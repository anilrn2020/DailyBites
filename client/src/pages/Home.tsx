import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DealGrid } from "@/components/DealGrid";
import { SearchFilters } from "@/components/SearchFilters";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, User, LogOut, Grid3X3, List, Map, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Deal } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


// Transform deal data from backend to frontend format
const transformDeal = (apiDeal: any): any => {
  return {
    id: apiDeal.id,
    restaurantName: apiDeal.restaurantName || "Restaurant", 
    restaurantPhone: apiDeal.restaurantPhone,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [location, setLocation] = useState(""); // Start with no location filter to show all deals
  const [sortBy, setSortBy] = useState("distance");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const { toast } = useToast();

  // Build query URL with parameters
  const buildDealsQuery = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('q', searchQuery);
    }
    
    if (location.trim()) {
      params.append('location', location);
      params.append('radius', '10'); // Default 10 mile radius
    }
    
    if (selectedCuisines.length > 0) {
      params.append('cuisineTypes', selectedCuisines.join(','));
    }
    
    params.append('limit', '50');
    
    return `/api/deals${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Fetch deals using useQuery
  const { data: dealsData = [], isLoading: dealsLoading, error: dealsError } = useQuery<Deal[]>({
    queryKey: [buildDealsQuery()],
    enabled: true,
  });

  // Build restaurants query URL with parameters
  const buildRestaurantsQuery = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('q', searchQuery);
    }
    
    if (location.trim()) {
      params.append('location', location);
      params.append('radius', '10'); // Default 10 mile radius
    }
    
    if (selectedCuisines.length > 0) {
      params.append('cuisineTypes', selectedCuisines.join(','));
    }
    
    params.append('limit', '50');
    
    return `/api/restaurants${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Fetch restaurants using useQuery
  const { data: restaurantsData = [], isLoading: restaurantsLoading, error: restaurantsError } = useQuery<any[]>({
    queryKey: [buildRestaurantsQuery()],
    enabled: true,
  });

  // Fetch user favorites
  const { data: favoritesData = [], isLoading: favoritesLoading, error: favoritesError } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: true,
  });

  // Create favorites state for quick lookup
  const favoriteRestaurants = new Set(favoritesData.filter(fav => fav.type === 'restaurant').map(fav => fav.restaurantId));
  const favoriteDeals = new Set(favoritesData.filter(fav => fav.type === 'deal').map(fav => fav.dealId));

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

  // Transform deals for display
  const deals = dealsData.map(transformDeal);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };


  const handleRestaurantFavoriteToggle = (restaurantId: string) => {
    if (favoriteRestaurants.has(restaurantId)) {
      removeFavoriteMutation.mutate({ type: 'restaurant', id: restaurantId });
    } else {
      addFavoriteMutation.mutate({ type: 'restaurant', restaurantId });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('Profile clicked')}>
                  <User className="h-4 w-4 mr-2" />
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

        {/* Search Filters */}
        <div className="mb-8">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCuisines={selectedCuisines}
            onCuisineToggle={handleCuisineToggle}
            location={location}
            onLocationChange={setLocation}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
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
                  {location.trim() ? `No deals found in ${location}. Try expanding your search area or removing filters.` : "No active deals at the moment. Check back soon!"}
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
                Nearby Restaurants
              </h3>
              <Badge variant="outline">
                {restaurantsLoading ? "Loading..." : `${restaurantsData.length} restaurants found`}
              </Badge>
            </div>
            
            {restaurantsError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive">
                  Failed to load restaurants. Please try again later.
                </p>
              </div>
            )}
            
{restaurantsData.length === 0 && !restaurantsLoading ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground bg-muted rounded-full flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <h4 className="font-semibold mb-2">No restaurants found</h4>
                <p className="text-muted-foreground">
                  No restaurants available at the moment. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurantsData.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    id={restaurant.id}
                    name={restaurant.name}
                    imageUrl={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"}
                    rating={parseFloat(restaurant.rating) || 4.5}
                    reviewCount={restaurant.reviewCount || 0}
                    cuisineTypes={restaurant.cuisineTypes || []}
                    distance="N/A" // We'll calculate this later with geolocation
                    estimatedDelivery="25-40 min" // Placeholder
                    activeDealCount={0} // We'll calculate this later
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
                  No Favorite Restaurants Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Save restaurants you love to quickly find them later
                </p>
                <Button variant="outline">
                  Browse Restaurants to Add Favorites
                </Button>
              </div>
            ) : favoritesData.filter(fav => fav.type === 'restaurant').length > 0 ? (
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Favorite Restaurants ({favoritesData.filter(fav => fav.type === 'restaurant').length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurantsData.filter(restaurant => favoriteRestaurants.has(restaurant.id)).map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      id={restaurant.id}
                      name={restaurant.name}
                      imageUrl={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"}
                      rating={parseFloat(restaurant.rating) || 4.5}
                      reviewCount={restaurant.reviewCount || 0}
                      cuisineTypes={restaurant.cuisineTypes || []}
                      distance="N/A"
                      estimatedDelivery="25-40 min"
                      activeDealCount={0}
                      isFavorite={true}
                      onFavoriteToggle={handleRestaurantFavoriteToggle}
                      onRestaurantClick={(id) => console.log('Restaurant clicked:', id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  No Favorite Restaurants Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Save restaurants you love to quickly find them later
                </p>
                <Button variant="outline">
                  Browse Restaurants to Add Favorites
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}