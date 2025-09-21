// Simple geocoding utility for converting zip codes and city/state to coordinates
// In production, this would use a real geocoding service like Google Maps API

export interface Coordinates {
  lat: number;
  lng: number;
}

// Sample US zip code to coordinates mapping (subset for demonstration)
const ZIP_TO_COORDS: Record<string, Coordinates> = {
  // Major cities and surrounding areas
  "10001": { lat: 40.7505, lng: -73.9934 }, // New York, NY
  "10002": { lat: 40.7209, lng: -73.9896 },
  "10003": { lat: 40.7316, lng: -73.9891 },
  "90210": { lat: 34.0901, lng: -118.4065 }, // Beverly Hills, CA
  "90211": { lat: 34.0836, lng: -118.4006 },
  "60601": { lat: 41.8827, lng: -87.6233 }, // Chicago, IL
  "60602": { lat: 41.8799, lng: -87.6338 },
  "75201": { lat: 32.7767, lng: -96.7970 }, // Dallas, TX
  "75202": { lat: 32.7767, lng: -96.8089 },
  "75035": { lat: 32.9537, lng: -96.8236 }, // Frisco, TX
  "33101": { lat: 25.7617, lng: -80.1918 }, // Miami, FL
  "33102": { lat: 25.7743, lng: -80.1937 },
  "94102": { lat: 37.7849, lng: -122.4094 }, // San Francisco, CA
  "94103": { lat: 37.7749, lng: -122.4194 },
  "98101": { lat: 47.6097, lng: -122.3331 }, // Seattle, WA
  "98102": { lat: 47.6205, lng: -122.3212 },
  "30309": { lat: 33.7490, lng: -84.3880 }, // Atlanta, GA
  "30310": { lat: 33.7490, lng: -84.4110 },
  "02101": { lat: 42.3601, lng: -71.0589 }, // Boston, MA
  "02102": { lat: 42.3584, lng: -71.0598 },
  "19101": { lat: 39.9526, lng: -75.1652 }, // Philadelphia, PA
  "19102": { lat: 39.9500, lng: -75.1667 },
  "20001": { lat: 38.9072, lng: -77.0369 }, // Washington, DC
  "20002": { lat: 38.8973, lng: -76.9951 },
  "80201": { lat: 39.7392, lng: -104.9903 }, // Denver, CO
  "80202": { lat: 39.7545, lng: -105.0078 },
};

