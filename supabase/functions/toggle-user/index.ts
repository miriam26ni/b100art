const { data: existe } = await supabase
  .from("usuarios")
  .select("id")
  .eq("id", userId)
  .single();

if (!existe) {
  return new Response(
    JSON.stringify({ ok: false, error: "Usuario no existe" }),
    { status: 404 }
  );
}

const { error } = await supabase
  .from("usuarios")
  .update({ bloqueado })
  .eq("id", userId);

