import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./emailAuth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { setupWebRTCSignaling } from "./webrtc";
import { db } from "./db";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import nodemailer from "nodemailer";
import { 
  users, videos, liveStreams, products, conversations, messages, 
  notifications, creatorProfiles, follows, subscriptions, subscriptionPlans,
  userProfiles, creatorApplications, phoneVerificationCodes,
  videoLikes, liveViewingSessions, withdrawalRequests,
  bankTransferRequests, pointPackages, pointTransactions, purchases, comments,
  premiumPlans, adminUsers, siteSettings, adminNotifications,
  insertVideoSchema, insertProductSchema, insertLiveStreamSchema,
  insertUserProfileSchema, insertCreatorApplicationSchema, insertMessageSchema, insertCommentSchema,
  insertSubscriptionPlanSchema
} from "@shared/schema";
import { moderateImage, createModerationNotification } from "./services/content-moderation";
import bcrypt from "bcryptjs";
import { eq, desc, and, or, sql, gt, lt, isNull, inArray, ne } from "drizzle-orm";
import { generateImage } from "./modelslab";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

  // Get videos from followed creators - MUST be before /api/videos/:id to avoid matching "following" as an ID
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
      
      // AI content moderation (async, don't block response)
      if (video.thumbnailUrl) {
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
          : "http://localhost:5000";
        const imageUrl = video.thumbnailUrl.startsWith("http") 
          ? video.thumbnailUrl 
          : `${baseUrl}${video.thumbnailUrl}`;
        
        moderateImage(imageUrl).then(async (result) => {
          if (result.flagged) {
            const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId));
            await createModerationNotification(
              "video",
              video.id,
              video.title || "無題",
              userId,
              profile?.displayName || "不明",
              result
            );
          }
        }).catch(err => console.error("Video moderation error:", err));
      }
      
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
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
      
      // AI content moderation for thumbnail (async, don't block response)
      if (stream.thumbnailUrl) {
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
          : "http://localhost:5000";
        const imageUrl = stream.thumbnailUrl.startsWith("http") 
          ? stream.thumbnailUrl 
          : `${baseUrl}${stream.thumbnailUrl}`;
        
        moderateImage(imageUrl).then(async (result) => {
          if (result.flagged) {
            const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId));
            await createModerationNotification(
              "live",
              stream.id,
              stream.title || "無題",
              userId,
              profile?.displayName || "不明",
              result
            );
          }
        }).catch(err => console.error("Live stream moderation error:", err));
      }
      
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
        const [creatorUserProfile] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, stream.creatorId));

        if (creatorUserProfile) {
          await db
            .update(userProfiles)
            .set({ points: (creatorUserProfile.points || 0) + session.ratePerMinute })
            .where(eq(userProfiles.userId, stream.creatorId));
        }
        
        // Also update creator's earnings in creatorProfiles
        await db
          .update(creatorProfiles)
          .set({
            totalEarnings: sql`COALESCE(${creatorProfiles.totalEarnings}, 0) + ${session.ratePerMinute}`,
            availableBalance: sql`COALESCE(${creatorProfiles.availableBalance}, 0) + ${session.ratePerMinute}`,
          })
          .where(eq(creatorProfiles.userId, stream.creatorId));
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

  // Heartbeat endpoint for live broadcasters
  app.post("/api/live/:id/heartbeat", isAuthenticated, async (req: any, res) => {
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

      await db.update(liveStreams)
        .set({ lastHeartbeat: new Date() })
        .where(eq(liveStreams.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating heartbeat:", error);
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // Cleanup stale live streams (called periodically or on demand)
  const cleanupStaleLiveStreams = async () => {
    try {
      const staleThreshold = new Date(Date.now() - 30 * 1000); // 30 seconds without heartbeat
      
      const staleStreams = await db
        .select()
        .from(liveStreams)
        .where(
          and(
            eq(liveStreams.status, "live"),
            or(
              lt(liveStreams.lastHeartbeat, staleThreshold),
              sql`${liveStreams.lastHeartbeat} IS NULL AND ${liveStreams.startedAt} < ${staleThreshold}`
            )
          )
        );
      
      if (staleStreams.length > 0) {
        await db.update(liveStreams)
          .set({ status: "ended", endedAt: new Date() })
          .where(
            and(
              eq(liveStreams.status, "live"),
              or(
                lt(liveStreams.lastHeartbeat, staleThreshold),
                sql`${liveStreams.lastHeartbeat} IS NULL AND ${liveStreams.startedAt} < ${staleThreshold}`
              )
            )
          );
        console.log(`Cleaned up ${staleStreams.length} stale live streams`);
      }
    } catch (error) {
      console.error("Error cleaning up stale streams:", error);
    }
  };

  // Run cleanup every 15 seconds
  setInterval(cleanupStaleLiveStreams, 15000);

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
      
      // Get unread counts, last messages, and participant info for each conversation
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
          
          // Get the other participant's info
          const otherParticipantId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
          
          // Try to get from creator profiles first
          const [creatorInfo] = await db
            .select({
              displayName: creatorProfiles.displayName,
              avatarUrl: userProfiles.avatarUrl,
            })
            .from(creatorProfiles)
            .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
            .where(eq(creatorProfiles.userId, otherParticipantId))
            .limit(1);
          
          let participantName = "ユーザー";
          let participantAvatar: string | null = null;
          
          if (creatorInfo) {
            participantName = creatorInfo.displayName || "ユーザー";
            participantAvatar = creatorInfo.avatarUrl;
          } else {
            // Not a creator, try user profile then users table
            const [profileInfo] = await db
              .select({
                displayName: userProfiles.displayName,
                avatarUrl: userProfiles.avatarUrl,
              })
              .from(userProfiles)
              .where(eq(userProfiles.userId, otherParticipantId))
              .limit(1);
            
            if (profileInfo) {
              participantName = profileInfo.displayName || "ユーザー";
              participantAvatar = profileInfo.avatarUrl;
            } else {
              // Fall back to users table
              const [userInfo] = await db
                .select({
                  username: users.username,
                  avatarUrl: users.avatarUrl,
                })
                .from(users)
                .where(eq(users.id, otherParticipantId))
                .limit(1);
              
              if (userInfo) {
                participantName = userInfo.username || "ユーザー";
                participantAvatar = userInfo.avatarUrl;
              }
            }
          }
          
          return {
            ...conv,
            unreadCount: Number(unreadResult?.count || 0),
            lastMessageContent: lastMessage?.content || "",
            participantName,
            participantAvatar,
          };
        })
      );
      
      res.json(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const [userData] = await db
        .select({
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get single conversation with participant info
  app.get("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the other participant's info
      const otherParticipantId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      
      // First try to get from creator profiles (with avatar from user_profiles)
      const [creatorInfo] = await db
        .select({
          displayName: creatorProfiles.displayName,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(creatorProfiles)
        .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
        .where(eq(creatorProfiles.userId, otherParticipantId))
        .limit(1);
      
      // If not a creator, get from user_profiles then users table
      let participantInfo;
      if (creatorInfo) {
        participantInfo = {
          displayName: creatorInfo.displayName,
          avatarUrl: creatorInfo.avatarUrl,
          isCreator: true,
        };
      } else {
        // Try user profiles first
        const [profileInfo] = await db
          .select({
            displayName: userProfiles.displayName,
            avatarUrl: userProfiles.avatarUrl,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, otherParticipantId))
          .limit(1);
        
        if (profileInfo && profileInfo.displayName) {
          participantInfo = {
            displayName: profileInfo.displayName,
            avatarUrl: profileInfo.avatarUrl,
            isCreator: false,
          };
        } else {
          // Fall back to users table
          const [userData] = await db
            .select({
              username: users.username,
              avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(eq(users.id, otherParticipantId))
            .limit(1);
          
          participantInfo = {
            displayName: userData?.username || "ユーザー",
            avatarUrl: profileInfo?.avatarUrl || userData?.avatarUrl || null,
            isCreator: false,
          };
        }
      }
      
      res.json({
        ...conv,
        participantId: otherParticipantId,
        participantDisplayName: participantInfo.displayName,
        participantAvatarUrl: participantInfo.avatarUrl,
        participantIsCreator: participantInfo.isCreator,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
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

      // Update creator's earnings
      if (product.creatorId) {
        await db
          .update(creatorProfiles)
          .set({
            totalEarnings: sql`${creatorProfiles.totalEarnings} + ${product.price}`,
            availableBalance: sql`${creatorProfiles.availableBalance} + ${product.price}`,
          })
          .where(eq(creatorProfiles.userId, product.creatorId));
      }

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
      
      // Get live streaming earnings from viewing sessions
      const [liveEarnings] = await db
        .select({ total: sql<number>`COALESCE(SUM(${liveViewingSessions.totalPointsCharged}), 0)` })
        .from(liveViewingSessions)
        .innerJoin(liveStreams, eq(liveViewingSessions.liveStreamId, liveStreams.id))
        .where(eq(liveStreams.creatorId, userId));
      
      // Get product sales
      const productSales = await db
        .select({
          id: purchases.id,
          productId: purchases.productId,
          amount: purchases.price,
          status: purchases.status,
          createdAt: purchases.createdAt,
        })
        .from(purchases)
        .where(eq(purchases.creatorId, userId))
        .orderBy(desc(purchases.createdAt))
        .limit(50);
      
      // Get product details for sales
      const productIds = productSales.map(s => s.productId).filter(Boolean);
      const productDetails = productIds.length > 0 ? await db
        .select({
          id: products.id,
          name: products.name,
          productType: products.productType,
        })
        .from(products)
        .where(sql`${products.id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`) : [];
      
      const productMap = new Map(productDetails.map(p => [p.id, p]));
      
      const recentProductSales = productSales.map(sale => ({
        id: sale.id,
        productName: productMap.get(sale.productId)?.name || "商品",
        amount: sale.amount,
        status: sale.status,
        createdAt: sale.createdAt,
        productType: "shop" as const,
      }));
      
      // Get live streaming sessions for recent sales
      const liveSessions = await db
        .select({
          id: liveViewingSessions.id,
          totalPointsCharged: liveViewingSessions.totalPointsCharged,
          startedAt: liveViewingSessions.startedAt,
          streamTitle: liveStreams.title,
        })
        .from(liveViewingSessions)
        .innerJoin(liveStreams, eq(liveViewingSessions.liveStreamId, liveStreams.id))
        .where(and(
          eq(liveStreams.creatorId, userId),
          sql`${liveViewingSessions.totalPointsCharged} > 0`
        ))
        .orderBy(desc(liveViewingSessions.startedAt))
        .limit(50);
      
      const recentLiveSales = liveSessions.map(session => ({
        id: session.id,
        productName: session.streamTitle || "ライブ配信",
        amount: session.totalPointsCharged || 0,
        status: "completed",
        createdAt: session.startedAt,
        productType: "live" as const,
      }));
      
      // Get subscription transactions for recent sales
      const subscriptionTransactions = await db
        .select({
          id: pointTransactions.id,
          amount: pointTransactions.amount,
          description: pointTransactions.description,
          createdAt: pointTransactions.createdAt,
        })
        .from(pointTransactions)
        .where(and(
          eq(pointTransactions.userId, userId),
          eq(pointTransactions.type, "bonus"),
          sql`${pointTransactions.description} LIKE '%サブスク%'`
        ))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(50);
      
      const recentSubscriptionSales = subscriptionTransactions.map(tx => ({
        id: tx.id,
        productName: tx.description || "サブスクリプション",
        amount: tx.amount || 0,
        status: "completed",
        createdAt: tx.createdAt,
        productType: "subscription" as const,
      }));
      
      // Combine and sort by date
      const allRecentSales = [...recentProductSales, ...recentLiveSales, ...recentSubscriptionSales]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 20);
      
      // Get subscription earnings (from subscription payments)
      const subscriptionTotal = subscriptionTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      // Calculate product total
      const productTotal = productSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
      
      res.json({
        profile: creatorProfile,
        liveEarnings: liveEarnings?.total || 0,
        productEarnings: productTotal,
        subscriptionEarnings: subscriptionTotal,
        recentSales: allRecentSales,
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
      const { amount, type = "normal" } = req.body;
      
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
      const MIN_WITHDRAWAL = 10000;
      if (amount < MIN_WITHDRAWAL) {
        return res.status(400).json({ message: `Minimum withdrawal is ${MIN_WITHDRAWAL} points` });
      }
      
      // Calculate fees
      const transferFee = 330; // 振込手数料 330pt（税込）
      const systemFeeRate = 0.165; // システム利用料 16.5%（税込）
      const expressFeeRate = 0.088; // 早払い手数料 8.8%（税込）
      
      const systemFee = Math.floor(amount * systemFeeRate);
      const expressFee = type === "express" ? Math.floor(amount * expressFeeRate) : 0;
      const totalFee = systemFee + transferFee + expressFee;
      const netAmount = amount - totalFee;
      
      // Create withdrawal request
      const [withdrawal] = await db.insert(withdrawalRequests).values({
        creatorId: userId,
        amount,
        fee: totalFee,
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
      
      // First try to find by creatorProfiles.id
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
          isCreator: sql<boolean>`true`.as("isCreator"),
        })
        .from(creatorProfiles)
        .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
        .where(eq(creatorProfiles.id, id));
      
      // Then try by creatorProfiles.userId
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
            isCreator: sql<boolean>`true`.as("isCreator"),
          })
          .from(creatorProfiles)
          .leftJoin(userProfiles, eq(creatorProfiles.userId, userProfiles.userId))
          .where(eq(creatorProfiles.userId, id));
      }
      
      // If not a creator, try to get basic user profile
      if (result.length === 0) {
        const userResult = await db
          .select({
            id: userProfiles.id,
            userId: userProfiles.userId,
            displayName: userProfiles.displayName,
            bio: userProfiles.bio,
            avatarUrl: userProfiles.avatarUrl,
            username: userProfiles.username,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, id));
        
        if (userResult.length > 0) {
          const userProfile = userResult[0];
          return res.json({
            id: userProfile.id,
            userId: userProfile.userId,
            displayName: userProfile.displayName || userProfile.username || "ユーザー",
            bio: userProfile.bio || "",
            coverImageUrl: null,
            isVerified: false,
            followerCount: 0,
            followingCount: 0,
            postCount: 0,
            avatarUrl: userProfile.avatarUrl,
            username: userProfile.username,
            isCreator: false,
          });
        }
        
        // Last resort: try users table
        const [userData] = await db
          .select()
          .from(users)
          .where(eq(users.id, id));
        
        if (userData) {
          return res.json({
            id: userData.id,
            userId: userData.id,
            displayName: userData.username || "ユーザー",
            bio: "",
            coverImageUrl: null,
            isVerified: false,
            followerCount: 0,
            followingCount: 0,
            postCount: 0,
            avatarUrl: userData.avatarUrl,
            username: userData.username,
            isCreator: false,
          });
        }
        
        return res.status(404).json({ message: "User not found" });
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

  app.get("/api/creators/:id/likes", async (req, res) => {
    try {
      const { id } = req.params;
      const likedVideos = await db
        .select({
          id: videos.id,
          title: videos.title,
          thumbnailUrl: videos.thumbnailUrl,
          videoUrl: videos.videoUrl,
          viewCount: videos.viewCount,
          likeCount: videos.likeCount,
          creatorDisplayName: creatorProfiles.displayName,
        })
        .from(videoLikes)
        .innerJoin(videos, eq(videoLikes.videoId, videos.id))
        .leftJoin(creatorProfiles, eq(videos.creatorId, creatorProfiles.userId))
        .where(eq(videoLikes.userId, id))
        .orderBy(desc(videoLikes.createdAt))
        .limit(30);
      res.json(likedVideos);
    } catch (error) {
      console.error("Error fetching creator liked videos:", error);
      res.status(500).json({ message: "Failed to fetch liked videos" });
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
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          creatorId: subscriptions.creatorId,
          planId: subscriptions.planId,
          planType: subscriptions.planType,
          tier: subscriptions.tier,
          status: subscriptions.status,
          autoRenew: subscriptions.autoRenew,
          startedAt: subscriptions.startedAt,
          expiresAt: subscriptions.expiresAt,
          creatorDisplayName: creatorProfiles.displayName,
          creatorAvatarUrl: userProfiles.avatarUrl,
          planName: subscriptionPlans.name,
          planPrice: subscriptionPlans.price,
        })
        .from(subscriptions)
        .leftJoin(creatorProfiles, eq(subscriptions.creatorId, creatorProfiles.userId))
        .leftJoin(userProfiles, eq(subscriptions.creatorId, userProfiles.userId))
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
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
      
      const userSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, "active"),
          gt(subscriptions.expiresAt, now)
        ));
      
      // Get the highest tier subscription for backward compatibility
      const subscription = userSubscriptions.length > 0 
        ? userSubscriptions.reduce((max, sub) => sub.tier > max.tier ? sub : max, userSubscriptions[0])
        : null;
      
      res.json({ 
        isSubscribed: userSubscriptions.length > 0, 
        subscription,
        subscriptions: userSubscriptions,
        subscribedPlanIds: userSubscriptions.map(s => s.planId),
        subscriptionDetails: userSubscriptions.map(s => ({
          planId: s.planId,
          autoRenew: s.autoRenew,
          expiresAt: s.expiresAt
        }))
      });
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

      // Check if already subscribed to this specific plan
      if (planId) {
        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.creatorId, creatorId),
            eq(subscriptions.planId, planId),
            eq(subscriptions.status, "active")
          ));

        if (existingSub) {
          return res.status(400).json({ message: "このプランには既に加入しています" });
        }
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

      // Update creator's earnings
      await db
        .update(creatorProfiles)
        .set({ 
          totalEarnings: sql`COALESCE(${creatorProfiles.totalEarnings}, 0) + ${price}`,
          availableBalance: sql`COALESCE(${creatorProfiles.availableBalance}, 0) + ${price}`,
        })
        .where(eq(creatorProfiles.userId, creatorId));

      // Record subscription transaction for creator
      await db.insert(pointTransactions).values({
        userId: creatorId,
        type: "bonus",
        amount: price,
        description: `サブスク収益: ${planName}`,
      });

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

  // Cancel specific plan subscription (disables auto-renew)
  app.delete("/api/subscription/:creatorId/:planId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId, planId } = req.params;

      const [updatedSub] = await db
        .update(subscriptions)
        .set({ autoRenew: false })
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.planId, planId),
          eq(subscriptions.status, "active")
        ))
        .returning();

      if (!updatedSub) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      res.json({ 
        message: "Auto-renewal disabled", 
        expiresAt: updatedSub.expiresAt 
      });
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

      // If user is a creator, update creatorProfile displayName, bio, and externalLink
      const { externalLink } = req.body;
      if (displayName || bio !== undefined || externalLink !== undefined) {
        await db
          .update(creatorProfiles)
          .set({
            displayName: displayName || undefined,
            bio: bio || undefined,
            externalLink: externalLink !== undefined ? externalLink : undefined,
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

  // Update phone number in profile
  app.put("/api/profile/phone", isAuthenticated, async (req: any, res) => {
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

      const [updated] = await db
        .update(userProfiles)
        .set({ 
          phoneNumber: cleanPhone,
          updatedAt: new Date() 
        })
        .where(eq(userProfiles.userId, userId))
        .returning();

      if (!updated) {
        // Create profile if doesn't exist
        const [newProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            phoneNumber: cleanPhone,
          })
          .returning();
        return res.json(newProfile);
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating phone:", error);
      res.status(500).json({ message: "電話番号の登録に失敗しました" });
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

  // Save contact info (phone + email) without verification
  app.post("/api/creator-application/contact-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber, email } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "電話番号を入力してください" });
      }
      if (!email) {
        return res.status(400).json({ message: "メールアドレスを入力してください" });
      }

      // Validate phone number format (Japanese format)
      const cleanPhone = phoneNumber.replace(/[-\s]/g, "");
      if (!/^0[0-9]{9,10}$/.test(cleanPhone)) {
        return res.status(400).json({ message: "有効な電話番号を入力してください" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "有効なメールアドレスを入力してください" });
      }

      // Update application with contact info
      const [updated] = await db
        .update(creatorApplications)
        .set({
          phoneNumber: cleanPhone,
          email: email,
          contactInfoSavedAt: new Date(),
          currentStep: "document_submission",
        })
        .where(eq(creatorApplications.userId, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error saving contact info:", error);
      res.status(500).json({ message: "保存に失敗しました" });
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

  // Payment Methods routes
  app.get("/api/payment-methods", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stripe = await getUncachableStripeClient();
      
      // Get or create Stripe customer
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      // For now, return empty array - full implementation would require storing Stripe customer IDs
      // This is a placeholder for the payment methods page
      res.json([]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.delete("/api/payment-methods/:methodId", isAuthenticated, async (req: any, res) => {
    try {
      const { methodId } = req.params;
      // Placeholder - would detach payment method from Stripe customer
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  app.post("/api/payment-methods/:methodId/default", isAuthenticated, async (req: any, res) => {
    try {
      const { methodId } = req.params;
      // Placeholder - would set default payment method for Stripe customer
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "Failed to set default payment method" });
    }
  });

  // Premium Plan (高画質プラン) routes
  const PREMIUM_PLAN_PRICE = 980;

  app.get("/api/premium-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = new Date();
      
      const [plan] = await db
        .select()
        .from(premiumPlans)
        .where(and(
          eq(premiumPlans.userId, userId),
          eq(premiumPlans.isActive, true),
          or(
            isNull(premiumPlans.expiresAt),
            gt(premiumPlans.expiresAt, now)
          )
        ));
      
      res.json({ 
        hasPremium: !!plan, 
        plan: plan || null,
        price: PREMIUM_PLAN_PRICE 
      });
    } catch (error) {
      console.error("Error fetching premium plan:", error);
      res.status(500).json({ message: "Failed to fetch premium plan status" });
    }
  });

  app.post("/api/premium-plan/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = new Date();
      
      // Check if already subscribed
      const [existingPlan] = await db
        .select()
        .from(premiumPlans)
        .where(and(
          eq(premiumPlans.userId, userId),
          eq(premiumPlans.isActive, true),
          or(
            isNull(premiumPlans.expiresAt),
            gt(premiumPlans.expiresAt, now)
          )
        ));
      
      if (existingPlan) {
        return res.status(400).json({ message: "既に高画質プランに加入しています" });
      }

      // Check user points
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));
      
      const currentPoints = profile?.points || 0;
      if (currentPoints < PREMIUM_PLAN_PRICE) {
        return res.status(400).json({ 
          message: `ポイントが不足しています（必要: ${PREMIUM_PLAN_PRICE}pt、所持: ${currentPoints}pt）` 
        });
      }

      // Calculate expiry date (1 month from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Deduct points
      const newBalance = currentPoints - PREMIUM_PLAN_PRICE;
      await db
        .update(userProfiles)
        .set({ points: newBalance })
        .where(eq(userProfiles.userId, userId));

      // Record point transaction
      await db.insert(pointTransactions).values({
        userId,
        amount: -PREMIUM_PLAN_PRICE,
        type: "premium_plan",
        description: "高画質プラン加入（1ヶ月）",
        balance: newBalance,
      });

      // Create or update premium plan subscription
      const [existingInactive] = await db
        .select()
        .from(premiumPlans)
        .where(eq(premiumPlans.userId, userId));

      if (existingInactive) {
        await db
          .update(premiumPlans)
          .set({
            isActive: true,
            startedAt: now,
            expiresAt,
            price: PREMIUM_PLAN_PRICE,
          })
          .where(eq(premiumPlans.userId, userId));
      } else {
        await db.insert(premiumPlans).values({
          userId,
          isActive: true,
          price: PREMIUM_PLAN_PRICE,
          startedAt: now,
          expiresAt,
          autoRenew: true,
        });
      }

      res.json({ 
        success: true, 
        message: "高画質プランに加入しました",
        expiresAt,
        newBalance
      });
    } catch (error) {
      console.error("Error subscribing to premium plan:", error);
      res.status(500).json({ message: "加入処理に失敗しました" });
    }
  });

  app.delete("/api/premium-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [plan] = await db
        .select()
        .from(premiumPlans)
        .where(and(
          eq(premiumPlans.userId, userId),
          eq(premiumPlans.isActive, true)
        ));
      
      if (!plan) {
        return res.status(404).json({ message: "有効なプランが見つかりません" });
      }

      // Set auto-renew to false (plan remains active until expiry)
      await db
        .update(premiumPlans)
        .set({ autoRenew: false })
        .where(eq(premiumPlans.userId, userId));

      res.json({ 
        success: true, 
        message: "自動更新を停止しました。現在の期間終了後に解約されます。",
        expiresAt: plan.expiresAt
      });
    } catch (error) {
      console.error("Error canceling premium plan:", error);
      res.status(500).json({ message: "解約処理に失敗しました" });
    }
  });

  // ============ Settings API Endpoints ============

  // Personal info update
  app.patch("/api/creator-applications/personal-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { fullName, birthDate, gender, postalCode, prefecture, city, address, building } = req.body;

      const [existing] = await db
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.userId, userId));

      if (!existing) {
        // Create new application if none exists
        await db.insert(creatorApplications).values({
          userId,
          fullName,
          birthDate,
          gender,
          postalCode,
          prefecture,
          city,
          address,
          building,
          status: "draft",
        });
      } else {
        await db
          .update(creatorApplications)
          .set({ 
            fullName, 
            birthDate, 
            gender, 
            postalCode, 
            prefecture, 
            city, 
            address, 
            building
          })
          .where(eq(creatorApplications.userId, userId));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating personal info:", error);
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  // Phone verification - send code
  app.post("/api/verification/phone/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber } = req.body;
      
      // Store phone number in application
      const [existing] = await db
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.userId, userId));

      if (existing) {
        await db
          .update(creatorApplications)
          .set({ phoneNumber })
          .where(eq(creatorApplications.userId, userId));
      } else {
        await db.insert(creatorApplications).values({
          userId,
          phoneNumber,
          status: "draft",
        });
      }
      
      // For demo: just return success (would send SMS in production)
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending phone verification:", error);
      res.status(500).json({ message: "送信に失敗しました" });
    }
  });

  // Phone verification - verify code
  app.post("/api/verification/phone/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber, code } = req.body;
      
      // Demo: accept code 123456
      if (code !== "123456") {
        return res.status(400).json({ message: "認証コードが正しくありません" });
      }
      
      // Mark phone as verified
      await db
        .update(creatorApplications)
        .set({ 
          phoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: new Date()
        })
        .where(eq(creatorApplications.userId, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying phone:", error);
      res.status(500).json({ message: "認証に失敗しました" });
    }
  });

  // Email verification status
  app.get("/api/verification/email/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      // For now, consider email verified if user exists (registered with email)
      res.json({ 
        verified: true, // Email is verified since they registered
        email: user?.email 
      });
    } catch (error) {
      console.error("Error getting email status:", error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Send email verification code
  app.post("/api/verification/email/send", isAuthenticated, async (req: any, res) => {
    try {
      // For now, just return success (would send email in production)
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "送信に失敗しました" });
    }
  });

  // Verify email code
  app.post("/api/verification/email/verify", isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      // Demo: accept any 6-digit code
      if (code && code.length === 6) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "無効なコード" });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "認証に失敗しました" });
    }
  });

  // Notification settings
  app.get("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    // Return default settings (would be stored in DB in production)
    res.json({
      messages: true,
      likes: true,
      follows: true,
      purchases: true,
      liveStreams: true,
      email: true,
      push: true,
    });
  });

  app.patch("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    // Would save to DB in production
    res.json({ success: true });
  });

  // Privacy settings
  app.get("/api/privacy-settings", isAuthenticated, async (req: any, res) => {
    // Return default settings
    res.json({
      showOnlineStatus: true,
      allowMessages: true,
      showActivity: true,
    });
  });

  app.patch("/api/privacy-settings", isAuthenticated, async (req: any, res) => {
    // Would save to DB in production
    res.json({ success: true });
  });

  // Blocked users
  app.get("/api/blocked-users", isAuthenticated, async (req: any, res) => {
    // Return empty list (would query DB in production)
    res.json([]);
  });

  app.delete("/api/blocked-users/:userId", isAuthenticated, async (req: any, res) => {
    // Would remove from DB in production
    res.json({ success: true });
  });

  // Contact form submission
  app.post("/api/contact", isAuthenticated, async (req: any, res) => {
    try {
      const { category, email, subject, message } = req.body;
      
      if (!category || !email || !message) {
        return res.status(400).json({ message: "必須項目を入力してください" });
      }
      
      const categoryLabels: Record<string, string> = {
        account: "アカウントについて",
        payment: "決済・ポイントについて",
        creator: "クリエイター機能について",
        content: "コンテンツについて",
        bug: "不具合・バグ報告",
        other: "その他",
      };
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: "info@only-u.fun",
        replyTo: email,
        subject: `[Only-U お問い合わせ] ${categoryLabels[category] || category}${subject ? `: ${subject}` : ""}`,
        text: `カテゴリ: ${categoryLabels[category] || category}\n送信者: ${email}\n件名: ${subject || "なし"}\n\n${message}`,
        html: `
          <h3>Only-U お問い合わせ</h3>
          <p><strong>カテゴリ:</strong> ${categoryLabels[category] || category}</p>
          <p><strong>送信者:</strong> ${email}</p>
          <p><strong>件名:</strong> ${subject || "なし"}</p>
          <hr />
          <p>${message.replace(/\n/g, "<br />")}</p>
        `,
      };
      
      await transporter.sendMail(mailOptions);
      console.log("Contact email sent successfully to info@only-u.fun");
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending contact email:", error);
      res.status(500).json({ message: "送信に失敗しました" });
    }
  });

  // Account deletion
  app.delete("/api/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Delete user data from various tables in order of dependencies
      // Using individual try-catch to ensure partial cleanup doesn't fail the whole operation
      const deletions = [
        () => db.delete(premiumPlans).where(eq(premiumPlans.userId, userId)),
        () => db.delete(notifications).where(eq(notifications.userId, userId)),
        () => db.delete(subscriptions).where(eq(subscriptions.userId, userId)),
        () => db.delete(follows).where(or(eq(follows.followerId, userId), eq(follows.followingId, userId))),
        () => db.delete(creatorApplications).where(eq(creatorApplications.userId, userId)),
        () => db.delete(creatorProfiles).where(eq(creatorProfiles.userId, userId)),
        () => db.delete(userProfiles).where(eq(userProfiles.userId, userId)),
      ];
      
      for (const deletion of deletions) {
        try {
          await deletion();
        } catch (e) {
          console.warn("Deletion step failed (continuing):", e);
        }
      }
      
      // Finally delete the user
      await db.delete(users).where(eq(users.id, userId));
      
      // Destroy session
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) console.error("Session destroy error:", err);
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "アカウント削除に失敗しました" });
    }
  });

  // Auto-renewal processing for subscriptions
  async function processSubscriptionRenewals() {
    try {
      const now = new Date();
      
      // Find expired subscriptions with autoRenew enabled (only non-null expiresAt)
      const expiredSubscriptions = await db
        .select({
          subscription: subscriptions,
          plan: subscriptionPlans,
        })
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.status, "active"),
          eq(subscriptions.autoRenew, true),
          sql`${subscriptions.expiresAt} IS NOT NULL`,
          lt(subscriptions.expiresAt, now)
        ));

      for (const { subscription, plan } of expiredSubscriptions) {
        const price = plan?.price || 500;
        
        // Get user's point balance
        const [user] = await db.select().from(users).where(eq(users.id, subscription.userId));
        if (!user) continue;

        const userPoints = user.points || 0;

        if (userPoints >= price) {
          // Deduct points and renew subscription
          await db.update(users)
            .set({ points: userPoints - price })
            .where(eq(users.id, subscription.userId));

          // Record transaction
          await db.insert(pointTransactions).values({
            userId: subscription.userId,
            amount: -price,
            type: "spend",
            description: `サブスク自動更新: ${plan?.name || "月額プラン"}`,
            relatedId: subscription.id,
          });

          // Extend subscription by 30 days
          const newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + 30);

          await db.update(subscriptions)
            .set({ expiresAt: newExpiresAt })
            .where(eq(subscriptions.id, subscription.id));

          console.log(`Auto-renewed subscription ${subscription.id} for user ${subscription.userId}`);
        } else {
          // Not enough points - mark as expired
          await db.update(subscriptions)
            .set({ status: "expired" })
            .where(eq(subscriptions.id, subscription.id));

          // Create notification
          await db.insert(notifications).values({
            userId: subscription.userId,
            type: "subscription",
            title: "サブスク更新失敗",
            message: `ポイント不足のため「${plan?.name || "月額プラン"}」の自動更新ができませんでした。`,
          });

          console.log(`Subscription ${subscription.id} expired due to insufficient points`);
        }
      }
    } catch (error) {
      console.error("Error processing subscription renewals:", error);
    }
  }

  // Run renewal check every hour
  setInterval(processSubscriptionRenewals, 60 * 60 * 1000);
  // Also run once on startup after a short delay
  setTimeout(processSubscriptionRenewals, 30 * 1000);

  // ==================== ADMIN AUTHENTICATION ====================
  
  // Admin login
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "メールアドレスとパスワードを入力してください" });
      }
      
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email));
      
      if (!admin) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }
      
      if (!admin.isActive) {
        return res.status(403).json({ message: "このアカウントは無効です" });
      }
      
      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }
      
      // Update last login
      await db.update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id));
      
      // Regenerate session for security
      const oldSession = req.session;
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
        }
        // Restore any needed session data
        (req.session as any).adminId = admin.id;
        (req.session as any).adminEmail = admin.email;
        (req.session as any).isAdminAuthenticated = true;
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "セッション保存に失敗しました" });
          }
          
          res.json({ 
            success: true, 
            admin: { 
              id: admin.id, 
              email: admin.email, 
              name: admin.name 
            } 
          });
        });
      });
      
      return; // Early return since response is sent in callback
      
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });
  
  // Admin logout
  app.post("/api/admin/auth/logout", (req, res) => {
    (req.session as any).adminId = null;
    (req.session as any).adminEmail = null;
    (req.session as any).isAdminAuthenticated = false;
    res.json({ success: true });
  });
  
  // Check admin session
  app.get("/api/admin/auth/me", (req, res) => {
    if ((req.session as any).isAdminAuthenticated) {
      res.json({
        authenticated: true,
        admin: {
          id: (req.session as any).adminId,
          email: (req.session as any).adminEmail
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  });
  
  // Admin session middleware
  function isAdminSession(req: any, res: any, next: any) {
    if ((req.session as any).isAdminAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: "管理者ログインが必要です" });
    }
  }
  
  // Admin dashboard stats
  app.get("/api/admin/dashboard/stats", isAdminSession, async (req, res) => {
    try {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [creatorCount] = await db.select({ count: sql<number>`count(*)` }).from(creatorProfiles);
      const [pendingApps] = await db.select({ count: sql<number>`count(*)` }).from(creatorApplications).where(eq(creatorApplications.status, "pending"));
      const [pendingTransfers] = await db.select({ count: sql<number>`count(*)` }).from(bankTransferRequests).where(eq(bankTransferRequests.status, "pending"));
      const [videoCount] = await db.select({ count: sql<number>`count(*)` }).from(videos);
      const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
      const [pendingWithdrawals] = await db.select({ count: sql<number>`count(*)` }).from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending"));
      const [activeLiveStreams] = await db.select({ count: sql<number>`count(*)` }).from(liveStreams).where(eq(liveStreams.status, "live"));
      
      res.json({
        totalUsers: Number(userCount?.count || 0),
        totalCreators: Number(creatorCount?.count || 0),
        pendingApplications: Number(pendingApps?.count || 0),
        pendingTransfers: Number(pendingTransfers?.count || 0),
        totalVideos: Number(videoCount?.count || 0),
        totalProducts: Number(productCount?.count || 0),
        pendingWithdrawals: Number(pendingWithdrawals?.count || 0),
        activeLiveStreams: Number(activeLiveStreams?.count || 0),
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "データの取得に失敗しました" });
    }
  });
  
  // Get all users for admin
  app.get("/api/admin/users", isAdminSession, async (req, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: userProfiles.username,
          email: users.email,
          createdAt: users.createdAt,
          points: userProfiles.points,
          displayName: userProfiles.displayName,
          avatarUrl: userProfiles.avatarUrl,
          isCreator: creatorProfiles.id,
          creatorEarnings: creatorProfiles.totalEarnings,
          creatorBalance: creatorProfiles.availableBalance,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
        .orderBy(desc(users.createdAt));
      
      res.json(allUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "ユーザー一覧の取得に失敗しました" });
    }
  });
  
  // Get user details
  app.get("/api/admin/users/:id", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, id));
      
      const [creatorProfile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, id));
      
      res.json({ user, profile, creatorProfile });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });
  
  // Update user points (admin)
  app.post("/api/admin/users/:id/points", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { points, reason } = req.body;
      
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, id));
      
      if (!profile) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      const newPoints = (profile.points || 0) + points;
      await db.update(userProfiles)
        .set({ points: newPoints })
        .where(eq(userProfiles.userId, id));
      
      // Record transaction
      await db.insert(pointTransactions).values({
        userId: id,
        amount: points,
        balance: newPoints,
        type: points > 0 ? "bonus" : "spend",
        description: reason || "管理者による調整",
      });
      
      res.json({ success: true, newPoints });
    } catch (error) {
      console.error("Update points error:", error);
      res.status(500).json({ message: "ポイント更新に失敗しました" });
    }
  });

  // Delete user (admin)
  app.delete("/api/admin/users/:id", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete related data in order
      await db.delete(pointTransactions).where(eq(pointTransactions.userId, id));
      await db.delete(notifications).where(eq(notifications.userId, id));
      await db.delete(messages).where(eq(messages.senderId, id));
      await db.delete(follows).where(or(eq(follows.followerId, id), eq(follows.followingId, id)));
      await db.delete(subscriptions).where(eq(subscriptions.userId, id));
      await db.delete(purchases).where(eq(purchases.userId, id));
      await db.delete(videoLikes).where(eq(videoLikes.userId, id));
      await db.delete(comments).where(eq(comments.userId, id));
      await db.delete(liveViewingSessions).where(eq(liveViewingSessions.userId, id));
      await db.delete(bankTransferRequests).where(eq(bankTransferRequests.userId, id));
      await db.delete(withdrawalRequests).where(eq(withdrawalRequests.creatorId, id));
      await db.delete(creatorApplications).where(eq(creatorApplications.userId, id));
      await db.delete(creatorProfiles).where(eq(creatorProfiles.userId, id));
      await db.delete(userProfiles).where(eq(userProfiles.userId, id));
      await db.delete(users).where(eq(users.id, id));
      
      res.json({ success: true, message: "ユーザーを削除しました" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "ユーザー削除に失敗しました" });
    }
  });
  
  // Creator applications (admin session)
  app.get("/api/admin/applications", isAdminSession, async (req, res) => {
    try {
      const { status } = req.query;
      let applications;
      
      if (status && ["pending", "approved", "rejected"].includes(status as string)) {
        applications = await db
          .select()
          .from(creatorApplications)
          .where(eq(creatorApplications.status, status as "pending" | "approved" | "rejected"))
          .orderBy(desc(creatorApplications.submittedAt));
      } else {
        applications = await db
          .select()
          .from(creatorApplications)
          .orderBy(desc(creatorApplications.submittedAt));
      }
      
      // Add username from userProfiles
      const applicationsWithUsername = await Promise.all(
        applications.map(async (app) => {
          const [profile] = await db
            .select({ username: userProfiles.username, displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.userId, app.userId));
          return {
            ...app,
            username: profile?.username || profile?.displayName || null,
          };
        })
      );
      
      res.json(applicationsWithUsername);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "申請一覧の取得に失敗しました" });
    }
  });
  
  // Approve/reject application (admin session)
  app.patch("/api/admin/applications/:id/decision", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const adminId = (req.session as any).adminId;
      
      const [application] = await db
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.id, id));
      
      if (!application) {
        return res.status(404).json({ message: "申請が見つかりません" });
      }
      
      await db.update(creatorApplications)
        .set({
          status: decision,
          adminNotes: notes,
          reviewedAt: new Date(),
          reviewerId: adminId,
        })
        .where(eq(creatorApplications.id, id));
      
      // If approved, create creator profile
      if (decision === "approved") {
        const [existingProfile] = await db
          .select()
          .from(creatorProfiles)
          .where(eq(creatorProfiles.userId, application.userId));
        
        if (!existingProfile) {
          await db.insert(creatorProfiles).values({
            userId: application.userId,
            displayName: application.fullName || "クリエイター",
            bio: "",
          });
        }
        
        // Update user role
        await db.update(users)
          .set({ role: "creator" })
          .where(eq(users.id, application.userId));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Application decision error:", error);
      res.status(500).json({ message: "処理に失敗しました" });
    }
  });
  
  // Bank transfers (admin session)
  app.get("/api/admin/transfers", isAdminSession, async (req, res) => {
    try {
      const { status } = req.query;
      let transfers;
      
      if (status) {
        transfers = await db
          .select()
          .from(bankTransferRequests)
          .where(eq(bankTransferRequests.status, status as string))
          .orderBy(desc(bankTransferRequests.createdAt));
      } else {
        transfers = await db
          .select()
          .from(bankTransferRequests)
          .orderBy(desc(bankTransferRequests.createdAt));
      }
      
      // Add user display names
      const transfersWithNames = await Promise.all(
        transfers.map(async (transfer) => {
          const [profile] = await db
            .select({ displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.userId, transfer.userId));
          return {
            ...transfer,
            userName: profile?.displayName || "不明なユーザー",
          };
        })
      );
      
      res.json(transfersWithNames);
    } catch (error) {
      console.error("Get transfers error:", error);
      res.status(500).json({ message: "振込一覧の取得に失敗しました" });
    }
  });
  
  // Confirm bank transfer (admin session)
  app.post("/api/admin/transfers/:id/confirm", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any).adminId;
      
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
      
      // Get user profile
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, request.userId));
      
      if (!profile) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      // Add points
      const newPoints = (profile.points || 0) + request.points;
      await db.update(userProfiles)
        .set({ points: newPoints })
        .where(eq(userProfiles.userId, request.userId));
      
      // Update request status
      await db.update(bankTransferRequests)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          confirmedBy: adminId,
        })
        .where(eq(bankTransferRequests.id, id));
      
      // Record transaction
      await db.insert(pointTransactions).values({
        userId: request.userId,
        amount: request.points,
        balance: newPoints,
        type: "purchase_bank",
        description: `銀行振込: ${request.transferName}`,
      });
      
      res.json({ success: true, newPoints });
    } catch (error) {
      console.error("Confirm transfer error:", error);
      res.status(500).json({ message: "処理に失敗しました" });
    }
  });
  
  // Reject bank transfer
  app.post("/api/admin/transfers/:id/reject", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      await db.update(bankTransferRequests)
        .set({
          status: "rejected",
          rejectionReason: reason,
        })
        .where(eq(bankTransferRequests.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Reject transfer error:", error);
      res.status(500).json({ message: "処理に失敗しました" });
    }
  });

  // Get all videos for admin
  app.get("/api/admin/videos", isAdminSession, async (req, res) => {
    try {
      const allVideos = await db
        .select({
          id: videos.id,
          title: videos.title,
          thumbnailUrl: videos.thumbnailUrl,
          creatorId: videos.creatorId,
          viewCount: videos.viewCount,
          likeCount: videos.likeCount,
          contentType: videos.contentType,
          createdAt: videos.createdAt,
        })
        .from(videos)
        .orderBy(desc(videos.createdAt));
      
      // Get creator names
      const videosWithCreatorNames = await Promise.all(
        allVideos.map(async (video) => {
          const [creator] = await db
            .select({ displayName: creatorProfiles.displayName })
            .from(creatorProfiles)
            .where(eq(creatorProfiles.userId, video.creatorId));
          return {
            ...video,
            isPremium: video.contentType !== "free",
            creatorName: creator?.displayName || "Unknown",
          };
        })
      );
      
      res.json(videosWithCreatorNames);
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ message: "動画一覧の取得に失敗しました" });
    }
  });

  // Delete a video (admin)
  app.delete("/api/admin/videos/:id", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete related comments first
      await db.delete(comments).where(eq(comments.videoId, id));
      
      // Delete the video
      await db.delete(videos).where(eq(videos.id, id));
      
      res.json({ success: true, message: "動画を削除しました" });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({ message: "動画の削除に失敗しました" });
    }
  });

  // Get all products for admin
  app.get("/api/admin/products", isAdminSession, async (req, res) => {
    try {
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          price: products.price,
          creatorId: products.creatorId,
          stock: products.stock,
          productType: products.productType,
          createdAt: products.createdAt,
        })
        .from(products)
        .orderBy(desc(products.createdAt));
      
      // Get creator names and sales data
      const productsWithDetails = await Promise.all(
        allProducts.map(async (product) => {
          const [creator] = await db
            .select({ displayName: creatorProfiles.displayName })
            .from(creatorProfiles)
            .where(eq(creatorProfiles.userId, product.creatorId));
          
          // Calculate total sales for this product
          const [salesData] = await db
            .select({ 
              totalSales: sql<number>`COALESCE(SUM(${purchases.price}), 0)::int`,
              salesCount: sql<number>`COUNT(*)::int`
            })
            .from(purchases)
            .where(eq(purchases.productId, product.id));
          
          return {
            ...product,
            creatorName: creator?.displayName || "Unknown",
            totalEarnings: salesData?.totalSales || 0,
            salesCount: salesData?.salesCount || 0,
          };
        })
      );
      
      res.json(productsWithDetails);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "商品一覧の取得に失敗しました" });
    }
  });

  // Delete a product (admin)
  app.delete("/api/admin/products/:id", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete related purchases first
      await db.delete(purchases).where(eq(purchases.productId, id));
      
      // Delete the product
      await db.delete(products).where(eq(products.id, id));
      
      res.json({ success: true, message: "商品を削除しました" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "商品の削除に失敗しました" });
    }
  });

  // Get all orders for admin (shop management)
  app.get("/api/admin/orders", isAdminSession, async (req, res) => {
    try {
      const allOrders = await db
        .select({
          id: purchases.id,
          userId: purchases.userId,
          productId: purchases.productId,
          creatorId: purchases.creatorId,
          price: purchases.price,
          status: purchases.status,
          shippingName: purchases.shippingName,
          shippingPostalCode: purchases.shippingPostalCode,
          shippingAddress: purchases.shippingAddress,
          shippingPhone: purchases.shippingPhone,
          createdAt: purchases.createdAt,
          productName: products.name,
          productType: products.productType,
          productImageUrl: products.imageUrl,
        })
        .from(purchases)
        .leftJoin(products, eq(purchases.productId, products.id))
        .orderBy(desc(purchases.createdAt))
        .limit(200);
      
      // Get buyer and creator names
      const ordersWithNames = await Promise.all(
        allOrders.map(async (order) => {
          const [buyer] = await db
            .select({ displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.userId, order.userId));
          const [creator] = order.creatorId ? await db
            .select({ displayName: creatorProfiles.displayName })
            .from(creatorProfiles)
            .where(eq(creatorProfiles.userId, order.creatorId)) : [null];
          return {
            ...order,
            buyerName: buyer?.displayName || "不明",
            creatorName: creator?.displayName || "不明",
          };
        })
      );
      
      res.json(ordersWithNames);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "注文一覧の取得に失敗しました" });
    }
  });

  // Update order status (for physical products shipping)
  app.patch("/api/admin/orders/:id/status", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "shipped", "completed"].includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }
      
      await db.update(purchases)
        .set({ status })
        .where(eq(purchases.id, id));
      
      res.json({ success: true, message: "ステータスを更新しました" });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "ステータスの更新に失敗しました" });
    }
  });

  // Get all live streams for admin
  app.get("/api/admin/livestreams", isAdminSession, async (req, res) => {
    try {
      const allLiveStreams = await db
        .select({
          id: liveStreams.id,
          title: liveStreams.title,
          thumbnailUrl: liveStreams.thumbnailUrl,
          creatorId: liveStreams.creatorId,
          status: liveStreams.status,
          viewerCount: liveStreams.viewerCount,
          startedAt: liveStreams.startedAt,
        })
        .from(liveStreams)
        .orderBy(desc(liveStreams.createdAt));
      
      // Get creator names
      const streamsWithCreatorNames = await Promise.all(
        allLiveStreams.map(async (stream) => {
          const [creator] = await db
            .select({ displayName: creatorProfiles.displayName })
            .from(creatorProfiles)
            .where(eq(creatorProfiles.userId, stream.creatorId));
          return {
            ...stream,
            creatorName: creator?.displayName || "Unknown",
          };
        })
      );
      
      res.json(streamsWithCreatorNames);
    } catch (error) {
      console.error("Get livestreams error:", error);
      res.status(500).json({ message: "ライブ配信一覧の取得に失敗しました" });
    }
  });

  // Stop a live stream (admin)
  app.post("/api/admin/livestreams/:id/stop", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, id));
      
      if (!stream) {
        return res.status(404).json({ message: "配信が見つかりません" });
      }
      
      await db.update(liveStreams)
        .set({ 
          status: "ended",
          endedAt: new Date(),
        })
        .where(eq(liveStreams.id, id));
      
      res.json({ success: true, message: "配信を強制終了しました" });
    } catch (error) {
      console.error("Stop livestream error:", error);
      res.status(500).json({ message: "配信の終了に失敗しました" });
    }
  });

  // Delete a live stream (admin)
  app.delete("/api/admin/livestreams/:id", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete related viewing sessions first
      await db.delete(liveViewingSessions).where(eq(liveViewingSessions.liveStreamId, id));
      
      // Delete the stream
      await db.delete(liveStreams).where(eq(liveStreams.id, id));
      
      res.json({ success: true, message: "配信を削除しました" });
    } catch (error) {
      console.error("Delete livestream error:", error);
      res.status(500).json({ message: "配信の削除に失敗しました" });
    }
  });

  // Content moderation alerts API
  app.get("/api/admin/moderation", isAdminSession, async (req, res) => {
    try {
      const allAlerts = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.type, "content_moderation"))
        .orderBy(desc(adminNotifications.createdAt))
        .limit(100);
      res.json(allAlerts);
    } catch (error) {
      console.error("Get moderation alerts error:", error);
      res.status(500).json({ message: "審査アラートの取得に失敗しました" });
    }
  });

  // Get unread moderation alert count
  app.get("/api/admin/moderation/unread-count", isAdminSession, async (req, res) => {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminNotifications)
        .where(and(
          eq(adminNotifications.type, "content_moderation"),
          eq(adminNotifications.isRead, false)
        ));
      res.json({ count: result?.count || 0 });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "審査アラート数の取得に失敗しました" });
    }
  });

  // Mark moderation alert as read
  app.patch("/api/admin/moderation/:id/read", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(adminNotifications)
        .set({ isRead: true })
        .where(eq(adminNotifications.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark alert read error:", error);
      res.status(500).json({ message: "アラートの更新に失敗しました" });
    }
  });

  // Mark all moderation alerts as read
  app.patch("/api/admin/moderation/read-all", isAdminSession, async (req, res) => {
    try {
      await db.update(adminNotifications)
        .set({ isRead: true })
        .where(eq(adminNotifications.isRead, false));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ message: "アラートの更新に失敗しました" });
    }
  });

  // Take action on flagged content
  app.patch("/api/admin/moderation/:id/action", isAdminSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // "approved", "rejected", "deleted"
      const adminId = req.session?.adminId || "admin";
      
      const [notification] = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.id, id));
      
      if (!notification) {
        return res.status(404).json({ message: "通知が見つかりません" });
      }

      // Update the notification
      await db.update(adminNotifications)
        .set({ 
          isRead: true,
          actionTaken: action,
          actionBy: adminId,
          actionAt: new Date(),
        })
        .where(eq(adminNotifications.id, id));

      // If deleting, actually delete the content
      if (action === "deleted" && notification.contentId) {
        if (notification.contentType === "video") {
          await db.delete(videos).where(eq(videos.id, notification.contentId));
        } else if (notification.contentType === "live") {
          await db.delete(liveViewingSessions).where(eq(liveViewingSessions.liveStreamId, notification.contentId));
          await db.delete(liveStreams).where(eq(liveStreams.id, notification.contentId));
        } else if (notification.contentType === "product") {
          await db.delete(products).where(eq(products.id, notification.contentId));
        }
      }

      res.json({ success: true, message: `コンテンツを${action === "approved" ? "承認" : action === "rejected" ? "非承認" : "削除"}しました` });
    } catch (error) {
      console.error("Take action error:", error);
      res.status(500).json({ message: "アクションの実行に失敗しました" });
    }
  });

  // Get all withdrawal requests for admin
  app.get("/api/admin/withdrawals", isAdminSession, async (req, res) => {
    try {
      const allWithdrawals = await db
        .select({
          id: withdrawalRequests.id,
          creatorId: withdrawalRequests.creatorId,
          amount: withdrawalRequests.amount,
          fee: withdrawalRequests.fee,
          netAmount: withdrawalRequests.netAmount,
          bankName: withdrawalRequests.bankName,
          bankBranchName: withdrawalRequests.bankBranchName,
          bankAccountType: withdrawalRequests.bankAccountType,
          bankAccountNumber: withdrawalRequests.bankAccountNumber,
          bankAccountHolder: withdrawalRequests.bankAccountHolder,
          status: withdrawalRequests.status,
          isEarly: withdrawalRequests.isEarly,
          createdAt: withdrawalRequests.createdAt,
          processedAt: withdrawalRequests.processedAt,
        })
        .from(withdrawalRequests)
        .orderBy(desc(withdrawalRequests.createdAt));
      
      // Get user names and creator application info
      const withdrawalsWithUserInfo = await Promise.all(
        allWithdrawals.map(async (withdrawal) => {
          const [profile] = await db
            .select({ displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.userId, withdrawal.creatorId));
          
          // Get creator application info
          const [application] = await db
            .select({
              id: creatorApplications.id,
              fullName: creatorApplications.fullName,
              phoneNumber: creatorApplications.phoneNumber,
              portfolioUrl: creatorApplications.portfolioUrl,
            })
            .from(creatorApplications)
            .where(eq(creatorApplications.userId, withdrawal.creatorId));
          
          return {
            ...withdrawal,
            userName: profile?.displayName || "Unknown",
            creatorApplication: application || null,
          };
        })
      );
      
      res.json(withdrawalsWithUserInfo);
    } catch (error) {
      console.error("Get withdrawals error:", error);
      res.status(500).json({ message: "出金申請一覧の取得に失敗しました" });
    }
  });

  // Approve withdrawal request
  app.post("/api/admin/withdrawals/:id/approve", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, id));
      
      if (!withdrawal) {
        return res.status(404).json({ message: "出金申請が見つかりません" });
      }
      
      if (withdrawal.status !== "pending") {
        return res.status(400).json({ message: "この申請は既に処理されています" });
      }
      
      await db.update(withdrawalRequests)
        .set({
          status: "completed",
          processedAt: new Date(),
        })
        .where(eq(withdrawalRequests.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Approve withdrawal error:", error);
      res.status(500).json({ message: "処理に失敗しました" });
    }
  });

  // Reject withdrawal request
  app.post("/api/admin/withdrawals/:id/reject", isAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, id));
      
      if (!withdrawal) {
        return res.status(404).json({ message: "出金申請が見つかりません" });
      }
      
      if (withdrawal.status !== "pending") {
        return res.status(400).json({ message: "この申請は既に処理されています" });
      }
      
      // Return points to creator's balance
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, withdrawal.creatorId));
      
      if (profile) {
        const newPoints = (profile.points || 0) + withdrawal.amount;
        await db.update(userProfiles)
          .set({ points: newPoints })
          .where(eq(userProfiles.userId, withdrawal.creatorId));
      }
      
      await db.update(withdrawalRequests)
        .set({
          status: "rejected",
          adminNotes: reason || "却下されました",
        })
        .where(eq(withdrawalRequests.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Reject withdrawal error:", error);
      res.status(500).json({ message: "処理に失敗しました" });
    }
  });

  // Get sales statistics for admin
  app.get("/api/admin/sales", isAdminSession, async (req, res) => {
    try {
      // ========== クリエイター売上内訳 ==========
      
      // サブスクリプション売上 (subscriptionsテーブルからプラン価格を集計)
      const subscriptionRevenue = await db
        .select({ total: sql<number>`COALESCE(SUM(${subscriptionPlans.price}), 0)` })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id));
      
      // 自社サブスク売上 (高画質プラン等のプラットフォームサブスク)
      const platformSubscriptionRevenue = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(ABS(amount)), 0)`,
          count: sql<number>`COUNT(*)`
        })
        .from(pointTransactions)
        .where(eq(pointTransactions.type, "premium_plan"));
      
      // ライブ売上 (from live viewing sessions)
      const liveRevenue = await db
        .select({ total: sql<number>`COALESCE(SUM(total_points_charged), 0)` })
        .from(liveViewingSessions)
        .where(sql`total_points_charged > 0`);
      
      // ショップ売上 (from purchases)
      const shopRevenue = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(price), 0)`,
          count: sql<number>`COUNT(*)`
        })
        .from(purchases)
        .where(eq(purchases.status, "completed"));
      
      const subscriptionTotal = Number(subscriptionRevenue[0]?.total || 0);
      const liveTotal = Number(liveRevenue[0]?.total || 0);
      const shopTotal = Number(shopRevenue[0]?.total || 0);
      const shopCount = Number(shopRevenue[0]?.count || 0);
      const platformSubscriptionTotal = Number(platformSubscriptionRevenue[0]?.total || 0);
      const platformSubscriptionCount = Number(platformSubscriptionRevenue[0]?.count || 0);
      
      // クリエイター総売上
      const creatorTotalRevenue = subscriptionTotal + liveTotal + shopTotal;
      
      // ========== クリエイター支払い経費 ==========
      // 手数料はクリエイター総売上に基づいて計算（売上発生時点で発生する費用）
      
      // Get withdrawal statistics for transfer fees
      const withdrawalStats = await db
        .select({ 
          count: sql<number>`COUNT(*)`,
          earlyCount: sql<number>`COALESCE(SUM(CASE WHEN is_early = true THEN 1 ELSE 0 END), 0)`,
          earlyAmount: sql<number>`COALESCE(SUM(CASE WHEN is_early = true THEN amount ELSE 0 END), 0)`,
          totalAmount: sql<number>`COALESCE(SUM(amount), 0)`
        })
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.status, "completed"));
      
      const completedWithdrawals = Number(withdrawalStats[0]?.count || 0);
      const earlyPaymentCount = Number(withdrawalStats[0]?.earlyCount || 0);
      const earlyAmount = Number(withdrawalStats[0]?.earlyAmount || 0);
      
      // 手数料計算の基準はクリエイター総売上
      const feeBaseAmount = creatorTotalRevenue;
      
      // システム利用料 15% (全クリエイター売上に対して)
      const systemFee = Math.floor(feeBaseAmount * 0.15);
      // システム利用料の消費税 (手数料の10%)
      const systemFeeTax = Math.floor(systemFee * 0.10);
      
      // 早払い手数料 8% (早払い申請分のみに対して)
      const earlyPaymentFee = Math.floor(earlyAmount * 0.08);
      // 早払い手数料の消費税 (手数料の10%)
      const earlyPaymentFeeTax = Math.floor(earlyPaymentFee * 0.10);
      
      // 振込手数料 330円/件
      const transferFeePerTransaction = 330;
      const totalTransferFee = completedWithdrawals * transferFeePerTransaction;
      
      // クリエイター支払い経費合計（プラットフォーム収入）
      const creatorPaymentExpenses = systemFee + systemFeeTax + earlyPaymentFee + earlyPaymentFeeTax + totalTransferFee;
      
      // ========== ポイント購入収益 ==========
      
      // ポイント購入 (confirmed bank transfers)
      const pointPurchases = await db
        .select({ 
          totalAmount: sql<number>`COALESCE(SUM(amount), 0)`,
          totalPoints: sql<number>`COALESCE(SUM(points), 0)`,
          count: sql<number>`COUNT(*)`
        })
        .from(bankTransferRequests)
        .where(eq(bankTransferRequests.status, "confirmed"));
      
      // Card point purchases (Stripe)
      const stripePointPurchases = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(amount), 0)`,
          count: sql<number>`COUNT(*)`
        })
        .from(pointTransactions)
        .where(eq(pointTransactions.type, "purchase_card"));
      
      const bankTransferAmount = Number(pointPurchases[0]?.totalAmount || 0);
      const bankTransferPoints = Number(pointPurchases[0]?.totalPoints || 0);
      const bankTransferCount = Number(pointPurchases[0]?.count || 0);
      const stripeTotal = Number(stripePointPurchases[0]?.total || 0);
      const stripeCount = Number(stripePointPurchases[0]?.count || 0);
      const totalPointPurchaseAmount = bankTransferAmount + stripeTotal;
      const totalPointPurchasePoints = bankTransferPoints + stripeTotal;
      const totalPointPurchaseCount = bankTransferCount + stripeCount;
      
      // ポイント購入手数料 10% (ポイント数に基づいて計算)
      const pointPurchaseFee = Math.floor(totalPointPurchasePoints * 0.10);
      // 消費税 10% (ポイント数に基づいて計算)
      const pointPurchaseFeeTax = Math.floor(totalPointPurchasePoints * 0.10);
      
      // ポイント購入収益合計
      const pointPurchaseRevenue = pointPurchaseFee + pointPurchaseFeeTax;
      
      // ========== 純利益計算 ==========
      
      // 総収益 = クリエイター支払い経費（プラットフォームの収入）+ ポイント購入収益
      const totalPlatformRevenue = creatorPaymentExpenses + pointPurchaseRevenue;
      
      // 純利益
      const netProfit = totalPlatformRevenue;
      
      // ========== 取引履歴（すべての売上を含む） ==========
      
      // ポイント取引
      const recentPointTransactions = await db
        .select({
          id: pointTransactions.id,
          userId: pointTransactions.userId,
          amount: pointTransactions.amount,
          type: pointTransactions.type,
          description: pointTransactions.description,
          createdAt: pointTransactions.createdAt,
        })
        .from(pointTransactions)
        .orderBy(desc(pointTransactions.createdAt))
        .limit(30);
      
      // サブスクリプション取引
      const recentSubscriptions = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          creatorId: subscriptions.creatorId,
          planType: subscriptions.planType,
          tier: subscriptions.tier,
          createdAt: subscriptions.startedAt,
        })
        .from(subscriptions)
        .orderBy(desc(subscriptions.startedAt))
        .limit(20);
      
      // ショップ購入
      const recentPurchases = await db
        .select({
          id: purchases.id,
          userId: purchases.userId,
          productId: purchases.productId,
          creatorId: purchases.creatorId,
          price: purchases.price,
          createdAt: purchases.createdAt,
        })
        .from(purchases)
        .orderBy(desc(purchases.createdAt))
        .limit(20);
      
      // ライブ視聴セッション
      const recentLiveSessions = await db
        .select({
          id: liveViewingSessions.id,
          userId: liveViewingSessions.userId,
          liveStreamId: liveViewingSessions.liveStreamId,
          mode: liveViewingSessions.mode,
          totalPointsCharged: liveViewingSessions.totalPointsCharged,
          createdAt: liveViewingSessions.startedAt,
        })
        .from(liveViewingSessions)
        .where(sql`${liveViewingSessions.totalPointsCharged} > 0`)
        .orderBy(desc(liveViewingSessions.startedAt))
        .limit(20);
      
      // すべての取引を統合
      const allTransactions: Array<{
        id: string;
        category: string;
        userId: string;
        creatorId?: string | null;
        amount: number;
        type: string;
        description: string;
        createdAt: Date | null;
      }> = [];
      
      // ポイント取引を追加
      for (const tx of recentPointTransactions) {
        // 高画質プランは自社サブスクとして分類
        const category = tx.type === "premium_plan" ? "platform_subscription" : "point";
        allTransactions.push({
          id: tx.id,
          category,
          userId: tx.userId,
          creatorId: null,
          amount: tx.amount,
          type: tx.type,
          description: tx.description || "",
          createdAt: tx.createdAt,
        });
      }
      
      // サブスク取引を追加
      for (const sub of recentSubscriptions) {
        let price = 980;
        let planName = sub.planType;
        if (sub.planId) {
          const [plan] = await db
            .select({ price: subscriptionPlans.price, name: subscriptionPlans.name })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, sub.planId));
          price = plan?.price || 980;
          planName = plan?.name || sub.planType;
        }
        allTransactions.push({
          id: sub.id,
          category: "subscription",
          userId: sub.userId,
          creatorId: sub.creatorId,
          amount: -price,
          type: "subscription",
          description: `サブスクリプション: ${planName}`,
          createdAt: sub.createdAt,
        });
      }
      
      // ショップ購入を追加
      for (const purchase of recentPurchases) {
        const [product] = await db
          .select({ name: products.name })
          .from(products)
          .where(eq(products.id, purchase.productId));
        allTransactions.push({
          id: purchase.id,
          category: "shop",
          userId: purchase.userId,
          creatorId: purchase.creatorId,
          amount: -purchase.price,
          type: "shop_purchase",
          description: `商品購入: ${product?.name || "商品"}`,
          createdAt: purchase.createdAt,
        });
      }
      
      // ライブ視聴を追加
      for (const session of recentLiveSessions) {
        const [stream] = await db
          .select({ creatorId: liveStreams.creatorId, title: liveStreams.title })
          .from(liveStreams)
          .where(eq(liveStreams.id, session.liveStreamId));
        const modeLabel = session.mode === "party" ? "パーティー" : session.mode === "twoshot" ? "ツーショット" : session.mode;
        allTransactions.push({
          id: session.id,
          category: "live",
          userId: session.userId,
          creatorId: stream?.creatorId || null,
          amount: -(session.totalPointsCharged || 0),
          type: "live_viewing",
          description: `ライブ視聴(${modeLabel}): ${stream?.title || "配信"}`,
          createdAt: session.createdAt,
        });
      }
      
      // 日付でソートして最新50件
      allTransactions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      const sortedTransactions = allTransactions.slice(0, 50);
      
      // ユーザー名とクリエイター名を追加
      const transactionsWithNames = await Promise.all(
        sortedTransactions.map(async (tx) => {
          const [userProfile] = await db
            .select({ displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.userId, tx.userId));
          
          let creatorName = null;
          if (tx.creatorId) {
            const [creatorProfile] = await db
              .select({ displayName: userProfiles.displayName })
              .from(userProfiles)
              .where(eq(userProfiles.userId, tx.creatorId));
            creatorName = creatorProfile?.displayName || null;
          }
          
          return {
            ...tx,
            userName: userProfile?.displayName || "Unknown",
            creatorName,
          };
        })
      );
      
      res.json({
        // クリエイター売上内訳
        creatorRevenue: {
          subscription: subscriptionTotal,
          live: liveTotal,
          shop: shopTotal,
          shopCount: shopCount,
          total: creatorTotalRevenue,
        },
        // 自社サブスク（プラットフォームサブスク）
        platformSubscription: {
          total: platformSubscriptionTotal,
          count: platformSubscriptionCount,
        },
        // クリエイター支払い経費
        creatorPaymentExpenses: {
          feeBaseAmount: feeBaseAmount,
          systemFee: systemFee,
          systemFeeTax: systemFeeTax,
          earlyPaymentAmount: earlyAmount,
          earlyPaymentCount: earlyPaymentCount,
          earlyPaymentFee: earlyPaymentFee,
          earlyPaymentFeeTax: earlyPaymentFeeTax,
          transferFee: totalTransferFee,
          transferCount: completedWithdrawals,
          total: creatorPaymentExpenses,
        },
        // ポイント購入
        pointPurchase: {
          bankTransfer: bankTransferAmount,
          bankTransferCount: bankTransferCount,
          stripe: stripeTotal,
          stripeCount: stripeCount,
          total: totalPointPurchaseAmount,
          totalCount: totalPointPurchaseCount,
          totalPoints: totalPointPurchasePoints,
          fee: pointPurchaseFee,
          feeTax: pointPurchaseFeeTax,
          revenue: pointPurchaseRevenue,
        },
        // 純利益
        netProfit: netProfit,
        totalPlatformRevenue: totalPlatformRevenue,
        // 取引履歴
        recentTransactions: transactionsWithNames,
      });
    } catch (error) {
      console.error("Get sales error:", error);
      res.status(500).json({ message: "売上データの取得に失敗しました" });
    }
  });

  // Get marketing statistics for admin
  app.get("/api/admin/marketing", isAdminSession, async (req, res) => {
    try {
      // Get user registration stats by date (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [totalUsers] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
      const [newUsersThisMonth] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(sql`created_at >= ${thirtyDaysAgo}`);
      
      // Get follower/subscription stats
      const [totalFollows] = await db.select({ count: sql<number>`COUNT(*)` }).from(follows);
      const [activeSubscriptions] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"));
      
      // Get video engagement stats
      const [totalViews] = await db
        .select({ total: sql<number>`COALESCE(SUM(view_count), 0)` })
        .from(videos);
      const [totalLikes] = await db
        .select({ total: sql<number>`COALESCE(SUM(like_count), 0)` })
        .from(videos);
      
      res.json({
        totalUsers: Number(totalUsers?.count || 0),
        newUsersThisMonth: Number(newUsersThisMonth?.count || 0),
        totalFollows: Number(totalFollows?.count || 0),
        activeSubscriptions: Number(activeSubscriptions?.count || 0),
        totalVideoViews: Number(totalViews?.total || 0),
        totalVideoLikes: Number(totalLikes?.total || 0),
      });
    } catch (error) {
      console.error("Get marketing error:", error);
      res.status(500).json({ message: "マーケティングデータの取得に失敗しました" });
    }
  });

  // Generate marketing email with AI
  app.post("/api/admin/marketing/generate-email", isAdminSession, async (req, res) => {
    try {
      const { targetAudience, purpose, tone, additionalInfo } = req.body;
      
      const prompt = `
