import { 
  videos, liveStreams, products, creatorProfiles,
  bunnyStreamChannels,
  type Video, type InsertVideo,
  type LiveStream, type InsertLiveStream,
  type Product, type InsertProduct,
  type CreatorProfile, type InsertCreatorProfile,
  type BunnyStreamChannel, type InsertBunnyStreamChannel,
} from "@shared/schema";
import { db } from "./db";
import { eq, isNull, or } from "drizzle-orm";

export interface IStorage {
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  getLiveStream(id: string): Promise<LiveStream | undefined>;
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  getCreatorProfile(id: string): Promise<CreatorProfile | undefined>;
  createCreatorProfile(profile: InsertCreatorProfile): Promise<CreatorProfile>;
  // Bunny stream channels
  getAllBunnyStreamChannels(): Promise<BunnyStreamChannel[]>;
  createBunnyStreamChannel(channel: InsertBunnyStreamChannel): Promise<BunnyStreamChannel>;
  deleteBunnyStreamChannel(id: string): Promise<void>;
  getAvailableBunnyStreamChannel(): Promise<BunnyStreamChannel | undefined>;
  assignBunnyStreamChannel(channelId: string, liveStreamId: string): Promise<void>;
  releaseBunnyStreamChannel(liveStreamId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.id, id));
    return stream;
  }

  async createLiveStream(insertStream: InsertLiveStream): Promise<LiveStream> {
    const [stream] = await db.insert(liveStreams).values(insertStream).returning();
    return stream;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async getCreatorProfile(id: string): Promise<CreatorProfile | undefined> {
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, id));
    return profile;
  }

  async createCreatorProfile(insertProfile: InsertCreatorProfile): Promise<CreatorProfile> {
    const [profile] = await db.insert(creatorProfiles).values(insertProfile).returning();
    return profile;
  }

  async getAllBunnyStreamChannels(): Promise<BunnyStreamChannel[]> {
    return db.select().from(bunnyStreamChannels).orderBy(bunnyStreamChannels.createdAt);
  }

  async createBunnyStreamChannel(channel: InsertBunnyStreamChannel): Promise<BunnyStreamChannel> {
    const [created] = await db.insert(bunnyStreamChannels).values(channel).returning();
    return created;
  }

  async deleteBunnyStreamChannel(id: string): Promise<void> {
    await db.delete(bunnyStreamChannels).where(eq(bunnyStreamChannels.id, id));
  }

  async getAvailableBunnyStreamChannel(): Promise<BunnyStreamChannel | undefined> {
    const [channel] = await db
      .select()
      .from(bunnyStreamChannels)
      .where(eq(bunnyStreamChannels.isAvailable, true))
      .limit(1);
    return channel;
  }

  async assignBunnyStreamChannel(channelId: string, liveStreamId: string): Promise<void> {
    await db
      .update(bunnyStreamChannels)
      .set({ isAvailable: false, currentLiveStreamId: liveStreamId })
      .where(eq(bunnyStreamChannels.id, channelId));
  }

  async releaseBunnyStreamChannel(liveStreamId: string): Promise<void> {
    await db
      .update(bunnyStreamChannels)
      .set({ isAvailable: true, currentLiveStreamId: null })
      .where(eq(bunnyStreamChannels.currentLiveStreamId, liveStreamId));
  }
}

export const storage = new DatabaseStorage();
