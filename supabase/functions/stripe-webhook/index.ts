// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  // --- ID de evento para idempotencia ---
  const eventId = event.id;

  // Revisar si ya se procesó este evento
  const { data: existingEvent } = await supabase
    .from("stripe_webhook_logs")
    .select("id")
    .eq("event_id", eventId)
    .single();

  if (existingEvent) {
    console.log(`Evento ya procesado: ${eventId}`);
    return new Response("Already processed", { status: 200 });
  }

  try {
    let userId: string | undefined;
    let pagoId: string | undefined;

    // --- Checkout moderno ---
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      userId = session.metadata?.user_id;
      pagoId = session.metadata?.pago_id;
    }

    // --- Compatibilidad con Payment Links antiguos ---
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      userId = pi.metadata?.user_id;
      pagoId = pi.metadata?.pago_id;
    }

    if (!userId || !pagoId) {
      console.warn("Metadata incompleta", eventId);

      await supabase.from("stripe_webhook_logs").insert({
        event_id: eventId,
        event_type: event.type,
        user_id: userId || null,
        pago_id: pagoId || null,
        processed_at: new Date().toISOString(),
        status: "error",
        error_text: "Missing metadata",
      });

      return new Response("Missing metadata", { status: 400 });
    }

    // --- Actualizar pago ---
    const { error: updateError } = await supabase
      .from("pagos")
      .update({ aprobado: true })
      .eq("id", pagoId)
      .eq("user_id", userId);

    // --- ✅ MENSAJE AUTOMÁTICO AL USUARIO (ÚNICO CAMBIO) ---
    if (!updateError) {
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("email")
        .eq("id", userId)
        .single();

      if (usuarioData?.email) {
        await supabase.rpc("queue_email", {
          to_email: usuarioData.email,
          subject: "¡Pago recibido!",
          html: `<h1>¡Pago recibido!</h1>
                 <p>Enlace a tu batería:</p>
                 <a href="https://b100art.digital/bateria">
                 https://b100art.digital/bateria</a>`
        });
      }
    }

    // --- Registrar log de auditoría ---
    await supabase.from("stripe_webhook_logs").insert({
      event_id: eventId,
      event_type: event.type,
      user_id: userId,
      pago_id: pagoId,
      processed_at: new Date().toISOString(),
      status: updateError ? "error" : "success",
      error_text: updateError ? updateError.message : null,
    });

    if (updateError) {
      console.error("Error DB:", updateError);
      return new Response("DB Error", { status: 500 });
    }

    console.log(`Pago aprobado → user:${userId} pago:${pagoId} evento:${eventId}`);
    return new Response("OK", { status: 200 });

  } catch (err: any) {
    console.error("Error procesando webhook:", err);

    await supabase.from("stripe_webhook_logs").insert({
      event_id: eventId,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: "error",
      error_text: err.message?.slice(0, 500),
    });

    return new Response("Internal error", { status: 500 });
  }
});