あなたはプロのマーケティングコピーライターです。以下の条件で営業メールを作成してください。

ターゲット: ${targetAudience || "一般ユーザー"}
目的: ${purpose || "サービスの紹介"}
トーン: ${tone || "フレンドリー"}
${additionalInfo ? `追加情報: ${additionalInfo}` : ""}

プラットフォーム名: Only-U（クリエイター向けコンテンツ配信プラットフォーム）

以下の形式でJSON形式で返してください:
{
  "subject": "メールの件名",
  "body": "メール本文（改行は\\nで表現）"
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const emailData = JSON.parse(content);
      
      res.json(emailData);
    } catch (error) {
      console.error("Generate email error:", error);
      res.status(500).json({ message: "メール生成に失敗しました" });
    }
  });

  // Get users for marketing email
  app.get("/api/admin/marketing/users", isAdminSession, async (req, res) => {
    try {
      const allUsers = await db
        .select({
          id: userProfiles.userId,
          displayName: userProfiles.displayName,
          email: userProfiles.email,
          createdAt: userProfiles.createdAt,
        })
        .from(userProfiles)
        .orderBy(desc(userProfiles.createdAt));
      
      res.json(allUsers.filter(u => u.email));
    } catch (error) {
      console.error("Get marketing users error:", error);
      res.status(500).json({ message: "ユーザー一覧の取得に失敗しました" });
    }
  });

  // Send marketing email
  app.post("/api/admin/marketing/send-email", isAdminSession, async (req, res) => {
    try {
      const { recipients, subject, body } = req.body;
      
      if (!recipients || recipients.length === 0) {
        return res.status(400).json({ message: "送信先を選択してください" });
      }
      
      if (!subject || !body) {
        return res.status(400).json({ message: "件名と本文を入力してください" });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      let successCount = 0;
      let failCount = 0;

      for (const email of recipients) {
        try {
          await transporter.sendMail({
            from: `"Only-U" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, "<br>"),
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to send to ${email}:`, err);
          failCount++;
        }
      }

      res.json({
        success: true,
        sent: successCount,
        failed: failCount,
        message: `${successCount}件のメールを送信しました${failCount > 0 ? `（${failCount}件失敗）` : ""}`,
      });
    } catch (error) {
      console.error("Send marketing email error:", error);
      res.status(500).json({ message: "メール送信に失敗しました" });
    }
  });

  // Get messages statistics for admin
  app.get("/api/admin/messages", isAdminSession, async (req, res) => {
    try {
      const [totalMessages] = await db.select({ count: sql<number>`COUNT(*)` }).from(messages);
      const [totalConversations] = await db.select({ count: sql<number>`COUNT(*)` }).from(conversations);
      
      // Get recent messages
      const recentMessages = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .orderBy(desc(messages.createdAt))
        .limit(50);
      
      const messagesWithSenders = await Promise.all(
        recentMessages.map(async (msg) => {
          const [profile] = await db
            .select({ displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.userId, msg.senderId));
          return {
            ...msg,
            senderName: profile?.displayName || "Unknown",
          };
        })
      );
      
      res.json({
        totalMessages: Number(totalMessages?.count || 0),
        totalConversations: Number(totalConversations?.count || 0),
        recentMessages: messagesWithSenders,
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "メッセージデータの取得に失敗しました" });
    }
  });

  // Get notifications for admin
  app.get("/api/admin/notifications", isAdminSession, async (req, res) => {
    try {
      const [totalNotifications] = await db.select({ count: sql<number>`COUNT(*)` }).from(notifications);
      const [unreadNotifications] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(eq(notifications.isRead, false));
      
      // Get recent notifications
      const recentNotifications = await db
        .select({
          id: notifications.id,
          userId: notifications.userId,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(100);
      
      res.json({
        totalNotifications: Number(totalNotifications?.count || 0),
        unreadNotifications: Number(unreadNotifications?.count || 0),
        recentNotifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "通知データの取得に失敗しました" });
    }
  });

  // Send notification to all users (admin)
  app.post("/api/admin/notifications/broadcast", isAdminSession, async (req, res) => {
    try {
      const { title, message, type } = req.body;
      
      // Get all user IDs
      const allUsers = await db.select({ id: users.id }).from(users);
      
      // Create notification for each user
      for (const user of allUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          type: type || "system",
          title,
          message,
        });
      }
      
      res.json({ success: true, count: allUsers.length });
    } catch (error) {
      console.error("Broadcast notification error:", error);
      res.status(500).json({ message: "通知の送信に失敗しました" });
    }
  });

  // Generate notification content with AI
  app.post("/api/admin/notifications/generate", isAdminSession, async (req, res) => {
    try {
      const { prompt, type, includeEmail } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "プロンプトを入力してください" });
      }

      const typeLabels: Record<string, string> = {
        system: "システム通知",
        announcement: "お知らせ",
        promotion: "プロモーション",
        maintenance: "メンテナンス通知",
      };

      const systemPrompt = `あなたはOnly-Uというクリエイタープラットフォームの管理者です。
ユーザーに送る通知${includeEmail ? "とメール" : ""}を作成してください。
プラットフォームは日本語で運営されており、丁寧で親しみやすいトーンを心がけてください。

通知タイプ: ${typeLabels[type] || type}

以下のJSON形式で返してください：
{
  "title": "通知タイトル（20文字以内）",
  "message": "通知メッセージ（100文字以内）"${includeEmail ? `,
  "emailSubject": "メール件名",
  "emailBody": "メール本文（改行も含めて読みやすく）"` : ""}
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "AIからの応答がありませんでした" });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error) {
      console.error("Generate notification error:", error);
      res.status(500).json({ message: "通知の生成に失敗しました" });
    }
  });

  // Send notification and optional email to users (admin)
  app.post("/api/admin/notifications/send", isAdminSession, async (req, res) => {
    try {
      const { title, message, type, userIds, sendEmail, emailSubject, emailBody } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: "タイトルとメッセージは必須です" });
      }

      // Get target users
      let targetUsers: { id: string; email: string | null }[];
      if (userIds && userIds.length > 0) {
        targetUsers = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(inArray(users.id, userIds));
      } else {
        targetUsers = await db.select({ id: users.id, email: users.email }).from(users);
      }

      // Create notifications for each user
      let notificationCount = 0;
      for (const user of targetUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          type: type || "system",
          title,
          message,
        });
        notificationCount++;
      }

      // Send emails if requested
      let emailCount = 0;
      if (sendEmail && emailSubject && emailBody) {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpPort && smtpUser && smtpPass) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: parseInt(smtpPort) === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          // Send emails in batches
          const emailsToSend = targetUsers.filter(u => u.email);
          for (const user of emailsToSend) {
            try {
              await transporter.sendMail({
                from: `"Only-U" <${smtpUser}>`,
                to: user.email!,
                subject: emailSubject,
                text: emailBody,
                html: emailBody.replace(/\n/g, "<br>"),
              });
              emailCount++;
            } catch (emailError) {
              console.error(`Failed to send email to ${user.email}:`, emailError);
            }
          }
        } else {
          console.warn("SMTP not configured, skipping email sending");
        }
      }

      res.json({ 
        success: true, 
        notificationCount, 
        emailCount: sendEmail ? emailCount : undefined 
      });
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ message: "通知の送信に失敗しました" });
    }
  });
  
  // Get site settings
  app.get("/api/admin/settings", isAdminSession, async (req, res) => {
    try {
      const settings = await db.select().from(siteSettings);
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value || "";
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "設定の取得に失敗しました" });
    }
  });

  // Update site settings
  app.post("/api/admin/settings", isAdminSession, async (req, res) => {
    try {
      const settings = req.body;
      
      for (const [key, value] of Object.entries(settings)) {
        const [existing] = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, key));
        
        if (existing) {
          await db
            .update(siteSettings)
            .set({ value: value as string, updatedAt: new Date() })
            .where(eq(siteSettings.key, key));
        } else {
          await db.insert(siteSettings).values({
            key,
            value: value as string,
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "設定の更新に失敗しました" });
    }
  });

  // Seed admin account and default settings on startup
  (async () => {
    try {
      const adminEmail = "info@sinjapan.jp";
      const [existingAdmin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, adminEmail));
      
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash("Kazuya8008", 10);
        await db.insert(adminUsers).values({
          email: adminEmail,
          passwordHash,
          name: "System Admin",
          isActive: true,
        });
        console.log("Admin account created: info@sinjapan.jp");
      }

      // Seed default site settings
      const defaultSettings = [
        { key: "site_name", value: "Only-U", description: "サイト名", category: "general" },
        { key: "site_description", value: "クリエイターとファンをつなぐプラットフォーム", description: "サイト説明", category: "general" },
        { key: "support_email", value: "support@only-u.fun", description: "サポートメール", category: "contact" },
        { key: "twitter_url", value: "", description: "Twitter URL", category: "social" },
        { key: "instagram_url", value: "", description: "Instagram URL", category: "social" },
        { key: "maintenance_mode", value: "false", description: "メンテナンスモード", category: "system" },
        { key: "allow_registration", value: "true", description: "新規登録許可", category: "system" },
        { key: "allow_creator_application", value: "true", description: "クリエイター申請許可", category: "system" },
        { key: "platform_fee_percent", value: "20", description: "プラットフォーム手数料(%)", category: "finance" },
        { key: "withdrawal_fee", value: "330", description: "出金手数料(円)", category: "finance" },
        { key: "min_withdrawal", value: "5000", description: "最低出金額(円)", category: "finance" },
        { key: "early_payment_fee_percent", value: "8", description: "早期出金手数料(%)", category: "finance" },
        { key: "terms_url", value: "/terms", description: "利用規約URL", category: "legal" },
        { key: "privacy_url", value: "/privacy", description: "プライバシーポリシーURL", category: "legal" },
      ];

      for (const setting of defaultSettings) {
        const [existing] = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, setting.key));
        
        if (!existing) {
          await db.insert(siteSettings).values(setting);
        }
      }
      console.log("Default settings seeded");
    } catch (error) {
      console.error("Failed to seed admin account or settings:", error);
    }
  })();

  return httpServer;
}
