import { SearchFilters } from '../SearchFilters';
import { useState } from 'react';

export default function SearchFiltersExample() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Italian", "Mexican"]);
  const [location, setLocation] = useState("San Francisco, CA");
  const [sortBy, setSortBy] = useState("distance");

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  return (
    <div className="max-w-4xl p-4">
      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCuisines={selectedCuisines}
        onCuisineToggle={handleCuisineToggle}
        location={location}
        onLocationChange={setLocation}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onFiltersOpen={() => console.log('Filters opened')}
      />
    </div>
  );
}