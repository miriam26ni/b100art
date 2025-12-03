import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { verifySession } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>B100Art • Digital Landscapes</title>
  <meta name="description" content="Instant-download high-resolution digital landscape artwork."/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root { --gold: #d4af37; --dark: #121212; --gray: #1e1e1e; --light: #f8f8f8; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Inter', sans-serif; background-color: var(--dark); color: #eee; line-height: 1.6; }
    .auth-links { position: absolute; top: 20px; right: 30px; z-index: 10; }
    .auth-links a { color: #ccc; text-decoration: none; padding: 10px 20px; border: 1px solid rgba(212,175,55,0.3); border-radius: 30px; font-size: 0.95rem; transition: all 0.3s; }
    .auth-links a:hover { background: var(--gold); color: #000; border-color: var(--gold); }
    header { background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop'); background-size: cover; background-position: center; height: 90vh; display: flex; align-items: center; justify-content: center; text-align: center; position: relative; }
    header::after { content: 'B100Art'; position: absolute; top: 40px; left: 50%; transform: translateX(-50%); font-family: 'Playfair Display', serif; font-size: 3.5rem; color: var(--gold); letter-spacing: 8px; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
    .hero-text h1 { font-family: 'Playfair Display', serif; font-size: 4rem; margin-bottom: 20px; color: white; }
    .hero-text p { font-size: 1.3rem; margin-bottom: 30px; color: #ddd; }
    .btn { background: var(--gold); color: #000; padding: 14px 36px; border: none; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s; text-decoration: none; display: inline-block; }
    .btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(212,175,55,0.4); }
    section { padding: 100px 5%; max-width: 1400px; margin: 0 auto39; }
    h2 { font-family: 'Playfair Display', serif; font-size: 3rem; text-align: center; margin-bottom: 60px; color: var(--gold); }
    .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; }
    .card { background: var(--gray); border-radius: 16px; overflow: hidden; transition: transform 0.4s, box-shadow 0.4s; position: relative; }
    .card:hover { transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .card img { width: 100%; height: 400px; object-fit: cover; display: block; }
    .card-info { padding: 20px; text-align: center; }
    .price { font-size: 1.8rem; color: var(--gold); margin: 10px 0; font-weight: 600; }
    footer { background: #0a0a0a; padding: 80px 5%; text-align: center; }
    .policies { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; margin-top: 60px; text-align: left; }
    .policy-card { background: var(--gray); padding: 30px; border-radius: 12px; }
    .policy-card h3 { color: var(--gold); margin-bottom: 15px; font-size: 1.5rem; }
    @media (max-width: 768px) { header::after { font-size: 2.5rem; } .hero-text h1 { font-size: 2.8rem; } }
  </style>
</head>
<body>
  <div class="auth-links">
    <a href="#" id="logoutBtn">Logout</a>
  </div>
  <header>
    <div class="hero-text">
      <h1>Instant Digital Landscapes</h1>
      <p>Instant-download high-resolution digital artwork delivered immediately after purchase.</p>
      <a href="#gallery" class="btn">Explore Collection</a>
    </div>
  </header>
  <section id="gallery">
    <h2>Our Collection</h2>
    <div class="gallery">
      <div class="card">
        <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074" alt="Misty Forest Dawn">
        <div class="card-info">
          <h3>Misty Forest Dawn</h3>
          <p class="price">$10 USD</p>
          <button class="btn buy-btn"
                  data-file="misty-forest-dawn.jpg"
                  data-title="Misty Forest Dawn">
            Buy & Download
          </button>
        </div>
      </div>
      <div class="card">
        <img src="https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=2070" alt="Aurora Reflections">
        <div class="card-info">
          <h3>Aurora Reflections</h3>
          <p class="price">$10 USD</p>
          <button class="btn buy-btn"
                  data-file="aurora-reflections.jpg"
                  data-title="Aurora Reflections">
            Buy & Download
          </button>
        </div>
      </div>
      <div class="card">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070" alt="Tropical Beach Palms">
        <div class="card-info">
          <h3>Tropical Beach Palms</h3>
          <p class="price">$10 USD</p>
          <button class="btn buy-btn"
                  data-file="tropical-beach-palms.jpg"
                  data-title="Tropical Beach Palms">
            Buy & Download
          </button>
        </div>
      </div>
    </div>
  </section>
  <footer>
    <h2>Policies & Info</h2>
    <div class="policies">
      <div class="policy-card"><h3>Instant Delivery</h3><p>Instant download after purchase.</p></div>
      <div class="policy-card"><h3>Refund Policy</h3><p>Refunds only in exceptional cases.</p></div>
      <div class="policy-card"><h3>Contact</h3><p>Email: <a href="mailto:hello@b100art.digital" style="color:var(--gold)">hello@b100art.digital</a></p></div>
    </div>
    <p style="margin-top:60px; opacity:0.6;">© 2025 B100Art • All rights reserved</p>
  </footer>

  <script>
    const token = '{{TOKEN_INYECTADO}}' || null;

    document.getElementById("logoutBtn").addEventListener("click", e => {
      e.preventDefault();
      localStorage.clear();
      location.href = "/";
    });

    document.querySelectorAll(".buy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const file = btn.dataset.file;
        const title = btn.dataset.title;
        localStorage.setItem("b100art_purchase", JSON.stringify({ file, title }));
        location.href = "/functions/v1/pagar";
      });
    });
  </script>
</body>
</html>`;

serve(async (req) => {
  const user = await verifySession(req);
  if (!user) {
    return new Response("Login requerido", { status: 401 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";

  const finalHtml = HTML.replace('{{TOKEN_INYECTADO}}', token);

  return new Response(finalHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});
