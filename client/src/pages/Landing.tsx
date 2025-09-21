import { HeroSection } from "@/components/HeroSection";
import { DealGrid } from "@/components/DealGrid";
import { SearchFilters } from "@/components/SearchFilters";
import { SubscriptionPricing } from "@/components/SubscriptionPricing";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

// todo: remove mock functionality  
const mockFeaturedDeals = [
  {
    id: "1",
    restaurantName: "Mario's Italian Kitchen",
    dealTitle: "Authentic Margherita Pizza with Fresh Basil",
    originalPrice: 18.99,
    dealPrice: 12.99,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    timeRemaining: "2h 30m",
    distance: "0.5 mi",
    rating: 4.8,
    cuisineType: "Italian",
  },
  {
    id: "2",
    restaurantName: "Sakura Sushi",
    dealTitle: "Premium Sashimi Platter for Two",
    originalPrice: 45.00,
    dealPrice: 29.99,
    imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
    timeRemaining: "1h 15m",
    distance: "0.8 mi",
    rating: 4.9,
    cuisineType: "Japanese",
  },
  {
    id: "3",
    restaurantName: "Taco Libre",
    dealTitle: "Street Taco Trio with Guacamole",
    originalPrice: 14.50,
    dealPrice: 9.99,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
    timeRemaining: "3h 45m",
    distance: "1.2 mi",
    rating: 4.5,
    cuisineType: "Mexican",
  },
];

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [location, setLocation] = useState("San Francisco, CA");
  const [sortBy, setSortBy] = useState("distance");

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleRestaurantLogin = () => {
    window.location.href = "/api/login";
  };

  const handleCustomerLogin = () => {
    window.location.href = "/api/login/customer";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-primary">Today's Special</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleCustomerLogin} data-testid="button-customer-login">
              Customer Login
            </Button>
            <Button variant="outline" onClick={handleRestaurantLogin} data-testid="button-restaurant-login">
              Restaurant Login
            </Button>
            <Link href="/signup/customer">
              <Button variant="outline" data-testid="button-customer-signup">
                Customer Sign Up
              </Button>
            </Link>
            <Link href="/signup/restaurant">
              <Button data-testid="button-restaurant-signup">
                Restaurant Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection 
        onLocationSet={setLocation}
        onExploreClick={() => console.log('Explore clicked')}
      />

      {/* Featured Deals Section */}
      <section className="py-12 container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">Featured Today</Badge>
          <h2 className="font-heading text-3xl font-bold mb-4">
            Hottest Deals Right Now
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't miss out on these limited-time offers from your favorite local restaurants
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

        {/* Deal Grid */}
        <DealGrid 
          deals={mockFeaturedDeals}
          onFavoriteToggle={(dealId) => console.log('Favorite toggled:', dealId)}
          onDealClick={(dealId) => console.log('Deal clicked:', dealId)}
        />
        
        <div className="text-center mt-8">
          <Button size="lg" onClick={handleCustomerLogin} data-testid="button-view-all-deals">
            View All Deals
          </Button>
        </div>
      </section>

      {/* Restaurant Pricing Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">
              For Restaurant Owners
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start attracting more customers today with our powerful deal platform
            </p>
          </div>
          
          <SubscriptionPricing 
            onPlanSelect={(planId) => console.log('Plan selected:', planId)}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting great deals is as easy as 1, 2, 3
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">Find Deals Near You</h3>
            <p className="text-muted-foreground">
              Enter your location and discover amazing deals from restaurants in your area
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">Save Before Time Runs Out</h3>
            <p className="text-muted-foreground">
              Grab limited-time offers and save up to 50% on your favorite dishes
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">Order & Enjoy</h3>
            <p className="text-muted-foreground">
              Contact the restaurant directly or visit to claim your special deal
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-heading text-lg font-semibold mb-4">Today's Special</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connecting hungry customers with amazing local restaurant deals every day.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                hello@todaysspecial.com
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Find Deals</a></li>
                <li><a href="#" className="hover:text-foreground">How It Works</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Restaurants</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Get Started</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 Today's Special. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}