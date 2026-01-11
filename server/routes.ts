import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { 
  videos, liveStreams, products, conversations, messages, 
  notifications, creatorProfiles, follows, subscriptions,
  insertVideoSchema, insertProductSchema, insertLiveStreamSchema
} from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { generateImage } from "./modelslab";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

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

  app.post("/api/videos", isAuthenticated, async (req: any, res) => {
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
      const streams = await db
        .select()
        .from(liveStreams)
        .orderBy(desc(liveStreams.createdAt))
        .limit(20);
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

  app.post("/api/live", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/follow/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;

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

      const [deletedFollow] = await db
        .delete(follows)
        .where(and(eq(follows.followerId, userId), eq(follows.followingId, creatorId)))
        .returning();

      if (!deletedFollow) {
        return res.status(404).json({ message: "Follow not found" });
      }

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
      const userSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(50);
      res.json(userSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
