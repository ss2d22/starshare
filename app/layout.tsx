import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StarShare",
  description: "Share and discover your favorite artists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
            {children}
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
