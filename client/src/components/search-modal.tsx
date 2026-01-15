import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PiMagnifyingGlassDuotone, PiUserCircleDuotone, PiVideoFill } from "react-icons/pi";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  creators: Array<{
    id: string;
    userId: string;
    displayName: string;
    bio?: string;
    coverImageUrl?: string;
    isVerified?: boolean;
    followerCount?: number;
  }>;
  videos: Array<{
    id: string;
    title: string;
    thumbnailUrl?: string;
    creatorId: string;
    viewCount?: number;
  }>;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { creators: [], videos: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.json();
    },
    enabled: !!debouncedQuery,
  });

  const handleCreatorClick = (userId: string) => {
    onOpenChange(false);
    setQuery("");
    setLocation(`/creator/${userId}`);
  };

  const handleVideoClick = (videoId: string) => {
    onOpenChange(false);
    setQuery("");
    setLocation(`/?video=${videoId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <PiMagnifyingGlassDuotone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="クリエイターや動画を検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 rounded-full border-gray-200 dark:border-gray-700"
              autoFocus
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              検索中...
            </div>
          )}

          {!isLoading && debouncedQuery && (!results?.creators?.length && !results?.videos?.length) && (
            <div className="p-8 text-center text-gray-500">
              「{debouncedQuery}」の検索結果はありません
            </div>
          )}

          {results?.creators && results.creators.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">クリエイター</p>
              {results.creators.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => handleCreatorClick(creator.userId)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  data-testid={`search-result-creator-${creator.id}`}
                >
                  {creator.coverImageUrl ? (
                    <img 
                      src={creator.coverImageUrl} 
                      alt={creator.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                      <PiUserCircleDuotone className="w-8 h-8 text-pink-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {creator.displayName}
                      {creator.isVerified && (
                        <span className="ml-1 text-pink-500">✓</span>
                      )}
                    </p>
                    {creator.bio && (
                      <p className="text-sm text-gray-500 truncate">{creator.bio}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {creator.followerCount || 0} フォロワー
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results?.videos && results.videos.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">動画</p>
              {results.videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  data-testid={`search-result-video-${video.id}`}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-16 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <PiVideoFill className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {video.viewCount || 0} 回視聴
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!debouncedQuery && (
            <div className="p-8 text-center text-gray-400">
              <PiMagnifyingGlassDuotone className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>クリエイターや動画を検索</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
