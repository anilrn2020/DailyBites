import { RestaurantCard } from '../RestaurantCard';

export default function RestaurantCardExample() {
  return (
    <div className="max-w-sm">
      <RestaurantCard
        id="rest-1"
        name="Bella Vista Restaurant"
        imageUrl="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
        rating={4.6}
        reviewCount={234}
        cuisineTypes={["Italian", "Mediterranean"]}
        distance="1.2 mi"
        estimatedDelivery="25-40 min"
        activeDealCount={3}
        isFavorite={true}
        onFavoriteToggle={(id) => console.log('Restaurant favorite toggled:', id)}
        onRestaurantClick={(id) => console.log('Restaurant clicked:', id)}
      />
    </div>
  );
}