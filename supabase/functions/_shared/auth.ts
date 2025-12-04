import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ADMIN → bypass RLS (solo para operaciones internas sensibles) */
export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

/* Normal → respeta RLS (para verificar usuarios y consultas seguras) */
export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

/* Verifica sesión de forma segura (base para todas las rutas) */
export async function verifySession(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

/* 1. Para /panel y /registro → redirecciona a /login si no está logueado */
export async function requireAuthHtml(req: Request) {
  const user = await verifySession(req);
  if (!user) {
    const url = new URL(req.url);
    const loginUrl = `/login?next=${encodeURIComponent(url.pathname + url.search)}`;
    return Response.redirect(new URL(loginUrl, url.origin), 302);
  }
  return user;
}

/* 2. Para /pagar y /bateria → devuelve 401 JSON (son APIs) */
export async function requireAuthJson(req: Request) {
  const user = await verifySession(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized – Login required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}

/* 3. Para /login → permite acceso público (no requiere auth) */
export async function publicLoginRoute(req: Request) {
  // Siempre permite acceso a /login (incluso si ya está logueado, opcional redirigir)
  const user = await verifySession(req);
  if (user) {
    const url = new URL(req.url);
    const next = url.searchParams.get("next") || "/panel";
    return Response.redirect(new URL(next, url.origin), 302);
  }
  return null; // null = acceso público permitido
}

/* 4. Para /register → permite acceso público (registro abierto) */
export async function publicRegisterRoute(req: Request) {
  // Siempre permite acceso a /register
  const user = await verifySession(req);
  if (user) {
    // Si ya está logueado, redirigir al panel
    return Response.redirect(new URL("/panel", new URL(req.url).origin), 302);
  }
  return null; // null = acceso público permitido
}

/* 5. Devuelve solo el user_id (útil para /pagar y otras APIs) */
export async function getUserId(req: Request): Promise<string> {
  const result = await requireAuthJson(req);
  if (result instanceof Response) throw result; // lanza 401
  return (result as any).id;
}
