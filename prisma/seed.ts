import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userLike.deleteMany();
  await prisma.artist.deleteMany();

  const artists = [
    {
      name: "P diddy",
      image: "/diddy.jpg?height=400&width=400",
    },
    {
      name: "Drake",
      image: "/drake.avif?height=400&width=400",
    },
    {
      name: "Taylor Swift",
      image: "/swift.avif?height=400&width=400",
    },
    {
      name: "Ed Sheeran",
      image: "/sheeran.avif?height=400&width=400",
    },
    {
      name: "The Weeknd",
      image: "/weeknd.jpeg?height=400&width=400",
    },
    {
      name: "Billie Eilish",
      image: "/eilish.jpg?height=400&width=400",
    },

    {
      name: "Adele",
      image: "/adele.webp?height=400&width=400",
    },
  ];

  console.log("Seeding database...");

  for (const artist of artists) {
    await prisma.artist.create({
      data: artist,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
