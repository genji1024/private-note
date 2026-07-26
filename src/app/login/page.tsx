import { supabaseAdmin } from "@/lib/supabase";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("username, display_name")
    .order("username");

  return <LoginForm users={users || []} />;
}