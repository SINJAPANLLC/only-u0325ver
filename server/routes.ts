import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./emailAuth";
import { db } from "./db";
import { 
  videos, liveStreams, products, conversations, messages, 
  notifications, creatorProfiles, follows, subscriptions,
  userProfiles, creatorApplications,
  insertVideoSchema, insertProductSchema, insertLiveStreamSchema,
  insertUserProfileSchema, insertCreatorApplicationSchema
} from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerEmailAuthRoutes(app);

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

      // Update phone number in application
      await db
        .update(creatorApplications)
        .set({ phoneNumber })
        .where(eq(creatorApplications.userId, userId));

      // TODO: Integrate with Twilio to send actual SMS
      // For now, just log the verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);

      // Store code in session or cache (simplified for demo)
      (req.session as any).phoneVerificationCode = verificationCode;
      (req.session as any).phoneVerificationNumber = phoneNumber;

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

      // Get stored verification code
      const storedCode = (req.session as any).phoneVerificationCode;
      const storedNumber = (req.session as any).phoneVerificationNumber;

      // For demo purposes, accept any 6-digit code or the stored code
      const isValidCode = code === storedCode || (code.length === 6 && /^\d+$/.test(code));

      if (!isValidCode) {
        return res.status(400).json({ message: "認証コードが正しくありません" });
      }

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

      // Clear session data
      delete (req.session as any).phoneVerificationCode;
      delete (req.session as any).phoneVerificationNumber;

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
