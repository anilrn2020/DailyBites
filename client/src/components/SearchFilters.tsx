import { Search, Filter, MapPin, Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCuisines: string[];
  onCuisineToggle: (cuisine: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onFiltersOpen?: () => void;
}

const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian", "Thai", 
  "American", "Mediterranean", "French", "Korean", "Vietnamese", "Greek"
];

const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "savings", label: "Best Savings" },
  { value: "ending_soon", label: "Ending Soon" },
];

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedCuisines,
  onCuisineToggle,
  location,
  onLocationChange,
  sortBy,
  onSortChange,
  onFiltersOpen,
}: SearchFiltersProps) {
  const [localLocation, setLocalLocation] = useState(location);

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLocationChange(localLocation);
    console.log(`Location changed to: ${localLocation}`);
  };

  const handleCuisineClick = (cuisine: string) => {
    onCuisineToggle(cuisine);
    console.log(`Cuisine filter toggled: ${cuisine}`);
  };

  const handleSortClick = (sort: string) => {
    onSortChange(sort);
    console.log(`Sort changed to: ${sort}`);
  };

  return (
    <div className="space-y-4">
      {/* Search and Location Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search restaurants or deals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <form onSubmit={handleLocationSubmit} className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter location..."
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
            className="pl-10 w-48"
            data-testid="input-location"
          />
        </form>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onFiltersOpen}
          data-testid="button-filters"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Cuisine Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-cuisine-filter">
              <Filter className="h-4 w-4" />
              Cuisine
              {selectedCuisines.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedCuisines.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Cuisine Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CUISINE_OPTIONS.map((cuisine) => (
              <DropdownMenuItem 
                key={cuisine}
                onClick={() => handleCuisineClick(cuisine)}
                className="flex items-center justify-between cursor-pointer"
              >
                {cuisine}
                {selectedCuisines.includes(cuisine) && (
                  <Badge variant="secondary" className="ml-2">✓</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-sort">
              Sort: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || "Distance"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => handleSortClick(option.value)}
                className="cursor-pointer"
              >
                {option.label}
                {sortBy === option.value && (
                  <Badge variant="secondary" className="ml-2">✓</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Filters */}
        {selectedCuisines.map((cuisine) => (
          <Badge 
            key={cuisine} 
            variant="secondary" 
            className="cursor-pointer hover-elevate"
            onClick={() => handleCuisineClick(cuisine)}
          >
            {cuisine} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}