import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import heroImage from "@assets/generated_images/Restaurant_food_collage_hero_28280a95.png";

interface HeroSectionProps {
  onLocationSet?: (location: string) => void;
  onExploreClick?: () => void;
}

export function HeroSection({ onLocationSet, onExploreClick }: HeroSectionProps) {
  const [location, setLocation] = useState("");

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onLocationSet?.(location);
      console.log(`Location set to: ${location}`);
    }
  };

  const handleExploreClick = () => {
    onExploreClick?.();
    console.log('Explore deals clicked');
  };

  return (
    <div className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <Badge variant="outline" className="bg-background/20 backdrop-blur-sm text-white border-white/30 mb-4">
            <span className="text-primary">🔥</span>
            Limited Time Offers
          </Badge>
        </div>
        
        <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
          Today's Special
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-2">
          Discover Amazing Daily Deals
        </p>
        
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          From Local Restaurants Near You
        </p>

        {/* Location Input */}
        <form onSubmit={handleLocationSubmit} className="flex gap-2 max-w-md mx-auto mb-6">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter your location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 bg-background/90 backdrop-blur-sm border-background/20"
              data-testid="input-hero-location"
            />
          </div>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            data-testid="button-set-location"
          >
            <Search className="h-4 w-4 mr-2" />
            Find Deals
          </Button>
        </form>

        {/* Explore Button */}
        <Button 
          variant="outline" 
          size="lg"
          className="bg-background/10 backdrop-blur-sm border-white/30 text-white hover:bg-background/20"
          onClick={handleExploreClick}
          data-testid="button-explore-deals"
        >
          Explore All Deals
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">500+</div>
            <div className="text-sm text-white/80">Restaurants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">50%</div>
            <div className="text-sm text-white/80">Avg Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">24/7</div>
            <div className="text-sm text-white/80">New Deals</div>
          </div>
        </div>
      </div>
    </div>
  );
}