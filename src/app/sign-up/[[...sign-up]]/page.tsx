import { SignUp } from "@clerk/nextjs";
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

export default function SignUpPage() {
  return (
    <AuthShell
      badge="Inscription gratuite"
      title="Créer un compte"
      subtitle="2 minutes suffisent pour pointer ta première vacation de 12h."
    >
      <SignUp fallbackRedirectUrl="/settings" signInUrl="/sign-in" appearance={clerkAppearance} />
    </AuthShell>
  );
}
