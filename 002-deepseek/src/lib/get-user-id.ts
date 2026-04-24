import { cookies } from "next/headers";

/**
 * Extracts the authenticated user ID from the session cookie.
 * Returns null if not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  return session?.value || null;
}
