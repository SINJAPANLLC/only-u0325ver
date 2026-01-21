import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./emailAuth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { setupWebRTCSignaling } from "./webrtc";
import { db } from "./db";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { 
  users, videos, liveStreams, products, conversations, messages, 
  notifications, creatorProfiles, follows, subscriptions, subscriptionPlans,
  userProfiles, creatorApplications, phoneVerificationCodes,
  videoLikes, liveViewingSessions, withdrawalRequests,
  bankTransferRequests, pointPackages, pointTransactions, purchases, comments,
  insertVideoSchema, insertProductSchema, insertLiveStreamSchema,
  insertUserProfileSchema, insertCreatorApplicationSchema, insertMessageSchema, insertCommentSchema,
  insertSubscriptionPlanSchema
} from "@shared/schema";
import { eq, desc, and, or, sql, gt, isNull, inArray, ne } from "drizzle-orm";
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

// Helper function to send automatic message between creator and buyer
async function sendAutoMessage(creatorId: string, buyerId: string, messageContent: string) {
  try {
    // Find existing conversation
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.participant1Id, creatorId), eq(conversations.participant2Id, buyerId)),
          and(eq(conversations.participant1Id, buyerId), eq(conversations.participant2Id, creatorId))
        )
      );
    
    let conversationId: string;
    
    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const [newConversation] = await db.insert(conversations).values({
        participant1Id: creatorId,
        participant2Id: buyerId,
      }).returning();
      conversationId = newConversation.id;
    }
    
    // Send the message (from creator to buyer)
    await db.insert(messages).values({
      conversationId,
      senderId: creatorId,
      content: messageContent,
    });
    
    // Update conversation lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
      
    console.log(`Auto message sent from ${creatorId} to ${buyerId}`);
  } catch (error) {
    console.error("Error sending auto message:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerEmailAuthRoutes(app);
  registerObjectStorageRoutes(app);
  
  // Setup WebRTC signaling for live streaming
  setupWebRTCSignaling(httpServer);

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
        .select({
          id: videos.id,
          creatorId: videos.creatorId,
          title: videos.title,
          description: videos.description,
          thumbnailUrl: videos.thumbnailUrl,
          videoUrl: videos.videoUrl,
          duration: videos.duration,
          viewCount: videos.viewCount,
          likeCount: videos.likeCount,
          commentCount: videos.commentCount,
          contentType: videos.contentType,
          requiredTier: videos.requiredTier,
          isPublished: videos.isPublished,
          createdAt: videos.createdAt,
          creatorDisplayName: creatorProfiles.displayName,
          creatorAvatarUrl: userProfiles.avatarUrl,
        })
        .from(videos)
        .leftJoin(creatorProfiles, eq(videos.creatorId, creatorProfiles.userId))
        .leftJoin(userProfiles, eq(videos.creatorId, userProfiles.userId))
        .where(and(eq(videos.isPublished, true), eq(videos.contentType, "free")))
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

  // Get videos from followed creators
  app.get("/api/videos/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get list of followed creator IDs
      const followedCreators = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      const followedIds = followedCreators.map(f => f.followingId);
      
      if (followedIds.length === 0) {
        return res.json([]);
      }
      
      // Get videos from followed creators
      const followingVideos = await db
        .select({
          id: videos.id,
          creatorId: videos.creatorId,
          title: videos.title,
          description: videos.description,
          thumbnailUrl: videos.thumbnailUrl,
          videoUrl: videos.videoUrl,
          duration: videos.duration,
          viewCount: videos.viewCount,
          likeCount: videos.likeCount,
          commentCount: videos.commentCount,
          contentType: videos.contentType,
          requiredTier: videos.requiredTier,
          isPublished: videos.isPublished,
          createdAt: videos.createdAt,
          creatorDisplayName: creatorProfiles.displayName,
          creatorAvatarUrl: userProfiles.avatarUrl,
        })
        .from(videos)
        .leftJoin(creatorProfiles, eq(videos.creatorId, creatorProfiles.userId))
        .leftJoin(userProfiles, eq(videos.creatorId, userProfiles.userId))
        .where(and(
          eq(videos.isPublished, true),
          sql`${videos.creatorId} IN (${sql.join(followedIds.map(id => sql`${id}`), sql`, `)})`
        ))
        .orderBy(desc(videos.createdAt))
        .limit(20);
      
      res.json(followingVideos);
    } catch (error) {
      console.error("Error fetching following videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Comments API
  app.get("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const { videoId } = req.params;
      const videoComments = await db
        .select({
          id: comments.id,
          videoId: comments.videoId,
          userId: comments.userId,
          content: comments.content,
          likeCount: comments.likeCount,
          createdAt: comments.createdAt,
          userDisplayName: userProfiles.displayName,
          userAvatarUrl: userProfiles.avatarUrl,
        })
        .from(comments)
        .leftJoin(userProfiles, eq(comments.userId, userProfiles.userId))
        .where(eq(comments.videoId, videoId))
        .orderBy(desc(comments.createdAt))
        .limit(50);
      res.json(videoComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/videos/:videoId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.user.claims.sub;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "コメント内容が必要です" });
      }

      const [comment] = await db.insert(comments).values({
        videoId,
        userId,
        content: content.trim(),
      }).returning();

      // Update comment count on video
      await db
        .update(videos)
        .set({
          commentCount: sql`COALESCE(${videos.commentCount}, 0) + 1`
        })
        .where(eq(videos.id, videoId));

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/live", async (req, res) => {
    try {
      const { status } = req.query;
      const streams = await db
        .select()
        .from(liveStreams)
        .orderBy(desc(liveStreams.createdAt))
        .limit(20);
      
      const filteredStreams = status === "live" 
        ? streams.filter(s => s.status === "live")
        : streams;
      
      const streamsWithCreator = await Promise.all(
        filteredStreams.map(async (stream) => {
          const [creatorProfile] = await db
            .select()
            .from(creatorProfiles)
            .where(eq(creatorProfiles.userId, stream.creatorId))
            .limit(1);
          
          const [userProfile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, stream.creatorId))
            .limit(1);
          
          return {
            ...stream,
            creatorDisplayName: creatorProfile?.displayName || userProfile?.displayName || "Creator",
            creatorAvatar: userProfile?.avatarUrl || null,
          };
        })
      );
      
      res.json(streamsWithCreator);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.get("/api/live/active", async (req, res) => {
    try {
      const activeStreams = await db
        .select({
          id: liveStreams.id,
          creatorId: liveStreams.creatorId,
          title: liveStreams.title,
          description: liveStreams.description,
          thumbnailUrl: liveStreams.thumbnailUrl,
          streamKey: liveStreams.streamKey,
          status: liveStreams.status,
          viewerCount: liveStreams.viewerCount,
          partyRatePerMinute: liveStreams.partyRatePerMinute,
          twoshotRatePerMinute: liveStreams.twoshotRatePerMinute,
          scheduledAt: liveStreams.scheduledAt,
          startedAt: liveStreams.startedAt,
          endedAt: liveStreams.endedAt,
          createdAt: liveStreams.createdAt,
          creatorDisplayName: userProfiles.displayName,
          creatorAvatar: userProfiles.avatarUrl,
        })
        .from(liveStreams)
        .leftJoin(userProfiles, eq(liveStreams.creatorId, userProfiles.userId))
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

  // Join a live viewing session (party/2shot mode)
  app.post("/api/live/:streamId/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      const { mode } = req.body;

      if (!mode || !["party", "twoshot"].includes(mode)) {
        return res.status(400).json({ message: "Invalid mode" });
      }

      // Get the stream to check rates
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId));

      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      const ratePerMinute = mode === "party" ? stream.partyRatePerMinute : stream.twoshotRatePerMinute;

      // Get user's current points
      const [userProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Check if user has enough points for at least 1 minute
      if ((userProfile.points || 0) < (ratePerMinute || 0)) {
        return res.status(400).json({ message: "ポイントが不足しています", insufficientPoints: true });
      }

      // For 2shot mode, check if someone else is already in a session
      if (mode === "twoshot") {
        const [existingTwoshotSession] = await db
          .select()
          .from(liveViewingSessions)
          .where(and(
            eq(liveViewingSessions.liveStreamId, streamId),
            eq(liveViewingSessions.mode, "twoshot"),
            eq(liveViewingSessions.isActive, true)
          ));

        if (existingTwoshotSession && existingTwoshotSession.userId !== userId) {
          return res.status(400).json({ message: "2ショットは現在他のユーザーが利用中です", twoshotOccupied: true });
        }
      }

      // End any active sessions for this user on this stream
      await db
        .update(liveViewingSessions)
        .set({ isActive: false, endedAt: new Date() })
        .where(and(
          eq(liveViewingSessions.userId, userId),
          eq(liveViewingSessions.liveStreamId, streamId),
          eq(liveViewingSessions.isActive, true)
        ));

      // Create new session
      const [session] = await db
        .insert(liveViewingSessions)
        .values({
          liveStreamId: streamId,
          userId,
          mode,
          ratePerMinute: ratePerMinute || 50,
        })
        .returning();

      // Update viewer count
      await db
        .update(liveStreams)
        .set({ viewerCount: (stream.viewerCount || 0) + 1 })
        .where(eq(liveStreams.id, streamId));

      res.json({ session, userPoints: userProfile.points });
    } catch (error) {
      console.error("Error joining live session:", error);
      res.status(500).json({ message: "Failed to join session" });
    }
  });

  // Charge points for active session (called every minute)
  app.post("/api/live/:streamId/charge", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;

      // Get active session
      const [session] = await db
        .select()
        .from(liveViewingSessions)
        .where(and(
          eq(liveViewingSessions.userId, userId),
          eq(liveViewingSessions.liveStreamId, streamId),
          eq(liveViewingSessions.isActive, true)
        ));

      if (!session) {
        return res.status(404).json({ message: "No active session" });
      }

      // Get user's current points
      const [userProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Check if user has enough points
      if ((userProfile.points || 0) < session.ratePerMinute) {
        // End session due to insufficient points
        await db
          .update(liveViewingSessions)
          .set({ isActive: false, endedAt: new Date() })
          .where(eq(liveViewingSessions.id, session.id));
        
        return res.status(400).json({ message: "ポイント不足のためセッションを終了しました", insufficientPoints: true });
      }

      // Deduct points from viewer
      const newPoints = (userProfile.points || 0) - session.ratePerMinute;
      await db
        .update(userProfiles)
        .set({ points: newPoints })
        .where(eq(userProfiles.userId, userId));

      // Add points to creator
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId));

      if (stream) {
        const [creatorProfile] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, stream.creatorId));

        if (creatorProfile) {
          await db
            .update(userProfiles)
            .set({ points: (creatorProfile.points || 0) + session.ratePerMinute })
            .where(eq(userProfiles.userId, stream.creatorId));
        }
      }

      // Update session totals
      await db
        .update(liveViewingSessions)
        .set({
          totalMinutes: (session.totalMinutes || 0) + 1,
          totalPointsCharged: (session.totalPointsCharged || 0) + session.ratePerMinute,
        })
        .where(eq(liveViewingSessions.id, session.id));

      res.json({ 
        newPoints, 
        charged: session.ratePerMinute,
        totalMinutes: (session.totalMinutes || 0) + 1,
        totalCharged: (session.totalPointsCharged || 0) + session.ratePerMinute
      });
    } catch (error) {
      console.error("Error charging session:", error);
      res.status(500).json({ message: "Failed to charge session" });
    }
  });

  // Get stream session status (for checking if party/2shot is active)
  app.get("/api/live/:streamId/status", async (req, res) => {
    try {
      const { streamId } = req.params;

      // Get all active sessions for this stream
      const activeSessions = await db
        .select()
        .from(liveViewingSessions)
        .where(and(
          eq(liveViewingSessions.liveStreamId, streamId),
          eq(liveViewingSessions.isActive, true)
        ));

      // Determine the current mode (party or twoshot)
      const hasParty = activeSessions.some(s => s.mode === "party");
      const hasTwoshot = activeSessions.some(s => s.mode === "twoshot");

      res.json({
        activeSessionCount: activeSessions.length,
        hasParty,
        hasTwoshot,
        currentMode: hasTwoshot ? "twoshot" : hasParty ? "party" : null,
      });
    } catch (error) {
      console.error("Error getting stream status:", error);
      res.status(500).json({ message: "Failed to get stream status" });
    }
  });

  // Leave a live viewing session
  app.post("/api/live/:streamId/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;

      // End active session
      const result = await db
        .update(liveViewingSessions)
        .set({ isActive: false, endedAt: new Date() })
        .where(and(
          eq(liveViewingSessions.userId, userId),
          eq(liveViewingSessions.liveStreamId, streamId),
          eq(liveViewingSessions.isActive, true)
        ))
        .returning();

      if (result.length === 0) {
        return res.json({ message: "No active session to end" });
      }

      // Decrement viewer count
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId));

      if (stream && (stream.viewerCount || 0) > 0) {
        await db
          .update(liveStreams)
          .set({ viewerCount: (stream.viewerCount || 1) - 1 })
          .where(eq(liveStreams.id, streamId));
      }

      res.json({ session: result[0] });
    } catch (error) {
      console.error("Error leaving session:", error);
      res.status(500).json({ message: "Failed to leave session" });
    }
  });

  // Get live streams from followed creators
  app.get("/api/live/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get list of creators the user follows
      const userFollows = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

      const followedCreatorIds = userFollows.map(f => f.followingId);

      if (followedCreatorIds.length === 0) {
        return res.json([]);
      }

      // Get active live streams from followed creators
      const followedStreams = await db
        .select({
          id: liveStreams.id,
          title: liveStreams.title,
          creatorId: liveStreams.creatorId,
          status: liveStreams.status,
          thumbnailUrl: liveStreams.thumbnailUrl,
          viewerCount: liveStreams.viewerCount,
          partyRatePerMinute: liveStreams.partyRatePerMinute,
          twoshotRatePerMinute: liveStreams.twoshotRatePerMinute,
          createdAt: liveStreams.createdAt,
          creatorDisplayName: creatorProfiles.displayName,
          creatorAvatar: userProfiles.avatarUrl,
        })
        .from(liveStreams)
        .leftJoin(creatorProfiles, eq(liveStreams.creatorId, creatorProfiles.userId))
        .leftJoin(userProfiles, eq(liveStreams.creatorId, userProfiles.userId))
        .where(and(
          eq(liveStreams.status, "live"),
          sql`${liveStreams.creatorId} IN (${sql.join(followedCreatorIds.map(id => sql`${id}`), sql`, `)})`
        ))
        .orderBy(desc(liveStreams.viewerCount));

      res.json(followedStreams);
    } catch (error) {
      console.error("Error fetching following live streams:", error);
      res.status(500).json({ message: "Failed to fetch following live streams" });
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

  // Get products by creator
  app.get("/api/creators/:creatorId/products", async (req, res) => {
    try {
      const { creatorId } = req.params;
      const creatorProducts = await db
        .select()
        .from(products)
        .where(and(
          eq(products.creatorId, creatorId),
          eq(products.isAvailable, true)
        ))
        .orderBy(desc(products.createdAt));
      res.json(creatorProducts);
    } catch (error) {
      console.error("Error fetching creator products:", error);
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

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { name, description, price, stock, imageUrl, contentUrl, productType, isAvailable } = req.body;
      
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.creatorId, userId)));
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (stock !== undefined) updateData.stock = stock;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (contentUrl !== undefined) updateData.contentUrl = contentUrl;
      if (productType !== undefined) updateData.productType = productType;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

      const [updated] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
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

  app.patch("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { title, thumbnailUrl, videoUrl, requiredTier, tags, isPublished } = req.body;
      
      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.creatorId, userId)));
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
      if (requiredTier !== undefined) {
        updateData.requiredTier = requiredTier;
        updateData.contentType = requiredTier > 0 ? "premium" : "free";
      }
      if (tags !== undefined) updateData.tags = tags;
      if (isPublished !== undefined) updateData.isPublished = isPublished;

      const [updated] = await db
        .update(videos)
        .set(updateData)
        .where(eq(videos.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating video:", error);
      res.status(500).json({ message: "Failed to update video" });
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
      
      // Get unread counts and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        userConversations.map(async (conv) => {
          // Get unread count
          const [unreadResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(
              and(
                eq(messages.conversationId, conv.id),
                ne(messages.senderId, userId),
                ne(messages.status, "read")
              )
            );
          
          // Get last message
          const [lastMessage] = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(desc(messages.createdAt))
            .limit(1);
          
          return {
            ...conv,
            unreadCount: Number(unreadResult?.count || 0),
            lastMessageContent: lastMessage?.content || "",
          };
        })
      );
      
      res.json(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Mark messages as read (messages sent to this user)
      await db
        .update(messages)
        .set({ status: "read" })
        .where(
          and(
            eq(messages.conversationId, id),
            ne(messages.senderId, userId),
            ne(messages.status, "read")
          )
        );
      
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

  // Get unread message count (messages sent to user that are not read)
  app.get("/api/messages/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all conversations where user is a participant
      const userConversations = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        );
      
      if (userConversations.length === 0) {
        return res.json({ count: 0 });
      }
      
      const conversationIds = userConversations.map(c => c.id);
      
      // Count unread messages (sent to user, not from user, and status is not 'read')
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            inArray(messages.conversationId, conversationIds),
            ne(messages.senderId, userId),
            ne(messages.status, "read")
          )
        );
      
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
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

  app.post("/api/videos/:videoId/like", isAuthenticated, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.user.claims.sub;

      const [existingLike] = await db
        .select()
        .from(videoLikes)
        .where(and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, videoId)));

      if (existingLike) {
        await db.delete(videoLikes).where(eq(videoLikes.id, existingLike.id));
        await db.update(videos).set({ likeCount: sql`${videos.likeCount} - 1` }).where(eq(videos.id, videoId));
        return res.json({ liked: false });
      }

      await db.insert(videoLikes).values({ userId, videoId });
      await db.update(videos).set({ likeCount: sql`${videos.likeCount} + 1` }).where(eq(videos.id, videoId));
      res.json({ liked: true });
    } catch (error) {
      console.error("Error liking video:", error);
      res.status(500).json({ message: "Failed to like video" });
    }
  });

  app.get("/api/my-likes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const likedVideos = await db
        .select({
          id: videos.id,
          title: videos.title,
          thumbnailUrl: videos.thumbnailUrl,
          videoUrl: videos.videoUrl,
          creatorId: videos.creatorId,
          creatorDisplayName: creatorProfiles.displayName,
          viewCount: videos.viewCount,
          likeCount: videos.likeCount,
        })
        .from(videoLikes)
        .innerJoin(videos, eq(videoLikes.videoId, videos.id))
        .leftJoin(creatorProfiles, eq(videos.creatorId, creatorProfiles.userId))
        .where(eq(videoLikes.userId, userId))
        .orderBy(desc(videoLikes.createdAt));
      res.json(likedVideos);
    } catch (error) {
      console.error("Error fetching liked videos:", error);
      res.status(500).json({ message: "Failed to fetch liked videos" });
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

  // Get user's purchases with product details
  app.get("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userPurchases = await db
        .select({
          purchase: purchases,
          product: products,
        })
        .from(purchases)
        .leftJoin(products, eq(purchases.productId, products.id))
        .where(eq(purchases.userId, userId))
        .orderBy(desc(purchases.createdAt));
      
      const result = userPurchases.map(p => ({
        ...p.purchase,
        product: p.product,
      }));
      res.json(result);
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
      const { shippingName, shippingPostalCode, shippingAddress, shippingPhone } = req.body || {};

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

      // Check stock for physical products
      if (product.productType === "physical" && product.stock !== null && product.stock !== 0 && product.stock <= 0) {
        return res.status(400).json({ message: "Out of stock" });
      }

      // Require shipping info for physical products
      if (product.productType === "physical") {
        if (!shippingName || !shippingPostalCode || !shippingAddress || !shippingPhone) {
          return res.status(400).json({ message: "Shipping information required for physical products" });
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
        const newStock = product.stock - 1;
        const updateData: any = { stock: newStock };
        
        // If stock reaches 0, set product as unavailable
        if (newStock <= 0) {
          updateData.isAvailable = false;
        }
        
        await db
          .update(products)
          .set(updateData)
          .where(eq(products.id, id));
      }

      // Create purchase record
      const purchaseData: any = {
        userId,
        productId: id,
        creatorId: product.creatorId,
        price: product.price,
        status: product.productType === "physical" ? "pending" : "completed",
      };
      
      // Add shipping info for physical products
      if (product.productType === "physical") {
        purchaseData.shippingName = shippingName;
        purchaseData.shippingPostalCode = shippingPostalCode;
        purchaseData.shippingAddress = shippingAddress;
        purchaseData.shippingPhone = shippingPhone;
      }
      
      const [purchase] = await db.insert(purchases).values(purchaseData).returning();

      // Create notification
      await db.insert(notifications).values({
        userId,
        title: "購入完了",
        body: `${product.name}を購入しました`,
        type: "purchase",
      });

      // Send automatic purchase message from creator to buyer
      if (product.creatorId) {
        let purchaseMessage: string;
        
        if (product.productType === "physical") {
          purchaseMessage = `【ご購入ありがとうございます】\n\n「${product.name}」をご購入いただきありがとうございます！\n\n発送準備が整い次第、発送させていただきます。発送完了後に改めてご連絡いたします。\n\nしばらくお待ちください。`;
        } else {
          // Digital product - send download link
          const host = req.get('host') || process.env.REPLIT_DEV_DOMAIN || '';
          const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
          const baseUrl = host ? `${protocol}://${host}` : '';
          const downloadUrl = product.contentUrl ? `${baseUrl}${product.contentUrl}` : null;
          
          if (downloadUrl) {
            purchaseMessage = `【ご購入ありがとうございます】\n\n「${product.name}」をご購入いただきありがとうございます！\n\n以下のリンクからコンテンツをダウンロードできます：\n${downloadUrl}\n\nお楽しみください！`;
          } else {
            purchaseMessage = `【ご購入ありがとうございます】\n\n「${product.name}」をご購入いただきありがとうございます！\n\nマイページの「購入履歴」からコンテンツにアクセスできます。\n\nお楽しみください！`;
          }
        }
        
        await sendAutoMessage(product.creatorId, userId, purchaseMessage);
      }

      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error purchasing product:", error);
      res.status(500).json({ message: "Failed to purchase product" });
    }
  });

  // Get creator's orders (for physical products)
  app.get("/api/creator-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const orders = await db
        .select({
          purchase: purchases,
          product: products,
          buyer: users,
        })
        .from(purchases)
        .leftJoin(products, eq(purchases.productId, products.id))
        .leftJoin(users, eq(purchases.userId, users.id))
        .where(eq(purchases.creatorId, userId))
        .orderBy(desc(purchases.createdAt));
      
      const result = orders.map(o => ({
        ...o.purchase,
        product: o.product,
        buyer: o.buyer ? { 
          id: o.buyer.id, 
          email: o.buyer.email,
          firstName: o.buyer.firstName,
          lastName: o.buyer.lastName,
        } : null,
      }));
      res.json(result);
    } catch (error) {
      console.error("Error fetching creator orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status (for creators)
  app.patch("/api/creator-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      // Get order with product info
      const [orderWithProduct] = await db
        .select({
          purchase: purchases,
          product: products,
        })
        .from(purchases)
        .leftJoin(products, eq(purchases.productId, products.id))
        .where(and(eq(purchases.id, id), eq(purchases.creatorId, userId)));
      
      if (!orderWithProduct) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const [updated] = await db
        .update(purchases)
        .set({ status })
        .where(eq(purchases.id, id))
        .returning();
      
      // Send shipping notification message when status changes to "shipped"
      if (status === "shipped" && orderWithProduct.purchase.creatorId && orderWithProduct.purchase.userId) {
        const productName = orderWithProduct.product?.name || "商品";
        const shippingMessage = `【発送完了のお知らせ】\n\n「${productName}」を発送いたしました！\n\n商品の到着まで今しばらくお待ちください。\n\nご購入ありがとうございました！`;
        
        await sendAutoMessage(orderWithProduct.purchase.creatorId, orderWithProduct.purchase.userId, shippingMessage);
        
        // Also create a notification
        await db.insert(notifications).values({
          userId: orderWithProduct.purchase.userId,
          title: "発送完了",
          body: `${productName}が発送されました`,
          type: "shipping",
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Creator sales management
  app.get("/api/creator/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user is a creator
      const [creatorProfile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, userId));
      
      if (!creatorProfile) {
        return res.status(403).json({ message: "Not a creator" });
      }
      
      // Get earnings breakdown
      const [liveEarnings] = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(pointTransactions)
        .where(and(
          eq(pointTransactions.userId, userId),
          eq(pointTransactions.type, "bonus"),
          sql`${pointTransactions.description} LIKE '%配信%'`
        ));
      
      // Get product sales
      const productSales = await db
        .select({
          id: purchases.id,
          productId: purchases.productId,
          productName: products.name,
          amount: purchases.amount,
          status: purchases.status,
          createdAt: purchases.createdAt,
          productType: products.productType,
        })
        .from(purchases)
        .leftJoin(products, eq(purchases.productId, products.id))
        .where(eq(purchases.creatorId, userId))
        .orderBy(desc(purchases.createdAt))
        .limit(50);
      
      // Get subscription earnings (from subscription payments)
      const [subscriptionEarnings] = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(pointTransactions)
        .where(and(
          eq(pointTransactions.userId, userId),
          eq(pointTransactions.type, "bonus"),
          sql`${pointTransactions.description} LIKE '%サブスク%'`
        ));
      
      // Calculate product total
      const productTotal = productSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
      
      res.json({
        profile: creatorProfile,
        liveEarnings: liveEarnings?.total || 0,
        productEarnings: productTotal,
        subscriptionEarnings: subscriptionEarnings?.total || 0,
        recentSales: productSales,
      });
    } catch (error) {
      console.error("Error fetching creator sales:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  // Get creator's bank info
  app.get("/api/creator/bank-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [creatorProfile] = await db
        .select({
          bankName: creatorProfiles.bankName,
          bankBranchName: creatorProfiles.bankBranchName,
          bankAccountType: creatorProfiles.bankAccountType,
          bankAccountNumber: creatorProfiles.bankAccountNumber,
          bankAccountHolder: creatorProfiles.bankAccountHolder,
          availableBalance: creatorProfiles.availableBalance,
        })
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, userId));
      
      if (!creatorProfile) {
        return res.status(403).json({ message: "Not a creator" });
      }
      
      res.json(creatorProfile);
    } catch (error) {
      console.error("Error fetching bank info:", error);
      res.status(500).json({ message: "Failed to fetch bank info" });
    }
  });

  // Update creator's bank info
  app.put("/api/creator/bank-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bankName, bankBranchName, bankAccountType, bankAccountNumber, bankAccountHolder } = req.body;
      
      const [updated] = await db
        .update(creatorProfiles)
        .set({
          bankName,
          bankBranchName,
          bankAccountType,
          bankAccountNumber,
          bankAccountHolder,
        })
        .where(eq(creatorProfiles.userId, userId))
        .returning();
      
      if (!updated) {
        return res.status(403).json({ message: "Not a creator" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating bank info:", error);
      res.status(500).json({ message: "Failed to update bank info" });
    }
  });

  // Get withdrawal requests
  app.get("/api/creator/withdrawals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const requests = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.creatorId, userId))
        .orderBy(desc(withdrawalRequests.createdAt));
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Create withdrawal request
  app.post("/api/creator/withdrawals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      // Get creator profile
      const [creatorProfile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, userId));
      
      if (!creatorProfile) {
        return res.status(403).json({ message: "Not a creator" });
      }
      
      // Check if bank info is registered
      if (!creatorProfile.bankName || !creatorProfile.bankAccountNumber) {
        return res.status(400).json({ message: "Bank information not registered" });
      }
      
      // Check available balance
      if (creatorProfile.availableBalance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Minimum withdrawal amount
      const MIN_WITHDRAWAL = 3000;
      if (amount < MIN_WITHDRAWAL) {
        return res.status(400).json({ message: `Minimum withdrawal is ${MIN_WITHDRAWAL} points` });
      }
      
      // Calculate fee (300 yen)
      const fee = 300;
      const netAmount = amount - fee;
      
      // Create withdrawal request
      const [withdrawal] = await db.insert(withdrawalRequests).values({
        creatorId: userId,
        amount,
        fee,
        netAmount,
        bankName: creatorProfile.bankName,
        bankBranchName: creatorProfile.bankBranchName || "",
        bankAccountType: creatorProfile.bankAccountType || "普通",
        bankAccountNumber: creatorProfile.bankAccountNumber,
        bankAccountHolder: creatorProfile.bankAccountHolder || "",
      }).returning();
      
      // Update available balance (move to pending)
      await db
        .update(creatorProfiles)
        .set({
          availableBalance: sql`${creatorProfiles.availableBalance} - ${amount}`,
          pendingBalance: sql`${creatorProfiles.pendingBalance} + ${amount}`,
        })
        .where(eq(creatorProfiles.userId, userId));
      
      res.json(withdrawal);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ message: "Failed to create withdrawal" });
    }
  });

  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await db
        .select({
          id: creatorProfiles.id,
          userId: creatorProfiles.userId,
          displayName: creatorProfiles.displayName,
          bio: creatorProfiles.bio,
          coverImageUrl: creatorProfiles.coverImageUrl,
          isVerified: creatorProfiles.isVerified,
          followerCount: creatorProfiles.followerCount,
          followingCount: creatorProfiles.followingCount,
          postCount: creatorProfiles.postCount,
          createdAt: creatorProfiles.createdAt,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(creatorProfiles)
        .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
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
      
      let result = await db
        .select({
          id: creatorProfiles.id,
          userId: creatorProfiles.userId,
          displayName: userProfiles.displayName,
          bio: creatorProfiles.bio,
          coverImageUrl: creatorProfiles.coverImageUrl,
          isVerified: creatorProfiles.isVerified,
          followerCount: creatorProfiles.followerCount,
          followingCount: creatorProfiles.followingCount,
          postCount: creatorProfiles.postCount,
          avatarUrl: userProfiles.avatarUrl,
          username: userProfiles.username,
        })
        .from(creatorProfiles)
        .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
        .where(eq(creatorProfiles.id, id));
      
      if (result.length === 0) {
        result = await db
          .select({
            id: creatorProfiles.id,
            userId: creatorProfiles.userId,
            displayName: userProfiles.displayName,
            bio: creatorProfiles.bio,
            coverImageUrl: creatorProfiles.coverImageUrl,
            isVerified: creatorProfiles.isVerified,
            followerCount: creatorProfiles.followerCount,
            followingCount: creatorProfiles.followingCount,
            postCount: creatorProfiles.postCount,
            avatarUrl: userProfiles.avatarUrl,
            username: userProfiles.username,
          })
          .from(creatorProfiles)
          .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
          .where(eq(creatorProfiles.userId, id));
      }
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:id/videos", async (req, res) => {
    try {
      const { id } = req.params;
      
      let [creator] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.id, id));
      
      if (!creator) {
        [creator] = await db
          .select()
          .from(creatorProfiles)
          .where(eq(creatorProfiles.userId, id));
      }
      
      const creatorUserId = creator?.userId || id;
      
      const creatorVideos = await db
        .select()
        .from(videos)
        .where(and(eq(videos.creatorId, creatorUserId), eq(videos.isPublished, true)))
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

  // ===== Subscription Plans API =====
  
  // Get all plans for a creator (public)
  app.get("/api/subscription-plans/:creatorId", async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.creatorId, creatorId),
          eq(subscriptionPlans.isActive, true)
        ))
        .orderBy(subscriptionPlans.tier);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get my plans (for creators)
  app.get("/api/my-subscription-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(and(eq(subscriptionPlans.creatorId, userId), eq(subscriptionPlans.isActive, true)))
        .orderBy(subscriptionPlans.tier);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching my subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Create a new plan (for creators)
  app.post("/api/subscription-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, price, tier } = req.body;
      
      const [plan] = await db.insert(subscriptionPlans).values({
        creatorId: userId,
        name,
        description,
        price: parseInt(price),
        tier: parseInt(tier) || 1,
        isActive: true,
      }).returning();
      
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  // Update a plan (for creators)
  app.patch("/api/subscription-plans/:planId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.params;
      const { name, description, price, tier, isActive } = req.body;
      
      const [existingPlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!existingPlan || existingPlan.creatorId !== userId) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      const [updated] = await db
        .update(subscriptionPlans)
        .set({
          name: name ?? existingPlan.name,
          description: description ?? existingPlan.description,
          price: price !== undefined ? parseInt(price) : existingPlan.price,
          tier: tier !== undefined ? parseInt(tier) : existingPlan.tier,
          isActive: isActive !== undefined ? isActive : existingPlan.isActive,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  // Delete a plan (for creators)
  app.delete("/api/subscription-plans/:planId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.params;
      
      const [existingPlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!existingPlan || existingPlan.creatorId !== userId) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      // Soft delete - just mark as inactive
      await db
        .update(subscriptionPlans)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, planId));
      
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
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
      const { planId, planType } = req.body;

      // Get plan details if planId is provided
      let price = 500; // default
      let tier = 1;
      let planName = "monthly";
      
      if (planId) {
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId));
        
        if (!plan || plan.creatorId !== creatorId) {
          return res.status(404).json({ message: "Plan not found" });
        }
        
        price = plan.price;
        tier = plan.tier;
        planName = plan.name;
      } else {
        // Legacy support: use planType
        const SUBSCRIPTION_PRICES: Record<string, number> = {
          monthly: 500,
          yearly: 5000,
        };
        planName = planType === "yearly" ? "yearly" : "monthly";
        price = SUBSCRIPTION_PRICES[planName];
      }

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
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

      const [subscription] = await db.insert(subscriptions).values({
        userId,
        creatorId,
        planId: planId || null,
        planType: planName,
        tier,
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

  // Get user's point balance
  app.get("/api/user/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [profile] = await db
        .select({ points: userProfiles.points })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));
      
      if (!profile) {
        return res.json({ points: 0 });
      }
      res.json({ points: profile.points });
    } catch (error) {
      console.error("Error fetching user points:", error);
      res.status(500).json({ message: "Failed to fetch points" });
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

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { displayName, bio, avatarUrl, location, username } = req.body;

      // Check if profile exists
      const [existingProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      let updatedProfile;
      if (existingProfile) {
        // Update existing profile - preserve existing values if new ones not provided
        [updatedProfile] = await db
          .update(userProfiles)
          .set({
            username: username || existingProfile.username,
            displayName: displayName || existingProfile.displayName,
            bio: bio !== undefined ? bio : existingProfile.bio,
            avatarUrl: avatarUrl || existingProfile.avatarUrl,
            location: location !== undefined ? location : existingProfile.location,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, userId))
          .returning();
      } else {
        // Create new profile
        [updatedProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            username: username || null,
            displayName: displayName || "ユーザー",
            bio: bio || null,
            avatarUrl: avatarUrl || null,
            location: location || null,
          })
          .returning();
      }

      // If user is a creator, update creatorProfile displayName and bio only
      if (displayName || bio !== undefined) {
        await db
          .update(creatorProfiles)
          .set({
            displayName: displayName || undefined,
            bio: bio || undefined,
          })
          .where(eq(creatorProfiles.userId, userId));
      }

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "プロフィール更新に失敗しました" });
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

  // Stripe: Get publishable key
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ message: "Failed to get Stripe publishable key" });
    }
  });

  // Stripe: Create payment intent for point purchase (embedded checkout)
  app.post("/api/stripe/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { points, amount } = req.body;

      if (!points || !amount || points < 100) {
        return res.status(400).json({ message: "最低100ポイントから購入できます" });
      }

      const stripe = await getUncachableStripeClient();

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'jpy',
        metadata: {
          userId,
          points: points.toString(),
          type: 'point_purchase',
        },
        description: `Only-U ポイント購入 (${points.toLocaleString()} pt)`,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message || "決済の準備に失敗しました" });
    }
  });

  // Stripe: Handle successful payment (called from frontend after payment)
  app.post("/api/stripe/confirm-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment Intent ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "支払いが完了していません" });
      }

      if (paymentIntent.metadata?.userId !== userId) {
        return res.status(403).json({ message: "不正なリクエストです" });
      }

      const points = parseInt(paymentIntent.metadata?.points || '0', 10);
      if (points <= 0) {
        return res.status(400).json({ message: "Invalid points value" });
      }

      // Get user's current points
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      const currentPoints = profile?.points ?? 0;
      const newBalance = currentPoints + points;

      // Update user points
      if (profile) {
        await db
          .update(userProfiles)
          .set({ points: newBalance })
          .where(eq(userProfiles.userId, userId));
      } else {
        await db.insert(userProfiles).values({
          userId,
          points: points,
        });
      }

      // Record transaction
      await db.insert(pointTransactions).values({
        userId,
        amount: points,
        type: "purchase",
        description: `カード決済によるポイント購入 (${points.toLocaleString()} pt)`,
        balanceAfter: newBalance,
      });

      res.json({ 
        success: true, 
        points,
        newBalance,
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: error.message || "支払い確認に失敗しました" });
    }
  });

  return httpServer;
}
