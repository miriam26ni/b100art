import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cliente ANON (directo en código, NO recomendado para producción)
const supabase = createClient(
  "https://vfnouwdawgkrtexudfkj.supabase.co",
  "TU_ANON_KEY_AQUI"
);

// ================================
// HTML COMPLETO DEL REGISTRO
// ================================
const REGISTER_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Crear cuenta • B100Art</title>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link href="https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/css/tom-select.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/js/tom-select.complete.min.js"></script>

  <style>
    :root { --bg:#0f172a; --card:#1e293b; --accent:#d4af37; --gold:#facc15; }
    body { font-family: 'Inter', system-ui, sans-serif; background: linear-gradient(180deg, #071029, #071b2a);
      min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; color: #e6eef8; }
    .card { background: rgba(255,255,255,0.04); border-radius: 16px; padding: 36px; width: 100%; max-width: 440px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.08); }
    h1 { text-align:center; color:var(--gold); font-size:1.9rem; margin-bottom:8px; }
    label { display:block; margin-top:18px; font-size:0.9rem; opacity:0.9; font-weight:500; }
    input, .ts-wrapper { width:100%; margin-top:6px; border-radius:10px; background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.1); padding:12px 14px; color:white; }
    input[type="password"] { font-family: system-ui; letter-spacing: 2px; }
    .phone-group { display:flex; gap:10px; margin-top:6px; }
    #countryCode { width:140px; }
    button { width:100%; padding:14px; margin-top:28px; border:none; border-radius:12px;
      background:linear-gradient(90deg,var(--gold),#facc15); color:#000; font-weight:700;
      font-size:1.1rem; cursor:pointer; transition:all .3s; }
    button:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(212,175,55,.4); }
    button:disabled { opacity:0.7; cursor:not-allowed; }
    .msg { margin-top:16px; text-align:center; font-size:0.9rem; }
    .success { color:#4ade80; }
    .error { color:#f87171; }
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid var(--gold); border-radius: 50%; width: 32px; height: 32px;
      animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>

<body>
  <div class="card">
    <h1>Crear cuenta</h1>
    <p style="text-align:center;opacity:0.9;margin-bottom:24px;">Completa todos los campos</p>

    <form id="auth-form">
      <label>Nombre completo</label>
      <input type="text" id="nombre" required>

      <label>Fecha de nacimiento</label>
      <input type="date" id="fecha_nac" required max="2007-12-31">

      <label>Nacionalidad</label>
      <input type="text" id="nacionalidad" required>

      <label>Teléfono</label>
      <div class="phone-group">
        <select id="countryCode" required></select>
        <input type="tel" id="phone" required>
      </div>

      <label>Dirección completa</label>
      <input type="text" id="direccion" required>

      <label>Ciudad</label>
      <input type="text" id="ciudad" required>

      <label>País</label>
      <input type="text" id="pais" required>

      <label>Email</label>
      <input type="email" id="email" required>

      <label>Contraseña</label>
      <input type="password" id="password" required minlength="6">

      <button type="submit" id="btn">
        <span id="btnText">Crear cuenta y continuar</span>
        <div id="loader" class="loader hidden"></div>
      </button>
      <div class="msg" id="mensaje"></div>
    </form>
  </div>

  <script type="module">
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

    const supabase = createClient(
      "https://vfnouwdawgkrtexudfkj.supabase.co",
      "TU_ANON_KEY_AQUI"
    );

    const paises = [
      {value:"+1", text:"+1 Estados Unidos"},
      {value:"+52", text:"+52 México"},
      {value:"+34", text:"+34 España"},
      {value:"+57", text:"+57 Colombia"},
      {value:"+54", text:"+54 Argentina"},
      {value:"+56", text:"+56 Chile"},
      {value:"+58", text:"+58 Venezuela"},
      {value:"+505", text:"+505 Nicaragua"},
      {value:"+502", text:"+502 Guatemala"},
      {value:"+593", text:"+593 Ecuador"},
      {value:"+507", text:"+507 Panamá"}
    ];

    new TomSelect("#countryCode", {
      maxOptions: null,
      options: paises,
      searchField: ["text"],
    });

    const btn = document.getElementById('btn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const msg = document.getElementById('mensaje');

    document.getElementById('auth-form').addEventListener('submit', async e => {
      e.preventDefault();
      btn.disabled = true;
      btnText.classList.add('hidden');
      loader.classList.remove('hidden');
      msg.innerHTML = '';

      const datos = {
        nombre: e.target.nombre.value.trim(),
        fecha_nac: e.target.fecha_nac.value,
        nacionalidad: e.target.nacionalidad.value.trim(),
        telefono: document.querySelector('.ts-control')?.innerText.trim() + ' ' + e.target.phone.value.trim(),
        direccion: e.target.direccion.value.trim(),
        ciudad: e.target.ciudad.value.trim(),
        pais: e.target.pais.value.trim(),
        email: e.target.email.value.toLowerCase().trim(),
      };

      const password = e.target.password.value;

      // Crear cuenta
      const { data, error } = await supabase.auth.signUp({
        email: datos.email,
        password,
        options: {
          emailRedirectTo: "https://b100art.digital/panel"
        }
      });

      if (error) {
        msg.innerHTML = '<span class="error">' + error.message + '</span>';
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        return;
      }

      // Insertar datos
      const { error: dbError } = await supabase
        .from('usuarios')
        .upsert({
          id: data.user.id,
          ...datos,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (dbError) {
        msg.innerHTML = '<span class="error">Cuenta creada pero error al guardar datos extra.</span>';
      } else {
        msg.innerHTML = '<span class="success">¡Cuenta creada! Revisa tu correo.</span>';
      }

      btn.disabled = false;
      btnText.classList.remove('hidden');
      loader.classList.add('hidden');
    });
  </script>
</body>
</html>`;

// ================================
// SERVIDOR
// ================================
serve(async (req) => {
  return new Response(REGISTER_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});
