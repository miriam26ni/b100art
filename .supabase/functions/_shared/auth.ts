import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function verifySession(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split("Bearer ")[1];
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("bloqueado")
    .eq("id", user.id)
    .single();
  if (perfil?.bloqueado) return null;
  return user;
}
