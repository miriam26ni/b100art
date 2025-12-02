import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { verifySession } from "../_shared/auth.ts";
serve(async (req) => {
  const user = await verifySession(req);
  if (!user) return new Response("Login requerido", { status: 401 });
  return new Response("<h1>Panel protegido – funcionando</h1>", {
    headers: { "Content-Type": "text/html" }
  });
});
