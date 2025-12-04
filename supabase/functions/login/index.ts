import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cliente con ANON_KEY (respeta RLS y permite signIn)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

// ==============================
//  HTML COMPLETO DEL LOGIN
// ==============================
const LOGIN_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login • B100Art</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <style>
    body { background: #0a0a0a; color: white; min-height: 100vh; font-family: system-ui, sans-serif; }
    .glass { background: rgba(30, 30, 50, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(139, 92, 246, 0.3); }
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #a855f7; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body class="flex items-center justify-center min-h-screen p-6">
  <div class="glass p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border-purple-600">
    <i class="fas fa-user-circle text-8xl text-purple-400 mb-6"></i>
    <h1 class="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
      Bienvenidos
    </h1>
    <div id="loginForm">
      <input type="email" id="email" placeholder="Tu correo" required autocomplete="email"
             class="w-full px-6 py-5 rounded-xl bg-gray-900/80 text-white text-lg mb-4 focus:outline-none focus:ring-4 focus:ring-purple-600 transition">

      <input type="password" id="pass" placeholder="Contraseña" required autocomplete="current-password"
             class="w-full px-6 py-5 rounded-xl bg-gray-900/80 text-white text-lg mb-6 focus:outline-none focus:ring-4 focus:ring-purple-600 transition">

      <button type="button" id="loginBtn"
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-5 rounded-xl font-bold text-xl shadow-2xl transition transform hover:scale-105 flex items-center justify-center gap-3">
        <span id="btnText">Ingresar</span>
        <div id="loader" class="hidden loader"></div>
      </button>

      <p id="errorMsg" class="mt-4 text-red-400 font-medium hidden"></p>
    </div>

    <p class="mt-6 text-sm text-gray-400">B100Art • Todos los derechos reservados 2025</p>
  </div>

  <script type="module">
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

    const supabase = createClient(
      "https://vfnouwdawgkrtexudfkj.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbm91d2Rhd2drcnRleHVkZmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3MTU0MDAsImV4cCI6MjA0OTI5MTQwMH0.1sE9i4fL4n5j0q2w7x8y9z0a1b2c3d4e5f6g7h8i9j0"
    );

    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('errorMsg');

    async function login() {
      errorMsg.classList.add('hidden');
      btn.disabled = true;
      btnText.classList.add('hidden');
      loader.classList.remove('hidden');

      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('pass').value;

      if (!email || !password) {
        showError("Por favor completa ambos campos");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let msg = "Credenciales incorrectas";

        if (error.message.includes("Email not confirmed"))
          msg = "Por favor confirma tu correo primero";

        if (error.message.includes("Invalid login credentials"))
          msg = "Correo o contraseña incorrectos";

        showError(msg);
        return;
      }

      // Redirección según usuario
      if (data.user?.email === "miriam26ni@gmail.com") {
        window.location.href = "/admin.html";
      } else {
        window.location.href = "/panel";
      }
    }

    function showError(text) {
      errorMsg.textContent = text;
      errorMsg.classList.remove('hidden');
      btn.disabled = false;
      btnText.classList.remove('hidden');
      loader.classList.add('hidden');
    }

    btn.addEventListener('click', login);

    document.addEventListener('keypress', e => {
      if (e.key === 'Enter') login();
    });
  </script>
</body>
</html>`;
  
// ==============================
//   SERVIDOR FUNCTION
// ==============================
serve(async () => {
  return new Response(LOGIN_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});
