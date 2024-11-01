"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ArtistWithLikes } from "@/types/db";

interface LikeButtonProps {
  artist: ArtistWithLikes;
  onLikeToggle: (artistId: number, action: "like" | "unlike") => Promise<void>;
}

export function LikeButton({ artist, onLikeToggle }: LikeButtonProps) {
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
