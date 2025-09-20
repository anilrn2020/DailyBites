import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  insertRestaurantSchema,
  insertDealSchema,
  insertFavoriteSchema,
  updateRestaurantSchema,
  updateDealSchema,
  updateUserProfileSchema,
  type User,
  type Restaurant,
  type Deal,
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

      const restaurantData = insertRestaurantSchema.parse(req.body);
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

      const updates = updateRestaurantSchema.parse(req.body);
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
      res.json(restaurant);
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
      
      res.json(restaurants);
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

      // Check deal limits based on subscription
      const dealsUsed = restaurant.dealsUsedThisMonth || 0;
      const dealLimit = restaurant.dealLimit || 5;
      if (dealsUsed >= dealLimit) {
        return res.status(403).json({ 
          error: "Deal limit reached. Upgrade your subscription to post more deals." 
        });
      }

      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal({
        ...dealData,
        restaurantId: restaurant.id,
      });

      // Increment deals used counter
      await storage.updateRestaurant(restaurant.id, {
        dealsUsedThisMonth: (restaurant.dealsUsedThisMonth || 0) + 1,
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

      const updates = updateDealSchema.parse(req.body);
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

      const favorite = await storage.addFavorite({
        ...favoriteData,
        userId: req.user.id,
      });
      
      res.status(201).json(favorite);
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
