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

// Sample address data for autocomplete - in production this would come from an API
const SAMPLE_ADDRESSES = [
  { street: "123 Main St", city: "New York", state: "NY", zipCode: "10001" },
  { street: "456 Broadway", city: "New York", state: "NY", zipCode: "10002" },
  { street: "789 Oak Ave", city: "Los Angeles", state: "CA", zipCode: "90210" },
  { street: "321 Pine St", city: "Beverly Hills", state: "CA", zipCode: "90211" },
  { street: "654 Elm Dr", city: "Chicago", state: "IL", zipCode: "60601" },
  { street: "987 Maple Ln", city: "Chicago", state: "IL", zipCode: "60602" },
  { street: "147 Cedar Blvd", city: "Dallas", state: "TX", zipCode: "75201" },
  { street: "258 Birch Way", city: "Dallas", state: "TX", zipCode: "75202" },
  { street: "369 Spruce Ct", city: "Frisco", state: "TX", zipCode: "75035" },
  { street: "741 Willow Rd", city: "Miami", state: "FL", zipCode: "33101" },
  { street: "852 Cherry St", city: "Miami", state: "FL", zipCode: "33102" },
  { street: "963 Ash Ave", city: "San Francisco", state: "CA", zipCode: "94102" },
  { street: "159 Poplar Dr", city: "San Francisco", state: "CA", zipCode: "94103" },
  { street: "267 Hickory Ln", city: "Seattle", state: "WA", zipCode: "98101" },
  { street: "348 Sycamore St", city: "Seattle", state: "WA", zipCode: "98102" },
  { street: "426 Dogwood Ct", city: "Atlanta", state: "GA", zipCode: "30309" },
  { street: "537 Magnolia Way", city: "Atlanta", state: "GA", zipCode: "30310" },
  { street: "648 Peach Tree Rd", city: "Boston", state: "MA", zipCode: "02101" },
  { street: "759 Apple Blossom Dr", city: "Boston", state: "MA", zipCode: "02102" },
  { street: "860 Orange Grove Ave", city: "Philadelphia", state: "PA", zipCode: "19101" },
];

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  ...props 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<typeof SAMPLE_ADDRESSES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = SAMPLE_ADDRESSES.filter(addr => {
      const fullAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
      return fullAddress.toLowerCase().includes(query) ||
             addr.street.toLowerCase().includes(query) ||
             addr.city.toLowerCase().includes(query) ||
             addr.state.toLowerCase().includes(query) ||
             (addr.zipCode && addr.zipCode.includes(query));
    }).slice(0, 8); // Limit to 8 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (address: typeof SAMPLE_ADDRESSES[0]) => {
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    onChange(fullAddress);
    setShowSuggestions(false);
    
    if (onAddressSelect) {
      onAddressSelect(address);
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
      
      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto"
        >
          {suggestions.map((address, index) => (
            <li
              key={`${address.street}-${address.city}-${address.zipCode}`}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm hover:bg-muted",
                highlightedIndex === index && "bg-muted"
              )}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => handleSuggestionClick(address)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="font-medium">
                {address.street}
              </div>
              <div className="text-muted-foreground text-xs">
                {address.city}, {address.state} {address.zipCode}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}