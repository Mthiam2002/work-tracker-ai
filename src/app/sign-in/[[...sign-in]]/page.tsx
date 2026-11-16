import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/AuthShell";

const clerkAppearance = {
  // Panneau de formulaire forcé en mode clair (.theme-light du coquillage)
  colorScheme: "light" as const,
  elements: {
    rootBox: "w-full",
    card: "w-full shadow-none border-0 bg-transparent p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "rounded-full border border-border bg-background text-card-foreground font-medium transition hover:bg-muted",
    socialButtonsBlockButtonText: "text-card-foreground",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    formButtonPrimary:
      "rounded-full bg-accent hover:bg-accent/90 normal-case font-semibold transition shadow-[0_8px_20px_-8px_rgba(37,99,235,0.75)]",
    footerActionLink: "text-accent hover:text-accent/80 font-medium",
    footerActionText: "text-muted-foreground",
    formFieldInput:
      "rounded-xl border-border bg-background text-card-foreground placeholder:text-muted-foreground focus:border-accent",
    formFieldLabel: "text-card-foreground font-medium",
    otpCodeFieldInput: "rounded-xl border-border bg-background",
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-card-foreground",
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
