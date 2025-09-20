import { DealCard } from "./DealCard";
import { Loader2 } from "lucide-react";

interface Deal {
  id: string;
  restaurantName: string;
  dealTitle: string;
  originalPrice: number;
  dealPrice: number;
  imageUrl: string;
  timeRemaining: string;
  distance: string;
  rating: number;
  cuisineType: string;
  isFavorite?: boolean;
}

interface DealGridProps {
  deals: Deal[];
  loading?: boolean;
  onFavoriteToggle?: (dealId: string) => void;
  onDealClick?: (dealId: string) => void;
}

export function DealGrid({ 
  deals, 
  loading = false, 
  onFavoriteToggle, 
  onDealClick 
}: DealGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading deals...</span>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="font-heading text-xl font-semibold mb-2">No deals found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or check back later for new deals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {deals.map((deal) => (
        <DealCard
          key={deal.id}
          {...deal}
          onFavoriteToggle={onFavoriteToggle}
          onDealClick={onDealClick}
        />
      ))}
    </div>
  );
}