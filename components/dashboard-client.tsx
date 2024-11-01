"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, Trophy, Users } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ArtistWithLikes, APIResponse, SSEMessage } from "@/types/db";

function LikeButton({
  artist,
  onLikeToggle,
}: {
  artist: ArtistWithLikes;
  onLikeToggle: (artistId: number, action: "like" | "unlike") => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onLikeToggle(artist.id, artist.hasLiked ? "unlike" : "like");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "group flex items-center gap-1 p-0 h-auto",
        artist.hasLiked && "text-red-500",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all group-hover:scale-110",
          artist.hasLiked && "fill-current",
          isLoading && "animate-pulse"
        )}
      />
      <span className="text-sm font-normal">
        {artist.hasLiked ? "Liked" : "Like"}
      </span>
    </Button>
  );
}

export default function DashboardClient() {
  const [artists, setArtists] = useState<ArtistWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch("/api/artists");
        if (!response.ok) throw new Error("Failed to fetch artists");
        const data: APIResponse<ArtistWithLikes[]> = await response.json();
        if (data.data) {
          setArtists(data.data);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load artists. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const eventSource = new EventSource("/api/artists");

    eventSource.onmessage = (event) => {
      const data: SSEMessage = JSON.parse(event.data);
      if (data.type === "INITIAL_DATA" && data.artists) {
        setArtists(data.artists);
        setLoading(false);
      } else if (data.type === "ARTIST_UPDATED" && data.artist) {
        setArtists((prevArtists) =>
          prevArtists.map((artist) =>
            artist.id === data.artist!.id ? data.artist! : artist
          )
        );
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      toast({
        title: "Connection Error",
        description: "Real-time updates disconnected. Please refresh the page.",
        variant: "destructive",
      });
    };

    fetchArtists();

    return () => eventSource.close();
  }, [toast]);

  const handleLikeToggle = async (
    artistId: number,
    action: "like" | "unlike"
  ) => {
    try {
      const response = await fetch("/api/artists", {
        method: action === "like" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Failed to ${action} artist`);
      }

      const data: APIResponse<ArtistWithLikes> = await response.json();
      if (data.data) {
        setArtists((prevArtists) =>
          prevArtists.map((artist) =>
            artist.id === artistId ? data.data! : artist
          )
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Failed to ${action} artist`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 p-1.5"
            >
              <Star className="w-full h-full text-white" />
            </motion.div>
            <span className="text-xl font-bold">StarShare</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          <AnimatePresence mode="popLayout">
            {artists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 hover:bg-card/80 transition-colors">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="aspect-square relative"
                  >
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </motion.div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2">{artist.name}</h2>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {artist.likes.toLocaleString()}
                        </span>
                      </div>
                      <LikeButton
                        artist={artist}
                        onLikeToggle={handleLikeToggle}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Card className="w-80 shrink-0 hidden xl:block bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-bold">Top Artists</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4">
                {[...artists]
                  .sort((a, b) => b.likes - a.likes)
                  .map((artist, index) => (
                    <motion.div
                      key={artist.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artist.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {artist.likes.toLocaleString()}
                          </p>
                        </div>
                        {index < 3 && (
                          <Star
                            className="h-4 w-4 shrink-0"
                            style={{
                              fill:
                                index === 0
                                  ? "#FFD700"
                                  : index === 1
                                  ? "#C0C0C0"
                                  : "#CD7F32",
                            }}
                          />
                        )}
                      </div>
                      {index < artists.length - 1 && (
                        <Separator className="my-4 bg-border/50" />
                      )}
                    </motion.div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </main>
    </div>
  );
}
