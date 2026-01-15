import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./emailAuth";
import { db } from "./db";
import { 
  videos, liveStreams, products, conversations, messages, 
  notifications, creatorProfiles, follows, subscriptions,
  userProfiles, creatorApplications, phoneVerificationCodes,
  bankTransferRequests, pointPackages, pointTransactions, purchases,
  insertVideoSchema, insertProductSchema, insertLiveStreamSchema,
  insertUserProfileSchema, insertCreatorApplicationSchema, insertMessageSchema
} from "@shared/schema";
import { eq, desc, and, or, sql, gt, isNull } from "drizzle-orm";
import { generateImage } from "./modelslab";

// Admin check middleware
function isAdmin(req: any, res: any, next: any) {
  // Check for admin email or role
  const email = req.user?.claims?.email || req.user?.email || "";
  const adminEmails = ["info@only-u.fun"];
  if (adminEmails.includes(email) || email.includes("admin") || req.user?.claims?.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
}

// Creator check middleware - only approved creators can use creator features
async function isCreator(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const [creatorProfile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId));

    if (!creatorProfile) {
      return res.status(403).json({ message: "クリエイター登録が必要です。アカウントページからクリエイター申請を行ってください。" });
    }

    req.creatorProfile = creatorProfile;
    next();
  } catch (error) {
    console.error("Error checking creator status:", error);
    res.status(500).json({ message: "認証エラーが発生しました" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerEmailAuthRoutes(app);

  // Search API - search creators and videos
  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").trim().toLowerCase();
      if (!query) {
        return res.json({ creators: [], videos: [] });
      }

      // Search creators by display name
      const matchingCreators = await db
        .select()
        .from(creatorProfiles)
        .where(sql`LOWER(${creatorProfiles.displayName}) LIKE ${'%' + query + '%'}`)
        .limit(10);

      // Search videos by title
      const matchingVideos = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.isPublished, true),
          sql`LOWER(${videos.title}) LIKE ${'%' + query + '%'}`
        ))
        .orderBy(desc(videos.createdAt))
        .limit(10);

      res.json({ creators: matchingCreators, videos: matchingVideos });
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "検索に失敗しました" });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const allVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.isPublished, true))
        .orderBy(desc(videos.createdAt))
        .limit(20);
      res.json(allVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [video] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, id));
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Get current user's own videos
  app.get("/api/my-videos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const myVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.creatorId, userId))
        .orderBy(desc(videos.createdAt));
      res.json(myVideos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", isAuthenticated, isCreator, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertVideoSchema.safeParse({ ...req.body, creatorId: userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid video data", errors: validation.error.flatten() });
      }

      const [video] = await db.insert(videos).values(validation.data).returning();
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.get("/api/live", async (req, res) => {
    try {
      const { status } = req.query;
      let query = db
        .select()
        .from(liveStreams)
        .orderBy(desc(liveStreams.createdAt))
        .limit(20);
      
      const streams = await query;
      
      if (status === "live") {
        const liveOnly = streams.filter(s => s.status === "live");
        return res.json(liveOnly);
      }
      
      res.json(streams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.get("/api/live/active", async (req, res) => {
    try {
      const activeStreams = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.status, "live"))
        .orderBy(desc(liveStreams.viewerCount))
        .limit(20);
      res.json(activeStreams);
    } catch (error) {
      console.error("Error fetching active streams:", error);
      res.status(500).json({ message: "Failed to fetch active streams" });
    }
  });

  app.get("/api/my-live", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const myStreams = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.creatorId, userId))
        .orderBy(desc(liveStreams.createdAt));
      res.json(myStreams);
    } catch (error) {
      console.error("Error fetching user live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.post("/api/live", isAuthenticated, isCreator, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertLiveStreamSchema.safeParse({ ...req.body, creatorId: userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid stream data", errors: validation.error.flatten() });
      }

      const [stream] = await db.insert(liveStreams).values(validation.data).returning();
      res.status(201).json(stream);
    } catch (error) {
      console.error("Error creating live stream:", error);
      res.status(500).json({ message: "Failed to create live stream" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { type } = req.query;
      let query = db
        .select()
        .from(products)
        .where(eq(products.isAvailable, true))
        .orderBy(desc(products.createdAt))
        .limit(20);

      const allProducts = await query;
      
      if (type && (type === "digital" || type === "physical")) {
        const filtered = allProducts.filter(p => p.productType === type);
        return res.json(filtered);
      }
      
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/my-products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const myProducts = await db
        .select()
        .from(products)
        .where(eq(products.creatorId, userId))
        .orderBy(desc(products.createdAt));
      res.json(myProducts);
    } catch (error) {
      console.error("Error fetching user products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", isAuthenticated, isCreator, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertProductSchema.safeParse({ ...req.body, creatorId: userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid product data", errors: validation.error.flatten() });
      }

      const [product] = await db.insert(products).values(validation.data).returning();
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.creatorId, userId)));
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await db.delete(products).where(eq(products.id, id));
      res.json({ message: "Product deleted" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.delete("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.creatorId, userId)));
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      await db.delete(videos).where(eq(videos.id, id));
      res.json({ message: "Video deleted" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  app.patch("/api/live/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(and(eq(liveStreams.id, id), eq(liveStreams.creatorId, userId)));
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      const updateData: any = {};
      if (status) {
        updateData.status = status;
        if (status === "ended") {
          updateData.endedAt = new Date();
        }
      }

      const [updated] = await db
        .update(liveStreams)
        .set(updateData)
        .where(eq(liveStreams.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating live stream:", error);
      res.status(500).json({ message: "Failed to update stream" });
    }
  });

  app.delete("/api/live/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(and(eq(liveStreams.id, id), eq(liveStreams.creatorId, userId)));
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      await db.delete(liveStreams).where(eq(liveStreams.id, id));
      res.json({ message: "Stream deleted" });
    } catch (error) {
      console.error("Error deleting live stream:", error);
      res.status(500).json({ message: "Failed to delete stream" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userConversations = await db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt))
        .limit(50);
      res.json(userConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(desc(messages.createdAt))
        .limit(100);
      res.json(conversationMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const [notification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning();
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch count" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all read:", error);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  // Create or get conversation with a user
  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantId } = req.body;

      if (!participantId || participantId === userId) {
        return res.status(400).json({ message: "Invalid participant" });
      }

      // Check if conversation exists
      const [existing] = await db
        .select()
        .from(conversations)
        .where(
          or(
            and(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, participantId)),
            and(eq(conversations.participant1Id, participantId), eq(conversations.participant2Id, userId))
          )
        );

      if (existing) {
        return res.json(existing);
      }

      // Create new conversation
      const [conversation] = await db.insert(conversations).values({
        participant1Id: userId,
        participant2Id: participantId,
      }).returning();

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Send message
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content required" });
      }

      // Verify user is part of conversation
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return res.status(403).json({ message: "Not part of this conversation" });
      }

      // Create message
      const [message] = await db.insert(messages).values({
        conversationId: id,
        senderId: userId,
        content: content.trim(),
        status: "sent",
      }).returning();

      // Update conversation lastMessageAt
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, id));

      // Create notification for recipient
      const recipientId = conversation.participant1Id === userId 
        ? conversation.participant2Id 
        : conversation.participant1Id;

      await db.insert(notifications).values({
        userId: recipientId,
        title: "新しいメッセージ",
        body: content.trim().substring(0, 50),
        type: "message",
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get user's purchases
  app.get("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userPurchases = await db
        .select()
        .from(purchases)
        .where(eq(purchases.userId, userId))
        .orderBy(desc(purchases.createdAt));
      res.json(userPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Purchase a product
  app.post("/api/products/:id/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get product
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!product.isAvailable) {
        return res.status(400).json({ message: "Product not available" });
      }

      // Check if already purchased (for digital products)
      if (product.productType === "digital") {
        const [existingPurchase] = await db
          .select()
          .from(purchases)
          .where(and(eq(purchases.userId, userId), eq(purchases.productId, id)));

        if (existingPurchase) {
          return res.status(400).json({ message: "Already purchased" });
        }
      }

      // Check user points
      const [userProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      if (!userProfile || (userProfile.points || 0) < product.price) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Deduct points
      await db
        .update(userProfiles)
        .set({ points: (userProfile.points || 0) - product.price })
        .where(eq(userProfiles.userId, userId));

      // Update stock for physical products
      if (product.productType === "physical" && product.stock !== null && product.stock > 0) {
        await db
          .update(products)
          .set({ stock: product.stock - 1 })
          .where(eq(products.id, id));
      }

      // Create purchase record
      const [purchase] = await db.insert(purchases).values({
        userId,
        productId: id,
        price: product.price,
        status: "completed",
      }).returning();

      // Create notification
      await db.insert(notifications).values({
        userId,
        title: "購入完了",
        body: `${product.name}を購入しました`,
        type: "purchase",
      });

      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error purchasing product:", error);
      res.status(500).json({ message: "Failed to purchase product" });
    }
  });

  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await db
        .select()
        .from(creatorProfiles)
        .orderBy(desc(creatorProfiles.followerCount))
        .limit(20);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      res.status(500).json({ message: "Failed to fetch creators" });
    }
  });

  app.get("/api/creators/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [creator] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.id, id));
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(creator);
    } catch (error) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:id/videos", async (req, res) => {
    try {
      const { id } = req.params;
      const creatorVideos = await db
        .select()
        .from(videos)
        .where(and(eq(videos.creatorId, id), eq(videos.isPublished, true)))
        .orderBy(desc(videos.createdAt))
        .limit(20);
      res.json(creatorVideos);
    } catch (error) {
      console.error("Error fetching creator videos:", error);
      res.status(500).json({ message: "Failed to fetch creator videos" });
    }
  });

  app.get("/api/creators/:id/products", async (req, res) => {
    try {
      const { id } = req.params;
      const creatorProducts = await db
        .select()
        .from(products)
        .where(and(eq(products.creatorId, id), eq(products.isAvailable, true)))
        .orderBy(desc(products.createdAt))
        .limit(20);
      res.json(creatorProducts);
    } catch (error) {
      console.error("Error fetching creator products:", error);
      res.status(500).json({ message: "Failed to fetch creator products" });
    }
  });

  app.get("/api/follow/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;

      const [existingFollow] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, userId), eq(follows.followingId, creatorId)));

      res.json({ isFollowing: !!existingFollow });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.post("/api/follow/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;

      const [creator] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, creatorId));

      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const [existingFollow] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, userId), eq(follows.followingId, creatorId)));

      if (existingFollow) {
        return res.status(400).json({ message: "Already following" });
      }

      const [follow] = await db.insert(follows).values({
        followerId: userId,
        followingId: creatorId,
      }).returning();

      await db
        .update(creatorProfiles)
        .set({ followerCount: sql`${creatorProfiles.followerCount} + 1` })
        .where(eq(creatorProfiles.userId, creatorId));

      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following creator:", error);
      res.status(500).json({ message: "Failed to follow creator" });
    }
  });

  app.delete("/api/follow/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;

      const [creator] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, creatorId));

      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const [deletedFollow] = await db
        .delete(follows)
        .where(and(eq(follows.followerId, userId), eq(follows.followingId, creatorId)))
        .returning();

      if (!deletedFollow) {
        return res.status(404).json({ message: "Follow not found" });
      }

      await db
        .update(creatorProfiles)
        .set({ followerCount: sql`GREATEST(${creatorProfiles.followerCount} - 1, 0)` })
        .where(eq(creatorProfiles.userId, creatorId));

      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing creator:", error);
      res.status(500).json({ message: "Failed to unfollow creator" });
    }
  });

  app.get("/api/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const following = await db
        .select()
        .from(follows)
        .where(eq(follows.followerId, userId))
        .limit(100);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = new Date();
      const userSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gt(subscriptions.expiresAt, now)
        ))
        .limit(50);
      res.json(userSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscription/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;
      const now = new Date();
      
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, "active"),
          gt(subscriptions.expiresAt, now)
        ));
      
      res.json({ isSubscribed: !!subscription, subscription });
    } catch (error) {
      console.error("Error checking subscription:", error);
      res.status(500).json({ message: "Failed to check subscription" });
    }
  });

  app.post("/api/subscription/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;
      const { planType } = req.body;

      const SUBSCRIPTION_PRICES: Record<string, number> = {
        monthly: 500,
        yearly: 5000,
      };
      const selectedPlan = planType === "yearly" ? "yearly" : "monthly";
      const price = SUBSCRIPTION_PRICES[selectedPlan];

      const [creator] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, creatorId));

      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, "active")
        ));

      if (existingSub) {
        return res.status(400).json({ message: "Already subscribed" });
      }

      const [userProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      if (!userProfile || (userProfile.points || 0) < price) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      await db
        .update(userProfiles)
        .set({ points: (userProfile.points || 0) - price })
        .where(eq(userProfiles.userId, userId));

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (selectedPlan === "yearly" ? 12 : 1));

      const [subscription] = await db.insert(subscriptions).values({
        userId,
        creatorId,
        planType: selectedPlan,
        status: "active",
        expiresAt,
      }).returning();

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.delete("/api/subscription/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;

      const [updatedSub] = await db
        .update(subscriptions)
        .set({ status: "cancelled" })
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, "active")
        ))
        .returning();

      if (!updatedSub) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      res.json({ message: "Subscription cancelled" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // User Profile endpoints
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));
      
      if (!profile) {
        return res.json(null);
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertUserProfileSchema.safeParse({ ...req.body, userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: validation.error.flatten() });
      }

      // Check if profile exists
      const [existing] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      if (existing) {
        // Update existing profile
        const [profile] = await db
          .update(userProfiles)
          .set({ ...validation.data, updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId))
          .returning();
        res.json(profile);
      } else {
        // Create new profile
        const [profile] = await db
          .insert(userProfiles)
          .values(validation.data)
          .returning();
        res.json(profile);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Creator Application endpoints
  app.get("/api/creator-applications/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [application] = await db
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.userId, userId))
        .orderBy(desc(creatorApplications.submittedAt))
        .limit(1);
      
      res.json(application || null);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/creator-applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if there's already a pending application
      const [existingPending] = await db
        .select()
        .from(creatorApplications)
        .where(and(
          eq(creatorApplications.userId, userId),
          eq(creatorApplications.status, "pending")
        ));

      if (existingPending) {
        return res.status(400).json({ message: "You already have a pending application" });
      }

      const validation = insertCreatorApplicationSchema.safeParse({ ...req.body, userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid application data", errors: validation.error.flatten() });
      }

      const [application] = await db
        .insert(creatorApplications)
        .values(validation.data)
        .returning();
      
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Admin: List all creator applications
  app.get("/api/admin/creator-applications", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      let applications;
      
      if (status && ["pending", "approved", "rejected"].includes(status)) {
        applications = await db
          .select()
          .from(creatorApplications)
          .where(eq(creatorApplications.status, status))
          .orderBy(desc(creatorApplications.submittedAt));
      } else {
        applications = await db
          .select()
          .from(creatorApplications)
          .orderBy(desc(creatorApplications.submittedAt));
      }
      
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Admin: Approve/Reject application
  app.patch("/api/admin/creator-applications/:id/decision", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const reviewerId = req.user.claims.sub;

      if (!decision || !["approved", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "Invalid decision. Must be 'approved' or 'rejected'" });
      }

      const [application] = await db
        .update(creatorApplications)
        .set({
          status: decision,
          notes: notes || null,
          reviewedAt: new Date(),
          reviewerId,
        })
        .where(eq(creatorApplications.id, id))
        .returning();

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // If approved, create creator profile
      if (decision === "approved") {
        const [existingCreator] = await db
          .select()
          .from(creatorProfiles)
          .where(eq(creatorProfiles.userId, application.userId));

        if (!existingCreator) {
          await db.insert(creatorProfiles).values({
            userId: application.userId,
            displayName: "New Creator",
            isVerified: false,
          });
        }
      }

      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Creator Application Multi-Step Process
  app.get("/api/creator-application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [application] = await db
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.userId, userId))
        .orderBy(desc(creatorApplications.submittedAt))
        .limit(1);
      
      if (!application) {
        return res.json(null);
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching creator application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/creator-application/personal-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { fullName, birthDate, gender, postalCode, prefecture, city, address, building } = req.body;

      if (!fullName || !birthDate || !gender || !postalCode || !prefecture || !city || !address) {
        return res.status(400).json({ message: "必須項目を入力してください" });
      }

      // Check if application exists
      const [existingApp] = await db
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.userId, userId));

      if (existingApp) {
        // Update existing application
        const [updated] = await db
          .update(creatorApplications)
          .set({
            fullName,
            birthDate,
            gender,
            postalCode,
            prefecture,
            city,
            address,
            building: building || null,
            currentStep: "phone_verification",
          })
          .where(eq(creatorApplications.id, existingApp.id))
          .returning();
        res.json(updated);
      } else {
        // Create new application
        const [newApp] = await db
          .insert(creatorApplications)
          .values({
            userId,
            fullName,
            birthDate,
            gender,
            postalCode,
            prefecture,
            city,
            address,
            building: building || null,
            currentStep: "phone_verification",
            status: "pending",
          })
          .returning();
        res.status(201).json(newApp);
      }
    } catch (error) {
      console.error("Error saving personal info:", error);
      res.status(500).json({ message: "保存に失敗しました" });
    }
  });

  app.post("/api/creator-application/send-verification", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "電話番号を入力してください" });
      }

      // Validate phone number format (Japanese format)
      const cleanPhone = phoneNumber.replace(/[-\s]/g, "");
      if (!/^0[0-9]{9,10}$/.test(cleanPhone)) {
        return res.status(400).json({ message: "有効な電話番号を入力してください" });
      }

      // Update phone number in application
      await db
        .update(creatorApplications)
        .set({ phoneNumber: cleanPhone })
        .where(eq(creatorApplications.userId, userId));

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store code in database
      await db.insert(phoneVerificationCodes).values({
        userId,
        phoneNumber: cleanPhone,
        code: verificationCode,
        expiresAt,
      });

      // TODO: Integrate with Twilio to send actual SMS
      // For now, just log the verification code
      console.log(`Verification code for ${cleanPhone}: ${verificationCode}`);

      res.json({ message: "認証コードを送信しました" });
    } catch (error) {
      console.error("Error sending verification:", error);
      res.status(500).json({ message: "送信に失敗しました" });
    }
  });

  app.post("/api/creator-application/verify-phone", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber, code } = req.body;

      if (!code || code.length !== 6) {
        return res.status(400).json({ message: "6桁の認証コードを入力してください" });
      }

      // Get stored verification code from database
      const [storedVerification] = await db
        .select()
        .from(phoneVerificationCodes)
        .where(
          and(
            eq(phoneVerificationCodes.userId, userId),
            eq(phoneVerificationCodes.code, code),
            gt(phoneVerificationCodes.expiresAt, new Date()),
            isNull(phoneVerificationCodes.usedAt)
          )
        )
        .orderBy(desc(phoneVerificationCodes.createdAt))
        .limit(1);

      if (!storedVerification) {
        return res.status(400).json({ message: "認証コードが正しくないか、有効期限が切れています" });
      }

      // Mark code as used
      await db
        .update(phoneVerificationCodes)
        .set({ usedAt: new Date() })
        .where(eq(phoneVerificationCodes.id, storedVerification.id));

      // Update application
      const [updated] = await db
        .update(creatorApplications)
        .set({
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          currentStep: "document_submission",
        })
        .where(eq(creatorApplications.userId, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error verifying phone:", error);
      res.status(500).json({ message: "認証に失敗しました" });
    }
  });

  // For document uploads, we'll use a simple approach for now
  // In production, you'd want to use proper file storage like S3
  app.post("/api/creator-application/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For now, just update the step to under_review
      // In production, you'd handle actual file uploads here
      const [updated] = await db
        .update(creatorApplications)
        .set({
          currentStep: "under_review",
          documentsSubmittedAt: new Date(),
          // idDocumentType, idDocumentFrontUrl, etc. would be set here
        })
        .where(eq(creatorApplications.userId, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error submitting documents:", error);
      res.status(500).json({ message: "書類の提出に失敗しました" });
    }
  });

  // Point packages endpoint
  app.get("/api/point-packages", async (req, res) => {
    try {
      const packages = await db
        .select()
        .from(pointPackages)
        .where(eq(pointPackages.isActive, true))
        .orderBy(pointPackages.displayOrder);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching point packages:", error);
      res.status(500).json({ message: "Failed to fetch point packages" });
    }
  });

  // Bank transfer request endpoints
  app.post("/api/bank-transfer-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { points, amount, amountExcludingTax, taxAmount } = req.body;

      if (!points || !amount || points < 100) {
        return res.status(400).json({ message: "最低100ポイントから購入できます" });
      }

      // Set transfer deadline (7 days from now)
      const transferDeadline = new Date();
      transferDeadline.setDate(transferDeadline.getDate() + 7);

      const [request] = await db
        .insert(bankTransferRequests)
        .values({
          userId,
          points,
          amount,
          amountExcludingTax,
          taxAmount,
          transferDeadline,
        })
        .returning();

      res.json(request);
    } catch (error) {
      console.error("Error creating bank transfer request:", error);
      res.status(500).json({ message: "振込申請の作成に失敗しました" });
    }
  });

  app.get("/api/bank-transfer-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await db
        .select()
        .from(bankTransferRequests)
        .where(eq(bankTransferRequests.userId, userId))
        .orderBy(desc(bankTransferRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching bank transfer requests:", error);
      res.status(500).json({ message: "振込申請の取得に失敗しました" });
    }
  });

  // Admin: Get all pending bank transfer requests
  app.get("/api/admin/bank-transfer-requests", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requests = await db
        .select()
        .from(bankTransferRequests)
        .orderBy(desc(bankTransferRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching bank transfer requests:", error);
      res.status(500).json({ message: "振込申請の取得に失敗しました" });
    }
  });

  // Admin: Confirm bank transfer and grant points
  app.post("/api/admin/bank-transfer-requests/:id/confirm", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;

      // Get the transfer request
      const [request] = await db
        .select()
        .from(bankTransferRequests)
        .where(eq(bankTransferRequests.id, id));

      if (!request) {
        return res.status(404).json({ message: "振込申請が見つかりません" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "この申請は既に処理されています" });
      }

      // Get user's current points
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, request.userId));

      const currentPoints = profile?.points ?? 0;
      const newBalance = currentPoints + request.points;

      // Update bank transfer request status
      const [updatedRequest] = await db
        .update(bankTransferRequests)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          confirmedBy: adminId,
        })
        .where(eq(bankTransferRequests.id, id))
        .returning();

      // Update user's points
      await db
        .update(userProfiles)
        .set({ points: newBalance })
        .where(eq(userProfiles.userId, request.userId));

      // Create point transaction record
      await db.insert(pointTransactions).values({
        userId: request.userId,
        type: "purchase_bank",
        amount: request.points,
        balance: newBalance,
        description: `銀行振込によるポイント購入`,
        referenceId: id,
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error confirming bank transfer:", error);
      res.status(500).json({ message: "振込確認に失敗しました" });
    }
  });

  // ModelsLab image generation endpoint
  app.post("/api/generate-image", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, negative_prompt, width, height, samples } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
        return res.status(400).json({ message: "Prompt is required and must be under 500 characters" });
      }

      // Validate and clamp numeric parameters
      const validatedWidth = Math.min(Math.max(Number(width) || 512, 256), 1024);
      const validatedHeight = Math.min(Math.max(Number(height) || 768, 256), 1024);
      const validatedSamples = Math.min(Math.max(Number(samples) || 1, 1), 4);

      const images = await generateImage({
        prompt: prompt.slice(0, 500),
        negative_prompt: typeof negative_prompt === "string" ? negative_prompt.slice(0, 200) : undefined,
        width: validatedWidth,
        height: validatedHeight,
        samples: validatedSamples,
      });

      res.json({ 
        status: "success", 
        images,
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate image" 
      });
    }
  });

  return httpServer;
}
