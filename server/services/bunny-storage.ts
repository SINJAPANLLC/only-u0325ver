import { randomUUID } from "crypto";

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || "";
const BUNNY_STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME || "";
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";
const BUNNY_STORAGE_CDN_URL = process.env.BUNNY_STORAGE_CDN_URL || "";

export function isBunnyStorageConfigured(): boolean {
  return !!(BUNNY_STORAGE_API_KEY && BUNNY_STORAGE_ZONE_NAME && BUNNY_STORAGE_CDN_URL);
}

export async function uploadToBunnyStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string } | null> {
  if (!isBunnyStorageConfigured()) return null;

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const objectId = randomUUID();
  const remotePath = ext ? `uploads/${objectId}.${ext}` : `uploads/${objectId}`;

  const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE_NAME}/${remotePath}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Bunny Storage upload failed:", response.status, text);
    return null;
  }

  const cdnBase = BUNNY_STORAGE_CDN_URL.replace(/\/$/, "");
  const url = `${cdnBase}/${remotePath}`;

  return { url, path: remotePath };
}

export async function deleteFromBunnyStorage(path: string): Promise<boolean> {
  if (!isBunnyStorageConfigured()) return false;

  const deleteUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE_NAME}/${path}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
    },
  });

  return response.ok;
}
