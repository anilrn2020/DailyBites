# Today's Special - Restaurant Deals App Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from food delivery platforms like DoorDash and Uber Eats, combined with deal discovery apps like Groupon, to create a familiar yet distinctive experience focused on daily specials discovery.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light Mode: 15 85% 45% (vibrant orange-red for appetite appeal)
- Dark Mode: 15 75% 55% (slightly brighter for dark backgrounds)

**Secondary Colors:**
- Light Mode: 220 15% 96% (soft gray backgrounds)
- Dark Mode: 220 15% 12% (dark charcoal)

**Accent Colors:**
- Success: 140 60% 45% (for deal savings/success states)
- Warning: 45 90% 55% (for limited time offers)

### Typography
**Font Families:**
- Primary: Inter (clean, modern readability)
- Headings: Poppins (friendly, approachable for restaurant names)

**Font Weights:**
- Regular (400) for body text
- Medium (500) for labels and secondary headings
- Semibold (600) for primary headings and CTAs
- Bold (700) for deal prices and savings

### Layout System
**Spacing Primitives:** Consistent use of Tailwind units 2, 4, 6, 8, and 12
- `p-4, m-6, gap-8` for standard component spacing
- `p-2` for tight button padding
- `p-8, m-12` for section spacing

### Component Library

**Navigation:**
- Bottom tab navigation for mobile (deals, favorites, search, profile)
- Top navigation with location selector and search for desktop
- Restaurant admin sidebar with dashboard sections

**Cards:**
- Deal cards with restaurant logo, dish image, original/deal price, time remaining
- Restaurant cards with cuisine tags, rating, and favorite toggle
- Subscription plan cards with feature comparison

**Forms:**
- Clean input fields with floating labels
- Toggle switches for notification preferences
- Multi-step restaurant registration with progress indicator

**Data Displays:**
- Map integration for location-based browsing
- Grid/list toggle for deal viewing
- Analytics charts for restaurant dashboard

**Overlays:**
- Deal detail modals with full description and restaurant info
- Location permission prompts
- Subscription upgrade modals

### Visual Treatments

**Gradients:**
- Subtle orange-to-red gradients for deal savings badges
- Background gradients from 15 85% 45% to 25 80% 40% for hero sections
- Muted gradients in dark mode using 220 15% 12% to 220 20% 8%

**Imagery Strategy:**
- Hero section: Large food photography showcasing diverse cuisines
- Deal cards: Square food images with consistent aspect ratios
- Restaurant profiles: Logo/storefront images
- Empty states: Friendly illustrations for no deals/favorites

**Interaction Design:**
- Swipe gestures for deal card actions (favorite, share)
- Pull-to-refresh for deal feeds
- Smooth transitions between map and list views
- Haptic feedback for deal notifications

### Key Design Principles
1. **Appetite Appeal**: Use warm colors and high-quality food imagery
2. **Urgency**: Clear countdown timers and "limited time" indicators
3. **Trust**: Restaurant verification badges and customer reviews
4. **Efficiency**: Quick deal discovery with smart filters and location awareness
5. **Flexibility**: Seamless switching between customer and restaurant admin interfaces

### Images
**Hero Image:** Large, appetizing collage of diverse local dishes with subtle overlay gradients
**Deal Cards:** Square food photography (1:1 aspect ratio) for consistency
**Restaurant Profiles:** Circular logo images with fallback to cuisine type icons
**Empty States:** Custom illustrations showing friendly chef characters or empty plates with encouraging messaging

This design creates a trustworthy, appetite-driven experience that makes discovering local restaurant deals both efficient and enjoyable while maintaining professional credibility for restaurant partners.