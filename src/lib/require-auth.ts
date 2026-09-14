import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export async function requireAuth(redirectTo?: string) {
    const { userId } = await auth();
    if (!userId) redirect(redirectTo ? `/sign-in?redirect_url=${redirectTo}` : "/sign-in");
    return userId;
}