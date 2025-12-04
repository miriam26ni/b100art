cat > supabase/functions/pagar/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAuthHtml } from "../_shared/auth.ts";
import { supabaseAdmin } from "../_shared/auth.ts";

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Formulario de Pago</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  .dropdown-item:hover { background-color: rgba(255,255,255,0.1); }
</style>
</head>
<body class="bg-[#0c0f17] min-h-screen flex items-center justify-center text-white p-6">
  <div class="w-full max-w-md bg-[#131826] p-8 rounded-2xl shadow-2xl border border-neutral-800">
    <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
      Completar Pago
    </h2>

    <!-- Dropdown Método de Pago -->
    <div class="relative mb-8">
      <button id="dropdownBtn" class="w-full bg-[#1c2333] px-6 py-4 rounded-xl text-left font-semibold flex justify-between items-center text-lg">
        <span id="dropdownText">Seleccionar método de pago</span>
        <svg class="w-6 h-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div id="dropdownMenu" class="hidden absolute top-full left-0 right-0 mt-2 bg-[#1c2333] rounded-xl border border-neutral-700 overflow-hidden z-10">
        <div class="dropdown-item px-6 py-4 cursor-pointer flex items-center gap-3" data-type="credit">Tarjeta de Crédito</div>
        <div class="dropdown-item px-6 py-4 cursor-pointer flex items-center gap-3" data-type="debit">Tarjeta de Débito</div>
      </div>
    </div>

    <!-- Formulario -->
    <form id="paymentForm" class="space-y-6">
      <div>
        <label class="text-sm opacity-80 block mb-2">Nombre en la tarjeta</label>
        <input type="text" required placeholder="Juan Pérez"
               class="w-full px-5 py-4 bg-[#0f1524] rounded-xl border border-neutral-700 focus:outline-none focus:border-blue-500 transition">
      </div>
      <button type="submit" id="payBtn"
              class="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 py-5 rounded-xl font-bold text-xl shadow-lg transform transition hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed">
        Pagar con Stripe
      </button>
    </form>
    <p id="status" class="mt-6 text-center text-sm min-h-[24px]"></p>
  </div>

<script>
const token = '__TOKEN_INYECTADO__';

const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const dropdownText = document.getElementById("dropdownText");
const statusMsg = document.getElementById("status");
const payBtn = document.getElementById("payBtn");

// Dropdown
dropdownBtn.addEventListener("click", () => {
  dropdownMenu.classList.toggle("hidden");
  dropdownBtn.querySelector("svg").classList.toggle("rotate-180");
});

document.querySelectorAll("#dropdownMenu .dropdown-item").forEach(item => {
  item.addEventListener("click", () => {
    const type = item.getAttribute("data-type");
    dropdownText.textContent = type === "credit" ? "Tarjeta de Crédito" : "Tarjeta de Débito";
    dropdownMenu.classList.add("hidden");
    dropdownBtn.querySelector("svg").classList.remove("rotate-180");
  });
});

// Submit → Stripe Checkout
document.getElementById("paymentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (dropdownText.textContent.includes("Seleccionar")) {
    statusMsg.textContent = "Por favor selecciona un método de pago";
    statusMsg.className = "mt-6 text-center text-red-400";
    return;
  }

  payBtn.disabled = true;
  payBtn.textContent = "Redirigiendo a Stripe...";
  statusMsg.textContent = "";

  const item = JSON.parse(localStorage.getItem("checkoutItem") || "null");
  if (!item) {
    statusMsg.textContent = "No hay producto en el carrito";
    statusMsg.className = "mt-6 text-center text-red-400";
    payBtn.disabled = false;
    payBtn.textContent = "Pagar con Stripe";
    return;
  }

  try {
    const res = await fetch("/functions/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        metodo: dropdownText.textContent.includes("Crédito") ? "credit" : "debit",
        imageFile: item.imageUrl,
        imageName: item.title,
        amount: item.price || 1000
      })
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else throw new Error(data.error || "Error desconocido");
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "Error al conectar con Stripe";
    statusMsg.className = "mt-6 text-center text-red-400";
    payBtn.disabled = false;
    payBtn.textContent = "Pagar con Stripe";
  }
});
</script>
</body>
</html>`;

serve(async (req) => {
  const user = await requireAuthHtml(req);
  if (!user) return new Response("Login requerido", { status: 401 });

  const { data: { session } } = await supabaseAdmin.auth.getSession();
  const token = session?.access_token || "";

  const finalHtml = HTML_TEMPLATE.replace("__TOKEN_INYECTADO__", token);

  return new Response(finalHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
