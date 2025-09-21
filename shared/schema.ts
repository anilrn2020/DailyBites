import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").notNull().default("customer"), // "customer" or "restaurant"
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant profiles
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  imageUrl: varchar("image_url"),
  cuisineTypes: text("cuisine_types").array(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  subscriptionPlan: varchar("subscription_plan").default("basic"), // "basic", "professional", "enterprise"
  subscriptionStatus: varchar("subscription_status").default("trial"), // "trial", "active", "cancelled", "expired"
  dealLimit: integer("deal_limit").default(5),
  dealsUsedThisMonth: integer("deals_used_this_month").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_restaurants_city").on(table.city),
  index("idx_restaurants_zip_code").on(table.zipCode),
]);

// Deals/specials posted by restaurants
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  dealPrice: decimal("deal_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").default(true),
  maxRedemptions: integer("max_redemptions"),
  currentRedemptions: integer("current_redemptions").default(0),
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
  category: varchar("category"), // e.g., "appetizer", "entree", "dessert", "combo"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_deals_restaurant_id").on(table.restaurantId),
  index("idx_deals_active_end_time").on(table.isActive, table.endTime),
]);

// Customer favorites for restaurants and deals
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }),
  dealId: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // "restaurant" or "deal"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_favorites_user_id").on(table.userId),
  // Unique constraints to prevent duplicate favorites
  uniqueIndex("unique_user_restaurant").on(table.userId, table.restaurantId).where(sql`${table.type} = 'restaurant' AND ${table.restaurantId} IS NOT NULL`),
  uniqueIndex("unique_user_deal").on(table.userId, table.dealId).where(sql`${table.type} = 'deal' AND ${table.dealId} IS NOT NULL`),
]);

// Analytics tracking for deals
export const dealAnalytics = pgTable("deal_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
}, (table) => [
  index("idx_deal_analytics_deal_date").on(table.dealId, table.date),
]);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
  favorites: many(favorites),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  deals: many(deals),
  favorites: many(favorites),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [deals.restaurantId],
    references: [restaurants.id],
  }),
  favorites: many(favorites),
  analytics: many(dealAnalytics),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [favorites.restaurantId],
    references: [restaurants.id],
  }),
  deal: one(deals, {
    fields: [favorites.dealId],
    references: [deals.id],
  }),
}));

export const dealAnalyticsRelations = relations(dealAnalytics, ({ one }) => ({
  deal: one(deals, {
    fields: [dealAnalytics.dealId],
    references: [deals.id],
  }),
}));

// Zod schemas for API validation
export const upsertUserSchema = createInsertSchema(users);
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  restaurantId: true,
  endTime: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  clickCount: true,
  currentRedemptions: true,
}).extend({
  duration: z.number().min(1).max(168), // hours, max 1 week
});
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  userId: true,
  createdAt: true,
}).refine(
  (data) => (data.restaurantId && !data.dealId) || (!data.restaurantId && data.dealId),
  {
    message: "Must provide either restaurantId or dealId, but not both",
  }
);

// Public schemas for restaurant owners (exclude server-controlled fields)
export const publicInsertRestaurantSchema = insertRestaurantSchema.omit({
  subscriptionPlan: true,
  subscriptionStatus: true,
  dealLimit: true,
  dealsUsedThisMonth: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
});

export const publicUpdateRestaurantSchema = publicInsertRestaurantSchema.partial();

// Public deal update schema (exclude counters and computed fields)
export const publicUpdateDealSchema = insertDealSchema.partial().omit({
  duration: true, // duration is only for creation
});

export const updateUserProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
});

// Customer signup schema
export const customerSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Public restaurant response (hide internal fields)
export const publicRestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  imageUrl: z.string().nullable(),
  cuisineTypes: z.array(z.string()).nullable(),
  rating: z.string(),
  reviewCount: z.number(),
  isVerified: z.boolean(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

// Export types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type PublicInsertRestaurant = z.infer<typeof publicInsertRestaurantSchema>;
export type PublicUpdateRestaurant = z.infer<typeof publicUpdateRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type PublicRestaurant = z.infer<typeof publicRestaurantSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type PublicUpdateDeal = z.infer<typeof publicUpdateDealSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type DealAnalytic = typeof dealAnalytics.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type CustomerSignup = z.infer<typeof customerSignupSchema>;
