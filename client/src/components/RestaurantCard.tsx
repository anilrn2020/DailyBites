import { MapPin, Star, Heart, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RestaurantCardProps {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  cuisineTypes: string[];
  distance: string;
  estimatedDelivery: string;
  activeDealCount: number;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onRestaurantClick?: (id: string) => void;
}

export function RestaurantCard({
  id,
  name,
  imageUrl,
  rating,
  reviewCount,
  cuisineTypes,
  distance,
  estimatedDelivery,
  activeDealCount,
  isFavorite = false,
  onFavoriteToggle,
  onRestaurantClick,
}: RestaurantCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite(!favorite);
    onFavoriteToggle?.(id);
    console.log(`Restaurant favorite toggled ${id}: ${!favorite}`);
  };

  const handleCardClick = () => {
    onRestaurantClick?.(id);
    console.log(`Restaurant clicked: ${id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer group"
      onClick={handleCardClick}
      data-testid={`card-restaurant-${id}`}
    >
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleFavoriteClick}
            data-testid={`button-favorite-restaurant-${id}`}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        {activeDealCount > 0 && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="bg-primary text-primary-foreground">
              {activeDealCount} deal{activeDealCount > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-heading font-semibold text-lg mb-2" data-testid={`text-restaurant-name-${id}`}>
          {name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {cuisineTypes.map((cuisine, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {cuisine}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {distance}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimatedDelivery}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}