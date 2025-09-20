import { DealGrid } from '../DealGrid';

// todo: remove mock functionality
const mockDeals = [
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
    isFavorite: false,
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
    isFavorite: true,
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
    isFavorite: false,
  },
];

export default function DealGridExample() {
  return (
    <div className="p-6">
      <DealGrid
        deals={mockDeals}
        loading={false}
        onFavoriteToggle={(dealId) => console.log('Favorite toggled:', dealId)}
        onDealClick={(dealId) => console.log('Deal clicked:', dealId)}
      />
    </div>
  );
}