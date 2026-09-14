import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/AuthShell";

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "w-full shadow-none border-0 bg-transparent p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "rounded-full border-zinc-200 hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/10",
    formButtonPrimary: "rounded-full bg-blue-600 hover:bg-blue-700 normal-case",
    footerActionLink: "text-blue-600 hover:text-blue-700",
    formFieldInput: "rounded-xl",
  },
};

export default function SignInPage() {
  return (
    <AuthShell
      badge="Bon retour parmi nous"
      title="Se connecter"
      subtitle="Retrouve tes vacations, ton calendrier et ton salaire estimé."
    >
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" appearance={clerkAppearance} />
    </AuthShell>
  );
}
