import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/Landing";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  // La page d'accueil est un composant client (animations Framer Motion) :
  // seul l'auth-check reste côté serveur ici.
  return <Landing />;
}
