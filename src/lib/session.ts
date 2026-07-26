// Type-safe session helpers to avoid `as any` casts
import type { Session } from "next-auth";

type SessionUser = {
  id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSessionUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  // NextAuth's default Session.user doesn't include our custom fields.
  // We cast to our custom type — the fields are set in auth.ts callbacks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  return {
    id: u.id as string,
    username: u.username as string,
    display_name: u.display_name as string,
    profile_image_url: u.profile_image_url ?? null,
  };
}

export function getUserId(session: Session | null): string {
  const user = getSessionUser(session);
  if (!user) throw new Error("Not authenticated");
  return user.id;
}
