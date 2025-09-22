import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import {
  insertRestaurantSchema,
  insertDealSchema,
  insertFavoriteSchema,
  publicInsertRestaurantSchema,
  publicUpdateRestaurantSchema,
  publicUpdateDealSchema,
  updateUserProfileSchema,
  customerSignupSchema,
  customerLoginSchema,
  restaurantLoginSchema,
  publicRestaurantSchema,
  type User,
  type Restaurant,
  type Deal,
  type PublicRestaurant,
  type CustomerSignup,
  type CustomerLogin,
  type RestaurantLogin,
} from "@shared/schema";
import { storage } from "./storage";
import { parseLocation } from "./geocoding";

// Initialize Stripe - Use testing keys in development
const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper to get authenticated user
  const getAuthenticatedUser = async (req: any): Promise<User | null> => {
    if (!req.session?.userId) {
      return null;
    }
    const user = await storage.getUser(req.session.userId);
    return user || null;
  };

  // Middleware to require authentication
  const requireAuth = async (req: any, res: any, next: any) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.user = user;
    next();
  };

  // Middleware to require restaurant owner
  const requireRestaurantOwner = async (req: any, res: any, next: any) => {
    if (req.user?.userType !== "restaurant") {
      return res.status(403).json({ error: "Restaurant owner access required" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/login/restaurant", async (req: any, res: any) => {
    try {
      const body = req.body;
      
      // Validate login data
      const loginData = restaurantLoginSchema.parse(body);
      
      // Normalize email to lowercase to prevent case sensitivity issues
      const normalizedEmail = loginData.email.toLowerCase();
      
      // Find user by email
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        console.log(`Login attempt failed: User not found for email ${normalizedEmail}`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      // Check if user is a restaurant owner
      if (user.userType !== "restaurant") {
        console.log(`Login attempt failed: User ${normalizedEmail} is not a restaurant owner`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      // Validate password
      if (!user.password) {
        console.log(`Login attempt failed: User ${normalizedEmail} has no password set`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        console.log(`Login attempt failed: Invalid password for user ${normalizedEmail}`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      // Regenerate session to prevent session fixation
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        
        // Set session
        req.session.userId = user.id;
        
        // Save session and return success
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Login failed" });
          }
          res.status(200).json({ 
            message: "Login successful",
            user: { 
              id: user.id, 
              email: user.email, 
              firstName: user.firstName, 
              lastName: user.lastName, 
              userType: user.userType 
            } 
          });
        });
      });
    } catch (error) {
      console.error("Restaurant login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => e.message).join(", ")
        });
      }
      res.status(400).json({ error: "Login failed" });
    }
  });

  // Customer login route
  app.post("/api/login/customer", async (req: any, res: any) => {
    try {
      const body = req.body;
      
      // Validate login data
      const loginData = customerLoginSchema.parse(body);
      
      // Normalize email to lowercase to prevent case sensitivity issues
      const normalizedEmail = loginData.email.toLowerCase();
      
      // Find user by email
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        console.log(`Login attempt failed: User not found for email ${normalizedEmail}`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      // Check if user is a customer
      if (user.userType !== "customer") {
        console.log(`Login attempt failed: User ${normalizedEmail} is not a customer`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      // Validate password
      if (!user.password) {
        console.log(`Login attempt failed: User ${normalizedEmail} has no password set`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        console.log(`Login attempt failed: Invalid password for user ${normalizedEmail}`);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: "Invalid email or password"
        });
      }
      
      // Regenerate session to prevent session fixation
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        
        // Set session
        req.session.userId = user.id;
        
        // Save session and return success
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Login failed" });
          }
          res.status(200).json({ 
            message: "Login successful",
            user: { 
              id: user.id, 
              email: user.email, 
              firstName: user.firstName, 
              lastName: user.lastName, 
              userType: user.userType 
            } 
          });
        });
      });
    } catch (error) {
      console.error("Customer login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => e.message).join(", ")
        });
      }
      res.status(400).json({ error: "Login failed" });
    }
  });

  // Restaurant signup route
  app.post("/api/signup/restaurant", async (req: any, res: any) => {
    try {
      const body = req.body;
      
      // Validate user data with zod
      const userSchema = z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
      });
      
      const userData = userSchema.parse({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
      });
      
      // Normalize email to lowercase to prevent case sensitivity issues
      userData.email = userData.email.toLowerCase();
      
      // Note: Email uniqueness will be enforced by database constraints
      
      // Validate restaurant data
      const restaurantData = publicInsertRestaurantSchema.parse(body.restaurant);
      
      // Clean up empty strings for optional fields
      const cleanRestaurantData = {
        ...restaurantData,
        description: restaurantData.description || null,
        phone: restaurantData.phone || "N/A", // Phone is required, provide default if empty
        email: restaurantData.email || null,
        website: restaurantData.website || null,
        imageUrl: restaurantData.imageUrl || null,
        latitude: restaurantData.latitude || null,
        longitude: restaurantData.longitude || null,
      };

      // Auto-geocode coordinates if not provided but address info exists
      if (!cleanRestaurantData.latitude || !cleanRestaurantData.longitude) {
        if (cleanRestaurantData.zipCode) {
          const coords = parseLocation(cleanRestaurantData.zipCode);
          if (coords) {
            cleanRestaurantData.latitude = coords.lat.toString();
            cleanRestaurantData.longitude = coords.lng.toString();
          }
        } else if (cleanRestaurantData.city && cleanRestaurantData.state) {
          const locationStr = `${cleanRestaurantData.city}, ${cleanRestaurantData.state}`;
          const coords = parseLocation(locationStr);
          if (coords) {
            cleanRestaurantData.latitude = coords.lat.toString();
            cleanRestaurantData.longitude = coords.lng.toString();
          }
        }
      }

      try {
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user first
        const user = await storage.upsertUser({
          ...userData,
          password: hashedPassword,
          userType: "restaurant" as const,
        });
        
        // Check if user already has a restaurant
        const existingRestaurant = await storage.getRestaurantByOwnerId(user.id);
        if (existingRestaurant) {
          return res.status(409).json({ 
            error: "Restaurant already exists", 
            details: "User already has a restaurant account" 
          });
        }
        
        // Create restaurant
        const restaurant = await storage.createRestaurant({
          ...cleanRestaurantData,
          ownerId: user.id,
        });
        
        // Regenerate session for immediate login to prevent session fixation
        req.session.regenerate((err: any) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ error: "Signup successful but login failed" });
          }
          
          // Set session
          req.session.userId = user.id;
          
          // Save session and return success
          req.session.save((saveErr: any) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ error: "Signup successful but login failed" });
            }
            res.status(201).json({ 
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.userType
              }, 
              restaurant,
              message: "Restaurant registered successfully" 
            });
          });
        });
      } catch (dbError: any) {
        // Check for email uniqueness constraint violation
        if (dbError.code === '23505' && dbError.constraint?.includes('email')) {
          return res.status(409).json({ 
            error: "Email already exists",
            details: "An account with this email address already exists"
          });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Restaurant signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => e.message).join(", ")
        });
      }
      res.status(400).json({ error: "Failed to register restaurant" });
    }
  });

  // Customer signup route
  app.post("/api/signup/customer", async (req: any, res: any) => {
    try {
      const body = req.body;
      
      // Validate customer data
      const customerData = customerSignupSchema.parse(body);
      
      // Normalize email to lowercase to prevent case sensitivity issues
      customerData.email = customerData.email.toLowerCase();
      
      try {
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(customerData.password, 12);
        
        // Create customer user
        const user = await storage.upsertUser({
          ...customerData,
          password: hashedPassword,
          userType: "customer" as const,
        });
        
        // Regenerate session for immediate login to prevent session fixation
        req.session.regenerate((err: any) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ error: "Signup successful but login failed" });
          }
          
          // Set session
          req.session.userId = user.id;
          
          // Save session and return success
          req.session.save((saveErr: any) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ error: "Signup successful but login failed" });
            }
            res.status(201).json({ 
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.userType
              }, 
              message: "Customer registered successfully" 
            });
          });
        });
      } catch (dbError: any) {
        // Check for email uniqueness constraint violation
        if (dbError.code === '23505' && dbError.constraint?.includes('email')) {
          return res.status(409).json({ 
            error: "Email already exists",
            details: "An account with this email address already exists"
          });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Customer signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => e.message).join(", ")
        });
      }
      res.status(400).json({ error: "Failed to register customer" });
    }
  });

  app.get("/api/logout", (req: any, res: any) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  // Authentication endpoint for frontend
  app.get("/api/auth/user", async (req: any, res: any) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(user);
  });

  // User profile endpoints
  app.get("/api/profile", requireAuth, async (req: any, res: any) => {
    res.json(req.user);
  });

  app.patch("/api/profile", requireAuth, async (req: any, res: any) => {
    try {
      const updates = updateUserProfileSchema.parse(req.body);
      const updatedUser = await storage.upsertUser({
        ...req.user,
        ...updates,
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  // Restaurant registration and management
  app.post("/api/restaurants", requireAuth, async (req: any, res: any) => {
    try {
      // Check if user already has a restaurant
      const existingRestaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (existingRestaurant) {
        return res.status(409).json({ error: "User already has a restaurant" });
      }

      const restaurantData = publicInsertRestaurantSchema.parse(req.body);
      
      // Automatically populate coordinates if missing
      let coordinates = null;
      if (!restaurantData.latitude || !restaurantData.longitude) {
        // Try to get coordinates from zip code first
        if (restaurantData.zipCode) {
          coordinates = parseLocation(restaurantData.zipCode);
        }
        // If no coordinates from zip code, try city, state
        if (!coordinates && restaurantData.city && restaurantData.state) {
          coordinates = parseLocation(`${restaurantData.city}, ${restaurantData.state}`);
        }
      }
      
      const restaurant = await storage.createRestaurant({
        ...restaurantData,
        ownerId: req.user.id,
        latitude: coordinates?.lat.toString() || restaurantData.latitude,
        longitude: coordinates?.lng.toString() || restaurantData.longitude,
      });
      
      // Update user type to restaurant owner
      await storage.upsertUser({
        ...req.user,
        userType: "restaurant",
      });
      
      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      res.status(400).json({ error: "Failed to create restaurant" });
    }
  });

  app.get("/api/restaurants/my", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurant" });
    }
  });

  app.patch("/api/restaurants/my", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const updates = publicUpdateRestaurantSchema.parse(req.body);
      
      // If location data is being updated and coordinates are missing, populate them
      let coordinates = null;
      const locationChanged = updates.zipCode || updates.city || updates.state;
      const coordinatesMissing = !updates.latitude || !updates.longitude;
      
      if (locationChanged && coordinatesMissing) {
        // Try to get coordinates from zip code first
        if (updates.zipCode) {
          coordinates = parseLocation(updates.zipCode);
        }
        // If no coordinates from zip code, try city, state
        if (!coordinates && updates.city && updates.state) {
          coordinates = parseLocation(`${updates.city}, ${updates.state}`);
        }
        // Fallback to existing restaurant city/state if only partial update
        if (!coordinates && (updates.city || updates.state)) {
          const city = updates.city || restaurant.city;
          const state = updates.state || restaurant.state;
          if (city && state) {
            coordinates = parseLocation(`${city}, ${state}`);
          }
        }
      }
      
      const finalUpdates = {
        ...updates,
        ...(coordinates && {
          latitude: coordinates.lat.toString(),
          longitude: coordinates.lng.toString(),
        })
      };
      
      const updatedRestaurant = await storage.updateRestaurant(restaurant.id, finalUpdates);
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Failed to update restaurant:", error);
      res.status(400).json({ error: "Failed to update restaurant" });
    }
  });

  app.get("/api/restaurants/:id", async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      // Return public view without sensitive fields
      const publicRestaurant = publicRestaurantSchema.parse(restaurant);
      res.json(publicRestaurant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurant" });
    }
  });

  app.get("/api/restaurants", async (req: any, res: any) => {
    try {
      const { q, cuisineTypes, lat, lng, radius = 10, location, limit = 50, offset = 0 } = req.query;
      
      let restaurants: Restaurant[];
      
      if (lat && lng && radius) {
        restaurants = await storage.getRestaurantsNearLocation(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else if (location || q) {
        const filters: any = {};
        if (cuisineTypes) filters.cuisineTypes = (cuisineTypes as string).split(',');
        
        // Handle location-based search
        if (location) {
          const coordinates = parseLocation(location as string);
          if (coordinates) {
            restaurants = await storage.getRestaurantsNearLocation(
              coordinates.lat,
              coordinates.lng,
              parseFloat(radius as string)
            );
          } else {
            // Invalid location provided
            return res.status(400).json({ 
              error: "Invalid location", 
              details: `Location "${location}" not recognized. Please try a valid US zip code (e.g., 75035) or city, state (e.g., Dallas, TX)` 
            });
          }
        } else {
          // Search by query only
          const cuisines = cuisineTypes ? (cuisineTypes as string).split(',') : undefined;
          restaurants = await storage.searchRestaurants(q as string, cuisines);
        }
      } else {
        // Default: return all restaurants
        restaurants = await storage.searchRestaurants("", []);
      }
      
      // Return public view without sensitive fields
      const publicRestaurants = restaurants.map(r => publicRestaurantSchema.parse(r));
      res.json(publicRestaurants);
    } catch (error) {
      console.error("Restaurants API error:", error);
      res.status(500).json({ error: "Failed to search restaurants" });
    }
  });

  // Deal management endpoints
  app.post("/api/deals", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const dealData = insertDealSchema.parse(req.body);
      
      const deal = await storage.createDeal({
        ...dealData,
        restaurantId: restaurant.id,
      });
      
      res.status(201).json(deal);
    } catch (error) {
      res.status(400).json({ error: "Failed to create deal" });
    }
  });

  app.get("/api/deals/my", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const deals = await storage.getRestaurantDeals(restaurant.id);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.patch("/api/deals/:id", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const deal = await storage.getDeal(req.params.id);
      if (!deal || deal.restaurantId !== restaurant.id) {
        return res.status(404).json({ error: "Deal not found" });
      }

      const updates = publicUpdateDealSchema.parse(req.body);
      const updatedDeal = await storage.updateDeal(deal.id, updates);
      res.json(updatedDeal);
    } catch (error) {
      res.status(400).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const deal = await storage.getDeal(req.params.id);
      if (!deal || deal.restaurantId !== restaurant.id) {
        return res.status(404).json({ error: "Deal not found" });
      }

      await storage.deleteDeal(deal.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  app.get("/api/deals", async (req: any, res: any) => {
    try {
      const { q, maxPrice, cuisineTypes, location, radius = 10, limit = 50, offset = 0 } = req.query;
      
      let deals: Deal[];
      
      if (q || location) {
        const filters: any = {};
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
        if (cuisineTypes) filters.cuisineTypes = (cuisineTypes as string).split(',');
        
        // Handle location-based search
        if (location) {
          const coordinates = parseLocation(location as string);
          if (coordinates) {
            filters.location = {
              lat: coordinates.lat,
              lng: coordinates.lng,
              radius: parseFloat(radius as string)
            };
          } else {
            // Invalid location provided
            return res.status(400).json({ 
              error: "Invalid location", 
              details: `Location "${location}" not recognized. Please try a valid US zip code (e.g., 75035) or city, state (e.g., Dallas, TX)` 
            });
          }
        }
        
        deals = await storage.searchDeals(q as string || "", filters);
      } else {
        deals = await storage.getActiveDeals(
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }
      
      res.json(deals);
    } catch (error) {
      console.error("Deals API error:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req: any, res: any) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      // Increment view count
      await storage.incrementDealView(deal.id);
      
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  app.post("/api/deals/:id/click", async (req: any, res: any) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      await storage.incrementDealClick(deal.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Favorites endpoints
  app.post("/api/favorites", requireAuth, async (req: any, res: any) => {
    try {
      const favoriteData = insertFavoriteSchema.parse(req.body);
      
      // Check if already favorited
      const isFav = await storage.isFavorite(
        req.user.id,
        favoriteData.type,
        favoriteData.restaurantId || favoriteData.dealId!
      );
      
      if (isFav) {
        return res.status(409).json({ error: "Already favorited" });
      }

      try {
        const favorite = await storage.addFavorite({
          ...favoriteData,
          userId: req.user.id,
        });
        res.status(201).json(favorite);
      } catch (error: any) {
        if (error.message === 'DUPLICATE_FAVORITE') {
          return res.status(409).json({ error: "Already favorited" });
        }
        throw error;
      }
    } catch (error) {
      res.status(400).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:type/:id", requireAuth, async (req: any, res: any) => {
    try {
      await storage.removeFavorite(req.user.id, req.params.type, req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites", requireAuth, async (req: any, res: any) => {
    try {
      const { type } = req.query;
      const favorites = await storage.getUserFavorites(req.user.id, type as string);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  // Analytics endpoints for restaurant owners
  app.get("/api/analytics/restaurant", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const analytics = await storage.getRestaurantAnalytics(restaurant.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/deals/:id", requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const deal = await storage.getDeal(req.params.id);
      if (!deal || deal.restaurantId !== restaurant.id) {
        return res.status(404).json({ error: "Deal not found" });
      }

      const { days = 30 } = req.query;
      const analytics = await storage.getDealAnalytics(deal.id, parseInt(days as string));
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deal analytics" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment processing is currently unavailable' });
      }

      const { planId } = req.body;
      
      // Validate planId with Zod
      const planSchema = z.object({
        planId: z.enum(['basic', 'professional', 'enterprise'])
      });
      
      const validation = planSchema.safeParse({ planId });
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }
      
      const validPlans = {
        'basic': { name: 'Basic Plan', amount: 2900 },
        'professional': { name: 'Professional Plan', amount: 5900 },
        'enterprise': { name: 'Enterprise Plan', amount: 9900 }
      };
      
      const user = req.user;
      let customerId = user.stripeCustomerId;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
            userType: 'restaurant'
          }
        });
        
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, { customerId });
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product: `Restaurant ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            unit_amount: validPlans[planId as keyof typeof validPlans].amount,
            recurring: {
              interval: 'month',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planId: planId
        }
      });
      
      // Update user with subscription info
      await storage.updateUserStripeInfo(user.id, { 
        customerId, 
        subscriptionId: subscription.id 
      });
      
      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret;
      
      if (!clientSecret) {
        return res.status(500).json({ error: 'Failed to initialize payment' });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
        planId
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  app.get('/api/subscription/status', requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment processing is currently unavailable' });
      }

      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.json({ status: 'none', plan: null });
      }
      
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        status: subscription.status,
        plan: subscription.metadata?.planId || 'basic',
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Update subscription plan
  app.post('/api/subscription/update', requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment processing is currently unavailable' });
      }

      const { planId } = req.body;
      
      // Validate planId with Zod
      const planSchema = z.object({
        planId: z.enum(['basic', 'professional', 'enterprise'])
      });
      
      const validation = planSchema.safeParse({ planId });
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No existing subscription found' });
      }

      const validPlans = {
        'basic': { name: 'Basic Plan', amount: 2900 },
        'professional': { name: 'Professional Plan', amount: 5900 },
        'enterprise': { name: 'Enterprise Plan', amount: 9900 }
      };

      // For this demo, we'll create a new subscription instead of updating
      // In production, you'd want to use proper Price IDs and subscription modification
      
      // Retrieve current subscription to cancel it
      const currentSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Cancel current subscription at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Create new subscription with new plan
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      
      const newSubscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{
          price_data: {
            currency: 'usd',
            product: `restaurant-${planId}-plan`,
            unit_amount: validPlans[planId as keyof typeof validPlans].amount,
            recurring: {
              interval: 'month',
            },
          },
        }],
        metadata: {
          planId: planId
        }
      });

      // Update user with new subscription ID
      await storage.updateUserStripeInfo(user.id, { 
        customerId: user.stripeCustomerId, 
        subscriptionId: newSubscription.id 
      });

      const updatedSubscription = newSubscription;

      res.json({
        success: true,
        subscriptionId: updatedSubscription.id,
        planId,
        status: updatedSubscription.status
      });
    } catch (error: any) {
      console.error('Subscription update error:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', requireAuth, requireRestaurantOwner, async (req: any, res: any) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment processing is currently unavailable' });
      }

      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No subscription found' });
      }

      // Cancel at period end to let user finish their billing cycle
      const cancelledSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({
        success: true,
        message: 'Subscription will be cancelled at the end of your billing period',
        cancelAtPeriodEnd: (cancelledSubscription as any).cancel_at_period_end,
        currentPeriodEnd: (cancelledSubscription as any).current_period_end
      });
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
