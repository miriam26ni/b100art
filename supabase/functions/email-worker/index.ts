import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuración Supabase
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = "bbateria2026@gmail.com";

console.log("Email worker activo – producción v5 (robusto + logs de payloads)");

// Servir worker
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    console.warn("Payload no JSON recibido");
    return new Response("Payload no válido", { status: 400 });
  }

  // Identificar evento y payload
  const event = body.type === "postgres_changes" ? body.record : body;
  const email = event?.new ?? event;

  if (!email || typeof email !== "object") {
    console.warn("Payload inválido o vacío recibido:", body);
    return new Response("Payload vacío o inválido", { status: 400 });
  }

  try {
    // ==============================
    // Evento usuario llega al 100%
    // ==============================
    if (body.event === "user_100" || body.eventName === "user_100") {
      if (!email.user_id) {
        console.warn("Evento user_100 sin user_id:", body);
        return new Response("user_id faltante", { status: 400 });
      }

      // Obtener usuario
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("nombre, email")
        .eq("id", email.user_id)
        .single();

      const nombreCompleto = usuario?.nombre?.trim() || "Anónimo";
      const emailUsuario = usuario?.email || "sin-email@desconocido.com";

      // Email al usuario
      email.to_email = emailUsuario;
      email.subject = `¡Felicidades ${nombreCompleto}! Llegaste al 100% 🎉`;
      email.html = `
        <h2>¡Enhorabuena, ${nombreCompleto}!</h2>
        <p>Has completado la batería al 100%. ¡Eres uno de los primeros!</p>
        <p>Si no tienes método de pago envía país e identificacion o envía tu método de pago preferido (PayPal, Cash App, Zelle.) junto con tu identificación a:</p>
        <p><strong>bbateria2026@gmail.com</strong></p>
        <p>¡Gracias por participar!</p>
        <p>— El equipo de B100Art</p>
      `;

      // Email al admin
      const adminEmail = {
        to_email: ADMIN_EMAIL,
        subject: `🚨 Usuario completó 100%: ${nombreCompleto}`,
        html: `
          <h3>Nuevo usuario completó la batería al 100%</h3>
          <p><strong>Nombre completo:</strong> ${nombreCompleto}</p>
          <p><strong>Email:</strong> ${emailUsuario}</p>
          <p><strong>User ID:</strong> ${email.user_id}</p>
          <p><strong>Fecha y hora (UTC):</strong> ${new Date().toISOString()}</p>
          <hr>
          <p>El usuario ya recibió instrucciones para enviar su método de pago.</p>
          <p>Revisa <strong>bbateria2026@gmail.com</strong> para su respuesta.</p>
        `
      };

      await enviarEmail(adminEmail);
      await enviarEmail(email);

      return new Response("Emails enviados: usuario + admin (robusto)", { status: 200 });
    }

    // ==============================
    // Otros emails en cola
    // ==============================
    if (!email.id || !email.to_email || !email.subject || !email.html) {
      console.warn("Email inválido o incompleto:", email);
      return new Response("Datos incompletos", { status: 200 });
    }

    if (!["pending", "failed"].includes(email.status ?? "pending")) {
      return new Response("Estado no procesado", { status: 200 });
    }

    // Lock transaccional
    const { data: locked, error: lockError } = await supabase
      .from("email_queue")
      .update({ status: "sending" })
      .eq("id", email.id)
      .in("status", ["pending", "failed"])
      .select("id")
      .single();

    if (lockError || !locked) {
      console.log("Email ya procesado por otro worker:", email.id);
      return new Response("Tomado por otro worker", { status: 200 });
    }

    await enviarEmail(email);

    return new Response("ok", { status: 200 });

  } catch (err: any) {
    console.error("CRASH TOTAL email-worker:", err, "Payload:", body);
    return new Response("Error interno – se reintentará", { status: 200 });
  }

  // ==============================
  // Función auxiliar de envío
  // ==============================
  async function enviarEmail(emailData: any) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "B100Art <hola@b100art.digital>",
          to: emailData.to_email.trim(),
          subject: emailData.subject,
          html: emailData.html,
          tags: [{ name: "worker_id", value: "email-worker-v5" }],
        }),
      });

      const resendData = await res.json();

      if (!res.ok) throw new Error(JSON.stringify(resendData));

      // Éxito
      await supabase
        .from("email_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_id: resendData.id,
          last_error: null,
          attempts: (emailData.attempts || 0) + 1,
        })
        .eq("id", emailData.id || "no-id");

      console.log(`ENVIADO → ${emailData.to_email} | Resend ID: ${resendData.id}`);

    } catch (err: any) {
      await supabase
        .from("email_queue")
        .update({
          status: "failed",
          last_error: err.message || JSON.stringify(err),
          attempts: (emailData.attempts || 0) + 1,
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .eq("id", emailData.id || "no-id");

      console.error(`FALLÓ envío a ${emailData.to_email} (intentos: ${(emailData.attempts || 0) + 1})`, err);
    }
  }
});
