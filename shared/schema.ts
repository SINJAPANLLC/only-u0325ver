import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "creator", "admin"]);
export const contentTypeEnum = pgEnum("content_type", ["free", "premium"]);
export const liveStatusEnum = pgEnum("live_status", ["live", "ended", "scheduled"]);
export const productTypeEnum = pgEnum("product_type", ["digital", "physical"]);
export const messageStatusEnum = pgEnum("message_status", ["sent", "delivered", "read"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);

// User profiles (editable by users)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  username: varchar("username"),
  displayName: varchar("display_name"),
  avatarUrl: varchar("avatar_url"),
  bio: text("bio"),
  location: varchar("location"),
  birthdate: timestamp("birthdate"),
  phoneNumber: varchar("phone_number"),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application step enum
export const applicationStepEnum = pgEnum("application_step", [
  "personal_info",
  "phone_verification", 
  "document_submission",
  "under_review",
  "completed"
]);

// Creator applications (for users wanting to become creators)
export const creatorApplications = pgTable("creator_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  status: applicationStatusEnum("status").default("pending"),
  currentStep: applicationStepEnum("current_step").default("personal_info"),
  
  // Personal info (Step 1)
  fullName: varchar("full_name"),
  birthDate: varchar("birth_date"),
  gender: varchar("gender"),
  postalCode: varchar("postal_code"),
  prefecture: varchar("prefecture"),
  city: varchar("city"),
  address: varchar("address"),
  building: varchar("building"),
  
  // Contact info (Step 2)
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  contactInfoSavedAt: timestamp("contact_info_saved_at"),
  
  // Document submission (Step 3) - eKYC
  idDocumentType: varchar("id_document_type"),
  idDocumentFrontUrl: varchar("id_document_front_url"),
  idDocumentBackUrl: varchar("id_document_back_url"),
  selfieUrl: varchar("selfie_url"),
  documentsSubmittedAt: timestamp("documents_submitted_at"),
  
  // Legacy fields (kept for compatibility)
  portfolioUrl: varchar("portfolio_url"),
  experience: text("experience"),
  reason: text("reason"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerId: varchar("reviewer_id"),
});

// Creator profiles
export const creatorProfiles = pgTable("creator_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  displayName: varchar("display_name").notNull(),
  bio: text("bio"),
  externalLink: varchar("external_link"),
  coverImageUrl: varchar("cover_image_url"),
  isVerified: boolean("is_verified").default(false),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  postCount: integer("post_count").default(0),
  totalEarnings: integer("total_earnings").default(0).notNull(),
  availableBalance: integer("available_balance").default(0).notNull(),
  pendingBalance: integer("pending_balance").default(0).notNull(),
  bankName: varchar("bank_name"),
  bankBranchName: varchar("bank_branch_name"),
  bankAccountType: varchar("bank_account_type"),
  bankAccountNumber: varchar("bank_account_number"),
  bankAccountHolder: varchar("bank_account_holder"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawal request status
export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "processing",
  "completed",
  "rejected",
]);

// Withdrawal requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  amount: integer("amount").notNull(),
  fee: integer("fee").default(0).notNull(),
  netAmount: integer("net_amount").notNull(),
  status: withdrawalStatusEnum("status").default("pending"),
  isEarly: boolean("is_early").default(false),
  bankName: varchar("bank_name").notNull(),
  bankBranchName: varchar("bank_branch_name").notNull(),
  bankAccountType: varchar("bank_account_type").notNull(),
  bankAccountNumber: varchar("bank_account_number").notNull(),
  bankAccountHolder: varchar("bank_account_holder").notNull(),
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Videos
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  duration: integer("duration").default(0),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  contentType: contentTypeEnum("content_type").default("free"),
  requiredTier: integer("required_tier").default(0), // 0=無料, 1以上=そのtier以上の購読が必要
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  likeCount: true,
  createdAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Live streams
export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  streamKey: varchar("stream_key"),
  status: liveStatusEnum("status").default("scheduled"),
  viewerCount: integer("viewer_count").default(0),
  partyRatePerMinute: integer("party_rate_per_minute").default(50),
  twoshotRatePerMinute: integer("twoshot_rate_per_minute").default(100),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  lastHeartbeat: timestamp("last_heartbeat"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live viewing mode enum
export const viewingModeEnum = pgEnum("viewing_mode", ["waiting", "party", "twoshot"]);

// Live viewing sessions (tracks when users join party/2shot modes)
export const liveViewingSessions = pgTable("live_viewing_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveStreamId: varchar("live_stream_id").notNull(),
  userId: varchar("user_id").notNull(),
  mode: viewingModeEnum("mode").notNull(),
  ratePerMinute: integer("rate_per_minute").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  totalMinutes: integer("total_minutes").default(0),
  totalPointsCharged: integer("total_points_charged").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertLiveViewingSessionSchema = createInsertSchema(liveViewingSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  totalMinutes: true,
  totalPointsCharged: true,
  isActive: true,
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: varchar("image_url"),
  contentUrl: varchar("content_url"), // For digital products: download link or content URL
  productType: productTypeEnum("product_type").default("digital"),
  stock: integer("stock").default(0),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages / Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull(),
  participant2Id: varchar("participant2_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").default("sent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  body: text("body"),
  type: varchar("type").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull(),
  followingId: varchar("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription Plans (クリエイターが設定するプラン)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // 月額ポイント
  tier: integer("tier").notNull().default(1), // 1=Basic, 2=Standard, 3=Premium など
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Subscriptions (ユーザーの購読)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  planId: varchar("plan_id"), // subscription_plans.id への参照
  planType: varchar("plan_type").notNull(),
  tier: integer("tier").default(1), // 購読しているプランのtier
  status: varchar("status").default("active"),
  autoRenew: boolean("auto_renew").default(true), // 自動更新フラグ
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Point transaction types
export const pointTransactionTypeEnum = pgEnum("point_transaction_type", [
  "purchase_card",    // カード決済で購入
  "purchase_bank",    // 銀行振込で購入
  "spend",            // ポイント消費
  "refund",           // 返金
  "bonus",            // ボーナス付与
  "admin_adjust",     // 管理者調整
  "premium_plan",     // 高画質プラン加入
]);

// Bank transfer status
export const bankTransferStatusEnum = pgEnum("bank_transfer_status", [
  "pending",          // 入金待ち
  "confirmed",        // 入金確認済み
  "cancelled",        // キャンセル
  "expired",          // 期限切れ
]);

// Point transactions (履歴)
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: pointTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),  // 正=増加, 負=減少
  balance: integer("balance").notNull(), // 取引後の残高
  description: text("description"),
  referenceId: varchar("reference_id"), // 関連する注文/決済ID
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank transfer requests (銀行振込申請)
export const bankTransferRequests = pgTable("bank_transfer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  points: integer("points").notNull(),        // 購入ポイント数
  amount: integer("amount").notNull(),        // 振込金額（税込）
  amountExcludingTax: integer("amount_excluding_tax").notNull(), // 税抜金額
  taxAmount: integer("tax_amount").notNull(), // 消費税額
  status: bankTransferStatusEnum("status").default("pending"),
  bankName: varchar("bank_name"),             // 振込先銀行名
  branchName: varchar("branch_name"),         // 支店名
  accountType: varchar("account_type"),       // 口座種別
  accountNumber: varchar("account_number"),   // 口座番号
  accountName: varchar("account_name"),       // 口座名義
  transferDeadline: timestamp("transfer_deadline"), // 振込期限
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: varchar("confirmed_by"),       // 確認した管理者
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Point packages (購入パッケージ)
export const pointPackages = pgTable("point_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  points: integer("points").notNull(),        // ポイント数
  priceExcludingTax: integer("price_excluding_tax").notNull(), // 税抜価格
  taxAmount: integer("tax_amount").notNull(), // 消費税額
  priceIncludingTax: integer("price_including_tax").notNull(), // 税込価格
  bonusPoints: integer("bonus_points").default(0), // ボーナスポイント
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product purchases
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id").notNull(),
  creatorId: varchar("creator_id"),
  price: integer("price").notNull(),
  status: varchar("status").default("completed"),
  // Shipping info for physical products
  shippingName: varchar("shipping_name"),
  shippingPostalCode: varchar("shipping_postal_code"),
  shippingAddress: text("shipping_address"),
  shippingPhone: varchar("shipping_phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreatorApplicationSchema = createInsertSchema(creatorApplications).omit({ id: true, submittedAt: true, reviewedAt: true, reviewerId: true, status: true });
export const insertCreatorProfileSchema = createInsertSchema(creatorProfiles).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Video likes
export const videoLikes = pgTable("video_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  videoId: varchar("video_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVideoLikeSchema = createInsertSchema(videoLikes).omit({
  id: true,
  createdAt: true,
});

export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertVideoLike = z.infer<typeof insertVideoLikeSchema>;

// Premium plan subscriptions (高画質プラン)
export const premiumPlans = pgTable("premium_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  price: integer("price").default(980).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPremiumPlanSchema = createInsertSchema(premiumPlans).omit({
  id: true,
  createdAt: true,
});
export type InsertPremiumPlan = z.infer<typeof insertPremiumPlanSchema>;
export type PremiumPlan = typeof premiumPlans.$inferSelect;

// Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type CreatorApplication = typeof creatorApplications.$inferSelect;
export type InsertCreatorApplication = z.infer<typeof insertCreatorApplicationSchema>;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = z.infer<typeof insertCreatorProfileSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Follow = typeof follows.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type BankTransferRequest = typeof bankTransferRequests.$inferSelect;
export type PointPackage = typeof pointPackages.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  status: true,
  adminNotes: true,
  processedAt: true,
  createdAt: true,
});
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

// Admin users table for separate admin authentication
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  name: varchar("name"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
