import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-background/80">
      <SignUp
        appearance={{
          elements: {
            card: "bg-card shadow-xl",
            headerTitle: "text-2xl font-bold",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-white text-black hover:bg-gray-100",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90",
          },
        }}
      />
    </div>
  );
}
