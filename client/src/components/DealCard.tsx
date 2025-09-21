import { Clock, MapPin, Star, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DealCardProps {
  id: string;
  restaurantName: string;
  restaurantPhone?: string;
  restaurantAddress?: string;
  restaurantCity?: string;
  restaurantState?: string;
  dealTitle: string;
  originalPrice: number;
  dealPrice: number;
  imageUrl: string;
  timeRemaining: string;
  distance: string;
  rating: number;
  cuisineType: string;
  onDealClick?: (id: string) => void;
}

export function DealCard({
  id,
  restaurantName,
  restaurantPhone,
  restaurantAddress,
  restaurantCity,
  restaurantState,
  dealTitle,
  originalPrice,
  dealPrice,
  imageUrl,
  timeRemaining,
  distance,
  rating,
  cuisineType,
  onDealClick,
}: DealCardProps) {
  const savings = originalPrice - dealPrice;
  const savingsPercent = Math.round((savings / originalPrice) * 100);

  const handleCardClick = () => {
    onDealClick?.(id);
    console.log(`Deal clicked: ${id}`);
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking call button
    if (restaurantPhone) {
      window.location.href = `tel:${restaurantPhone}`;
    }
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer group" 
      onClick={handleCardClick}
      data-testid={`card-deal-${id}`}
    >
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={dealTitle}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="destructive" className="bg-primary text-primary-foreground">
            {savingsPercent}% OFF
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {cuisineType}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{rating}</span>
          </div>
        </div>
        
        <h3 className="font-heading font-semibold text-lg mb-1 line-clamp-2" data-testid={`text-deal-title-${id}`}>
          {dealTitle}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-1" data-testid={`text-restaurant-${id}`}>
          {restaurantName}
        </p>
        
        {(restaurantAddress || restaurantCity || restaurantState) && (
          <p className="text-xs text-muted-foreground mb-2 flex items-center" data-testid={`text-restaurant-address-${id}`}>
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {[restaurantAddress, restaurantCity, restaurantState].filter(Boolean).join(', ')}
            </span>
          </p>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary" data-testid={`text-deal-price-${id}`}>
              ${dealPrice.toFixed(2)}
            </span>
            <span className="text-sm line-through text-muted-foreground">
              ${originalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {distance}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-primary font-medium">
            Save ${savings.toFixed(2)}
          </div>
          {restaurantPhone && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCallClick}
              className="gap-1 text-xs h-7"
              data-testid={`button-call-${id}`}
            >
              <Phone className="h-3 w-3" />
              Call to Order
            </Button>
          )}
        </div>
        
        {restaurantPhone && (
          <div className="text-xs text-muted-foreground mt-1" data-testid={`text-phone-${id}`}>
            <Phone className="h-3 w-3 inline mr-1" />
            {restaurantPhone}
          </div>
        )}
      </CardContent>
    </Card>
  );
}