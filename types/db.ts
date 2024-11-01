export type BaseArtist = {
  id: number;
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ArtistWithCount = BaseArtist & {
  _count?: {
    likedBy: number;
  };
};

export type ArtistWithLikes = BaseArtist & {
  likes: number;
  hasLiked: boolean;
};

export type SSEMessage = {
  type: "INITIAL_DATA" | "ARTIST_UPDATED";
  artists?: ArtistWithLikes[];
  artist?: ArtistWithLikes;
};

export type APIError = {
  message: string;
  status: number;
};

export type APIResponse<T> = {
  data?: T;
  error?: APIError;
};
