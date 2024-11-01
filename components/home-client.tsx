"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

export default function HomeClient() {
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn, router]);

  if (isLoading) {
    return null; 
  }

  return (
    <AnimatePresence>
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-screen flex-col items-center justify-center p-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-24 h-24 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 p-6"
            >
              <Star className="w-full h-full text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Welcome to StarShare
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mx-auto max-w-[600px] text-gray-400 md:text-xl"
            >
              Join our community to discover and share your favorite artists.
              Track popularity, engage with others, and stay updated with
              real-time statistics.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-x-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700"
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
