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
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Batería</title>
<style>
  :root{--green:#0f0;--green-light:#8f8;--dark:#111;--darker:#0a0a0a;--border:#333}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#000;color:white;min-height:100dvh;display:flex;flex-direction:column;font-family:system-ui,sans-serif}
  header,footer{padding:1rem;text-align:center}
  main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;gap:2rem}
  .b{width:260px;height:520px;background:var(--dark);border:12px solid var(--border);border-radius:50px;position:relative;overflow:hidden;box-shadow:0 0 40px rgba(0,255,0,0.3)}
  .b::before{content:'';position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:100px;height:40px;background:var(--border);border-radius:20px}
  .f-container{position:absolute;bottom:0;left:0;width:100%;height:100%;display:flex;flex-direction:column-reverse;align-items:center;padding:8px 0;gap:2px}
  .f-bar{width:90%;height:0;background:linear-gradient(to top,var(--green),var(--green-light));border-radius:6px;opacity:0;transition:height 1s ease,opacity .6s;box-shadow:0 0 15px rgba(0,255,0,0.6);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000}
  .f-bar.loaded{opacity:1}
  .empty{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;font-size:1.2rem;opacity:.6}
  .empty small{display:block;font-size:.85rem;margin-top:.3rem;opacity:.8}
  #pay-button{background:var(--green);color:black;border:none;padding:1rem 2rem;font-size:1.2rem;font-weight:bold;border-radius:50px;cursor:pointer;box-shadow:0 10px 30px rgba(0,255,0,0.4);transition:all .3s}
  #pay-button:hover{transform:translateY(-3px)}
  #pay-button:disabled{opacity:.6;cursor:not-allowed}
  .modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);align-items:center;justify-content:center;z-index:999}
  .modal-content{background:var(--darker);padding:2rem;border-radius:20px;text-align:center;width:90%;max-width:400px;box-shadow:0 20px 60px rgba(0,255,0,0.3)}
  .modal input{width:100%;padding:1rem;margin:1rem 0;border-radius:12px;border:none;background:#222;color:white;font-size:1.2rem;text-align:center}
  .modal button{background:var(--green);color:black;border:none;padding:.9rem 1.8rem;margin:.5rem;border-radius:50px;font-weight:bold;cursor:pointer}
  .user-info{position:absolute;top:20px;right:20px;font-size:.9rem;opacity:.7;background:rgba(0,0,0,.5);padding:.3rem .8rem;border-radius:8px}
</style>
</head>
<body>
<header><h1>Batería</h1><div class="user-info" id="user-info">Cargando...</div></header>
<main>
  <div class="b"><div id="f-container" class="f-container"><div class="empty"></div></div></div>
  <button id="pay-button"></button>
</main>
<div id="pay-modal" class="modal">
  <div class="modal-content">
    <h3>¿Cuánto quieres pagar?</h3>
    <input type="number" id="monto-input" min="1" value="10" placeholder="10"/>
    <div><button onclick="confirmarPago()">Confirmar</button><button onclick="cerrarModal()">Cancelar</button></div>
  </div>
</div>
<footer><small></small></footer>
<script type="module">
const token = '{{TOKEN_INYECTADO}}' || null
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
const supabase = createClient('https://jkiwfvolipgttkyxcndc.supabase.co','YOUR_SERVICE_ROLE_KEY',{
  global:{headers:{Authorization:`Bearer ${token}`}}
})
const container=document.getElementById('f-container'),payButton=document.getElementById('pay-button'),modal=document.getElementById('pay-modal'),userInfo=document.getElementById('user-info')
let user=null
async function init(){const {data:{user:u}}=await supabase.auth.getUser();if(!u){location.href='/login';return}user=u;userInfo.textContent=user.user_metadata?.full_name||user.email.split('@')[0]
supabase.channel(`bateria-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'bateria_posiciones',filter:`user_id=eq.${user.id}`},()=>renderBateria()).subscribe();renderBateria()}
async function renderBateria(){if(!user)return;const{data,error}=await supabase.from('bateria_posiciones').select('posicion').eq('user_id',user.id).order('posicion',{ascending:true})
if(error)return console.error(error);container.innerHTML=data.length===0?'<div class="empty">Aún no tienes posiciones<br><small>Paga para empezar</small></div>':''
data.forEach((row,i)=>{const bar=document.createElement('div');bar.className='f-bar';bar.textContent=`${row.posicion}%`;container.appendChild(bar)
setTimeout(()=>{bar.style.height=`${row.posicion}%`;bar.classList.add('loaded')},50+i*80)})}
payButton.onclick=()=>{modal.style.display='flex';document.getElementById('monto-input').select()}
window.cerrarModal=()=>modal.style.display='none'
modal.onclick=e=>e.target===modal&&cerrarModal()
window.confirmarPago=async()=>{const monto=Number(document.getElementById('monto-input').value);if(isNaN(monto)||monto<1)return alert('Monto inválido')
modal.style.display='none';payButton.disabled=true;payButton.textContent='Enviando...'
const{error}=await supabase.from('pending_payments').insert({user_id:user.id,monto,metodo:'manual'})
error?alert('Error'):alert(`¡Pago de $${monto} enviado!`)
payButton.disabled=false;payButton.textContent='Pagar y subir'}
init()
</script>
</body>
</html>`;

serve(async (req) => {
  const user = await verifySession(req);
  if (!user) return new Response("Login requerido", { status: 401 });

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const finalHtml = HTML.replace("{{TOKEN_INYECTADO}}", token);

  return new Response(finalHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
