import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type {
  ArtistWithCount,
  ArtistWithLikes,
  SSEMessage,
  APIError,
} from "@/types/db";

type SSEController = ReadableStreamDefaultController;

const clients = new Set<SSEController>();

async function broadcastUpdate(artist: ArtistWithLikes) {
  const message: SSEMessage = {
    type: "ARTIST_UPDATED",
    artist,
  };

  clients.forEach((client) => {
    client.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(message)}\n\n`)
    );
  });
}

async function formatArtist(
  artist: ArtistWithCount,
  userId: string
): Promise<ArtistWithLikes> {
  const hasLiked = await prisma.userLike.findUnique({
    where: {
      userId_artistId: {
        userId: userId,
        artistId: artist.id,
      },
    },
  });

  return {
    id: artist.id,
    name: artist.name,
    image: artist.image,
    createdAt: artist.createdAt,
    updatedAt: artist.updatedAt,
    likes: artist._count?.likedBy ?? 0,
    hasLiked: !!hasLiked,
  };
}

function createErrorResponse(error: APIError): NextResponse {
  return NextResponse.json({ error }, { status: error.status });
}

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    return createErrorResponse({
      message: "Unauthorized",
      status: 401,
    });
  }

  const headersList = await headers();

  if (headersList.get("accept") === "text/event-stream") {
    const stream = new ReadableStream({
      start: async (controller: SSEController) => {
        clients.add(controller);

        try {
          const artists = await prisma.artist.findMany({
            include: {
              _count: {
                select: { likedBy: true },
              },
            },
          });

          const formattedArtists = await Promise.all(
            artists.map((artist) => formatArtist(artist, session.userId))
          );

          const message: SSEMessage = {
            type: "INITIAL_DATA",
            artists: formattedArtists,
          };

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(message)}\n\n`)
          );
        } catch (error) {
          console.error("Error in SSE stream:", error);
          clients.delete(controller);
          controller.error(
            error instanceof Error ? error : new Error("Unknown error")
          );
        }
      },
      cancel(controller: SSEController) {
        clients.delete(controller);
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const artists = await prisma.artist.findMany({
      include: {
        _count: {
          select: { likedBy: true },
        },
      },
    });

    const formattedArtists = await Promise.all(
      artists.map((artist) => formatArtist(artist, session.userId))
    );
    return NextResponse.json({ data: formattedArtists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return createErrorResponse({
      message: "Failed to fetch artists",
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.userId) {
    return createErrorResponse({
      message: "Unauthorized",
      status: 401,
    });
  }

  try {
    const { artistId }: { artistId: number } = await req.json();

    const existingLike = await prisma.userLike.findUnique({
      where: {
        userId_artistId: {
          userId: session.userId,
          artistId: artistId,
        },
      },
    });

    if (existingLike) {
      return createErrorResponse({
        message: "Already liked this artist",
        status: 400,
      });
    }

    await prisma.userLike.create({
      data: {
        userId: session.userId,
        artistId: artistId,
      },
    });

    const updatedArtist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        _count: {
          select: { likedBy: true },
        },
      },
    });

    if (!updatedArtist) {
      return createErrorResponse({
        message: "Artist not found",
        status: 404,
      });
    }

    const formattedArtist = await formatArtist(updatedArtist, session.userId);
    await broadcastUpdate(formattedArtist);

    return NextResponse.json({ data: formattedArtist });
  } catch (error) {
    console.error("Error liking artist:", error);
    return createErrorResponse({
      message: "Failed to like artist",
      status: 500,
    });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.userId) {
    return createErrorResponse({
      message: "Unauthorized",
      status: 401,
    });
  }

  try {
    const { artistId }: { artistId: number } = await req.json();

    const existingLike = await prisma.userLike.findUnique({
      where: {
        userId_artistId: {
          userId: session.userId,
          artistId: artistId,
        },
      },
    });

    if (!existingLike) {
      return createErrorResponse({
        message: "Haven't liked this artist yet",
        status: 400,
      });
    }

    await prisma.userLike.delete({
      where: {
        userId_artistId: {
          userId: session.userId,
          artistId: artistId,
        },
      },
    });

    const updatedArtist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        _count: {
          select: { likedBy: true },
        },
      },
    });

    if (!updatedArtist) {
      return createErrorResponse({
        message: "Artist not found",
        status: 404,
      });
    }

    const formattedArtist = await formatArtist(updatedArtist, session.userId);
    await broadcastUpdate(formattedArtist);

    return NextResponse.json({ data: formattedArtist });
  } catch (error) {
    console.error("Error unliking artist:", error);
    return createErrorResponse({
      message: "Failed to unlike artist",
      status: 500,
    });
  }
}
