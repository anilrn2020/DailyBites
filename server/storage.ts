import {
  users,
  restaurants,
  deals,
  favorites,
  dealAnalytics,
  type User,
  type UpsertUser,
  type Restaurant,
  type InsertRestaurant,
  type Deal,
  type InsertDeal,
  type Favorite,
  type InsertFavorite,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Restaurant operations
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant>;
  getRestaurantsNearLocation(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]>;
  searchRestaurants(query: string, cuisineTypes?: string[]): Promise<Restaurant[]>;
  
  // Deal operations
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  getDeal(id: string): Promise<Deal | undefined>;
  getRestaurantDeals(restaurantId: string): Promise<Deal[]>;
  getActiveDeals(limit?: number, offset?: number): Promise<Deal[]>;
  searchDeals(query: string, filters?: {
    cuisineTypes?: string[];
    maxPrice?: number;
    location?: { lat: number; lng: number; radius: number };
  }): Promise<Deal[]>;
  incrementDealView(dealId: string): Promise<void>;
  incrementDealClick(dealId: string): Promise<void>;
  
  // Favorites operations
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, type: string, itemId: string): Promise<void>;
  getUserFavorites(userId: string, type?: string): Promise<Favorite[]>;
  isFavorite(userId: string, type: string, itemId: string): Promise<boolean>;
  
  // Analytics operations
  getDealAnalytics(dealId: string, days?: number): Promise<any[]>;
  getRestaurantAnalytics(restaurantId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Restaurant operations
  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId));
    return restaurant;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant> {
    const [updated] = await db
      .update(restaurants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    return updated;
  }

  async getRestaurantsNearLocation(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]> {
    // Simplified distance calculation - in production, use PostGIS
    const results = await db
      .select()
      .from(restaurants)
      .where(
        and(
          gte(restaurants.latitude, (lat - radiusMiles * 0.0145).toString()),
          lte(restaurants.latitude, (lat + radiusMiles * 0.0145).toString()),
          gte(restaurants.longitude, (lng - radiusMiles * 0.0145).toString()),
          lte(restaurants.longitude, (lng + radiusMiles * 0.0145).toString())
        )
      )
      .orderBy(asc(restaurants.name));
    return results;
  }

  async searchRestaurants(query: string, cuisineTypes?: string[]): Promise<Restaurant[]> {
    let whereCondition = or(
      ilike(restaurants.name, `%${query}%`),
      ilike(restaurants.description, `%${query}%`)
    );

    if (cuisineTypes && cuisineTypes.length > 0) {
      // This is a simplified cuisine search - in production, use array operators
      const cuisineConditions = cuisineTypes.map(cuisine => 
        sql`${restaurants.cuisineTypes} @> ARRAY[${cuisine}]`
      );
      whereCondition = and(whereCondition, or(...cuisineConditions));
    }

    return await db
      .select()
      .from(restaurants)
      .where(whereCondition)
      .orderBy(desc(restaurants.rating));
  }

  // Deal operations
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const { duration, ...dealData } = deal;
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + duration);

    const [newDeal] = await db
      .insert(deals)
      .values({
        ...dealData,
        endTime,
      })
      .returning();
    return newDeal;
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await db
      .update(deals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getRestaurantDeals(restaurantId: string): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId))
      .orderBy(desc(deals.createdAt));
  }

  async getActiveDeals(limit: number = 50, offset: number = 0): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          gte(deals.endTime, new Date())
        )
      )
      .orderBy(asc(deals.endTime))
      .limit(limit)
      .offset(offset);
  }

  async searchDeals(query: string, filters?: {
    cuisineTypes?: string[];
    maxPrice?: number;
    location?: { lat: number; lng: number; radius: number };
  }): Promise<Deal[]> {
    let queryBuilder = db
      .select({
        deal: deals,
        restaurant: restaurants,
      })
      .from(deals)
      .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .where(
        and(
          eq(deals.isActive, true),
          gte(deals.endTime, new Date()),
          or(
            ilike(deals.title, `%${query}%`),
            ilike(deals.description, `%${query}%`),
            ilike(restaurants.name, `%${query}%`)
          )
        )
      );

    // Add filters if provided (note: this is a simplified implementation)
    // In production, you'd want to properly handle additional where conditions

    const results = await queryBuilder.orderBy(asc(deals.endTime));
    return results.map(r => r.deal);
  }

  async incrementDealView(dealId: string): Promise<void> {
    await db
      .update(deals)
      .set({ viewCount: sql`${deals.viewCount} + 1` })
      .where(eq(deals.id, dealId));
  }

  async incrementDealClick(dealId: string): Promise<void> {
    await db
      .update(deals)
      .set({ clickCount: sql`${deals.clickCount} + 1` })
      .where(eq(deals.id, dealId));
  }

  // Favorites operations
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db
      .insert(favorites)
      .values(favorite)
      .returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, type: string, itemId: string): Promise<void> {
    const condition = type === "restaurant" 
      ? and(eq(favorites.userId, userId), eq(favorites.restaurantId, itemId))
      : and(eq(favorites.userId, userId), eq(favorites.dealId, itemId));
    
    await db.delete(favorites).where(condition);
  }

  async getUserFavorites(userId: string, type?: string): Promise<Favorite[]> {
    let whereCondition: any = eq(favorites.userId, userId);
    if (type) {
      whereCondition = and(whereCondition, eq(favorites.type, type));
    }

    return await db
      .select()
      .from(favorites)
      .where(whereCondition)
      .orderBy(desc(favorites.createdAt));
  }

  async isFavorite(userId: string, type: string, itemId: string): Promise<boolean> {
    const condition = type === "restaurant" 
      ? and(eq(favorites.userId, userId), eq(favorites.restaurantId, itemId))
      : and(eq(favorites.userId, userId), eq(favorites.dealId, itemId));
    
    const [result] = await db.select().from(favorites).where(condition);
    return !!result;
  }

  // Analytics operations
  async getDealAnalytics(dealId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db
      .select()
      .from(dealAnalytics)
      .where(
        and(
          eq(dealAnalytics.dealId, dealId),
          gte(dealAnalytics.date, startDate)
        )
      )
      .orderBy(asc(dealAnalytics.date));
  }

  async getRestaurantAnalytics(restaurantId: string): Promise<any> {
    const [result] = await db
      .select({
        totalDeals: sql<number>`count(${deals.id})`,
        activeDeals: sql<number>`count(case when ${deals.isActive} = true and ${deals.endTime} > now() then 1 end)`,
        totalViews: sql<number>`sum(${deals.viewCount})`,
        totalClicks: sql<number>`sum(${deals.clickCount})`,
      })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));

    return result;
  }
}

export const storage = new DatabaseStorage();
