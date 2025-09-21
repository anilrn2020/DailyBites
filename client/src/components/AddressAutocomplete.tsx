import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: { 
    street?: string; 
    city: string; 
    state: string; 
    zipCode?: string; 
  }) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

interface NominatimResult {
  place_id: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  ...props 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const debounceTimerRef = useRef<number>();

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const encodedQuery = encodeURIComponent(value.trim());
        // Using Nominatim API with US-specific search
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=us&q=${encodedQuery}`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TodaysSpecialApp/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data: NominatimResult[] = await response.json();
          // Filter for addresses that have meaningful address components
          const validAddresses = data.filter(item => 
            item.address && 
            (item.address.city || item.address.town || item.address.village || item.address.hamlet) && 
            item.address.state
          );
          
          setSuggestions(validAddresses);
          setShowSuggestions(validAddresses.length > 0);
        }
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
      setHighlightedIndex(-1);
    }, 300);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (result: NominatimResult) => {
    // Parse the address components
    const street = result.address.house_number && result.address.road 
      ? `${result.address.house_number} ${result.address.road}`
      : result.address.road || '';
    
    const city = result.address.city || result.address.town || result.address.village || result.address.hamlet || '';
    const state = result.address.state || '';
    const zipCode = result.address.postcode || '';
    
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`.replace(/,\s*,/g, ',').trim();
    onChange(fullAddress);
    setShowSuggestions(false);
    
    if (onAddressSelect && city && state) {
      onAddressSelect({
        street: street || undefined,
        city,
        state,
        zipCode: zipCode || undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={cn("", className)}
        {...props}
      />
      
      {showSuggestions && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Searching addresses...
            </li>
          )}
          {!loading && suggestions.length === 0 && value.trim().length >= 3 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No addresses found
            </li>
          )}
          {!loading && suggestions.map((result, index) => {
            const street = result.address.house_number && result.address.road 
              ? `${result.address.house_number} ${result.address.road}`
              : result.address.road || '';
            
            const city = result.address.city || result.address.town || result.address.village || result.address.hamlet || '';
            
            return (
              <li
                key={result.place_id}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm hover:bg-muted",
                  highlightedIndex === index && "bg-muted"
                )}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                onClick={() => handleSuggestionClick(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">
                  {street || city}
                </div>
                <div className="text-muted-foreground text-xs">
                  {city}, {result.address.state} {result.address.postcode}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}