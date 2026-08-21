import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const rows = await getDb()
    .select({
      username: users.username,
      display_name: users.display_name,
    })
    .from(users)
    .orderBy(asc(users.username));

  return <LoginForm users={rows || []} />;
}
