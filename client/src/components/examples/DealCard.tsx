import { DealCard } from '../DealCard';

export default function DealCardExample() {
  return (
    <div className="max-w-sm">
      <DealCard
        id="1"
        restaurantName="Mario's Italian Kitchen"
        dealTitle="Authentic Margherita Pizza with Fresh Basil"
        originalPrice={18.99}
        dealPrice={12.99}
        imageUrl="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop"
        timeRemaining="2h 30m"
        distance="0.5 mi"
        rating={4.8}
        cuisineType="Italian"
        isFavorite={false}
        onFavoriteToggle={(id) => console.log('Favorite toggled:', id)}
        onDealClick={(id) => console.log('Deal clicked:', id)}
      />
    </div>
  );
}