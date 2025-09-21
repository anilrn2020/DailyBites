import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  insertRestaurantSchema,
  insertDealSchema,
  insertFavoriteSchema,
  publicInsertRestaurantSchema,
  publicUpdateRestaurantSchema,
  publicUpdateDealSchema,
  updateUserProfileSchema,
  publicRestaurantSchema,
  type User,
  type Restaurant,
  type Deal,
  type PublicRestaurant,
} from "@shared/schema";
import { storage } from "./storage";

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
  app.get("/api/login", async (req: any, res: any) => {
    try {
      // For development, simulate authentication by creating a test user session
      const testUserId = "test-user-1";
      
      // Create/upsert user first
      await storage.upsertUser({
        id: testUserId,
        email: "restaurant@test.com",
        firstName: "Restaurant",
        lastName: "Owner",
        userType: "restaurant",
      });
      
      // Set session
      req.session.userId = testUserId;
      
      // Save session explicitly before redirect
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
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
      const restaurant = await storage.createRestaurant({
        ...restaurantData,
        ownerId: req.user.id,
      });
      
      // Update user type to restaurant owner
      await storage.upsertUser({
        ...req.user,
        userType: "restaurant",
      });
      
      res.status(201).json(restaurant);
    } catch (error) {
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
      const updatedRestaurant = await storage.updateRestaurant(restaurant.id, updates);
      res.json(updatedRestaurant);
    } catch (error) {
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
      const { q, cuisineTypes, lat, lng, radius } = req.query;
      
      let restaurants: Restaurant[];
      
      if (lat && lng && radius) {
        restaurants = await storage.getRestaurantsNearLocation(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else if (q) {
        const cuisines = cuisineTypes ? (cuisineTypes as string).split(',') : undefined;
        restaurants = await storage.searchRestaurants(q as string, cuisines);
      } else {
        // Default: return some restaurants (in production, you'd want pagination)
        restaurants = await storage.searchRestaurants("", []);
      }
      
      // Return public view without sensitive fields
      const publicRestaurants = restaurants.map(r => publicRestaurantSchema.parse(r));
      res.json(publicRestaurants);
    } catch (error) {
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
      const { q, maxPrice, cuisineTypes, limit = 50, offset = 0 } = req.query;
      
      let deals: Deal[];
      
      if (q) {
        const filters: any = {};
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
        if (cuisineTypes) filters.cuisineTypes = (cuisineTypes as string).split(',');
        
        deals = await storage.searchDeals(q as string, filters);
      } else {
        deals = await storage.getActiveDeals(
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }
      
      res.json(deals);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