// Major US cities with state abbreviations
const CITY_STATE_TO_COORDS: Record<string, Coordinates> = {
  "new york,ny": { lat: 40.7128, lng: -74.0060 },
  "los angeles,ca": { lat: 34.0522, lng: -118.2437 },
  "chicago,il": { lat: 41.8781, lng: -87.6298 },
  "houston,tx": { lat: 29.7604, lng: -95.3698 },
  "phoenix,az": { lat: 33.4484, lng: -112.0740 },
  "philadelphia,pa": { lat: 39.9526, lng: -75.1652 },
  "san antonio,tx": { lat: 29.4241, lng: -98.4936 },
  "san diego,ca": { lat: 32.7157, lng: -117.1611 },
  "dallas,tx": { lat: 32.7767, lng: -96.7970 },
  "san jose,ca": { lat: 37.3382, lng: -121.8863 },
  "austin,tx": { lat: 30.2672, lng: -97.7431 },
  "jacksonville,fl": { lat: 30.3322, lng: -81.6557 },
  "fort worth,tx": { lat: 32.7555, lng: -97.3308 },
  "columbus,oh": { lat: 39.9612, lng: -82.9988 },
  "san francisco,ca": { lat: 37.7749, lng: -122.4194 },
  "charlotte,nc": { lat: 35.2271, lng: -80.8431 },
  "indianapolis,in": { lat: 39.7684, lng: -86.1581 },
  "seattle,wa": { lat: 47.6062, lng: -122.3321 },
  "denver,co": { lat: 39.7392, lng: -104.9903 },
  "boston,ma": { lat: 42.3601, lng: -71.0589 },
  "detroit,mi": { lat: 42.3314, lng: -83.0458 },
  "nashville,tn": { lat: 36.1627, lng: -86.7816 },
  "memphis,tn": { lat: 35.1495, lng: -90.0490 },
  "portland,or": { lat: 45.5152, lng: -122.6784 },
  "oklahoma city,ok": { lat: 35.4676, lng: -97.5164 },
  "las vegas,nv": { lat: 36.1699, lng: -115.1398 },
  "baltimore,md": { lat: 39.2904, lng: -76.6122 },
  "louisville,ky": { lat: 38.2527, lng: -85.7585 },
  "milwaukee,wi": { lat: 43.0389, lng: -87.9065 },
  "albuquerque,nm": { lat: 35.0844, lng: -106.6504 },
  "tucson,az": { lat: 32.2226, lng: -110.9747 },
  "fresno,ca": { lat: 36.7378, lng: -119.7871 },
  "sacramento,ca": { lat: 38.5816, lng: -121.4944 },
  "mesa,az": { lat: 33.4152, lng: -111.8315 },
  "kansas city,mo": { lat: 39.0997, lng: -94.5786 },
  "atlanta,ga": { lat: 33.7490, lng: -84.3880 },
  "miami,fl": { lat: 25.7617, lng: -80.1918 },
  "raleigh,nc": { lat: 35.7796, lng: -78.6382 },
  "omaha,ne": { lat: 41.2565, lng: -95.9345 },
  "miami beach,fl": { lat: 25.7907, lng: -80.1300 },
  "virginia beach,va": { lat: 36.8529, lng: -75.9780 },
  "oakland,ca": { lat: 37.8044, lng: -122.2711 },
  "minneapolis,mn": { lat: 44.9778, lng: -93.2650 },
  "tulsa,ok": { lat: 36.1540, lng: -95.9928 },
  "arlington,tx": { lat: 32.7357, lng: -97.1081 },
  "new orleans,la": { lat: 29.9511, lng: -90.0715 },
  "wichita,ks": { lat: 37.6872, lng: -97.3301 },
  "cleveland,oh": { lat: 41.4993, lng: -81.6944 },
  "tampa,fl": { lat: 27.9506, lng: -82.4572 },
  "bakersfield,ca": { lat: 35.3733, lng: -119.0187 },
  "aurora,co": { lat: 39.7294, lng: -104.8319 },
  "anaheim,ca": { lat: 33.8366, lng: -117.9143 },
  "honolulu,hi": { lat: 21.3099, lng: -157.8581 },
  "santa ana,ca": { lat: 33.7455, lng: -117.8677 },
  "riverside,ca": { lat: 33.9533, lng: -117.3962 },
  "corpus christi,tx": { lat: 27.8006, lng: -97.3964 },
  "lexington,ky": { lat: 38.0406, lng: -84.5037 },
  "stockton,ca": { lat: 37.9577, lng: -121.2908 },
  "henderson,nv": { lat: 36.0395, lng: -114.9817 },
  "saint paul,mn": { lat: 44.9537, lng: -93.0900 },
  "st. louis,mo": { lat: 38.6270, lng: -90.1994 },
  "cincinnati,oh": { lat: 39.1031, lng: -84.5120 },
  "pittsburgh,pa": { lat: 40.4406, lng: -79.9959 },
  "greensboro,nc": { lat: 36.0726, lng: -79.7920 },
  "plano,tx": { lat: 33.0198, lng: -96.6989 },
  "frisco,tx": { lat: 33.1507, lng: -96.8236 },
  "lincoln,ne": { lat: 40.8136, lng: -96.7026 },
  "anchorage,ak": { lat: 61.2181, lng: -149.9003 },
  "buffalo,ny": { lat: 42.8864, lng: -78.8784 },
  "fort wayne,in": { lat: 41.0793, lng: -85.1394 },
  "jersey city,nj": { lat: 40.7178, lng: -74.0431 },
  "chula vista,ca": { lat: 32.6401, lng: -117.0842 },
  "orlando,fl": { lat: 28.5383, lng: -81.3792 },
  "norfolk,va": { lat: 36.8468, lng: -76.2852 },
  "chandler,az": { lat: 33.3062, lng: -111.8413 },
  "laredo,tx": { lat: 27.5306, lng: -99.4803 },
  "madison,wi": { lat: 43.0731, lng: -89.4012 },
  "lubbock,tx": { lat: 33.5779, lng: -101.8552 },
  "winston-salem,nc": { lat: 36.0999, lng: -80.2442 },
  "garland,tx": { lat: 32.9126, lng: -96.6389 },
  "glendale,az": { lat: 33.5387, lng: -112.1860 },
  "hialeah,fl": { lat: 25.8576, lng: -80.2781 },
  "reno,nv": { lat: 39.5296, lng: -119.8138 },
  "baton rouge,la": { lat: 30.4515, lng: -91.1871 },
  "irvine,ca": { lat: 33.6846, lng: -117.8265 },
  "chesapeake,va": { lat: 36.7682, lng: -76.2875 },
  "irving,tx": { lat: 32.8140, lng: -96.9489 },
  "scottsdale,az": { lat: 33.4942, lng: -111.9261 },
  "north las vegas,nv": { lat: 36.1989, lng: -115.1175 },
  "fremont,ca": { lat: 37.5485, lng: -121.9886 },
  "gilbert,az": { lat: 33.3528, lng: -111.7890 },
  "san bernardino,ca": { lat: 34.1083, lng: -117.2898 },
  "boise,id": { lat: 43.6150, lng: -116.2023 },
  "birmingham,al": { lat: 33.5207, lng: -86.8025 }
};

export function parseLocation(location: string): Coordinates | null {
  if (!location) return null;
  
  const trimmed = location.trim().toLowerCase();
  
  // Check if it's a zip code (5 digits)
  const zipMatch = trimmed.match(/^\d{5}$/);
  if (zipMatch) {
    return ZIP_TO_COORDS[zipMatch[0]] || null;
  }
  
  // Check if it's city, state format
  const cityStateMatch = trimmed.match(/^(.+),\s*([a-z]{2})$/);
  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2].trim();
    const key = `${city},${state}`;
    return CITY_STATE_TO_COORDS[key] || null;
  }
  
  // Try to find by city name alone (match the first occurrence)
  const cityMatch = Object.keys(CITY_STATE_TO_COORDS).find(key => 
    key.startsWith(trimmed + ',')
  );
  if (cityMatch) {
    return CITY_STATE_TO_COORDS[cityMatch];
  }
  
  return null;
}

// Calculate distance between two coordinates in miles
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}