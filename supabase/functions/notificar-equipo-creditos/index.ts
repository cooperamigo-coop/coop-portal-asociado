import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail } from "../_shared/email-template.ts";

const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL       = "Cooperativa Multiactiva Luis Amigó <no-reply@cooperamigo.coop>";
const ROL_CREDITO      = "003";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtFechaHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Bogota",
    });
  } catch { return iso; }
}

function fmtMoneda(val: unknown): string {
  const n = Number(val) || 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(n);
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
  return res.json();
}

function buildBodyHtml(data: Record<string, unknown>): string {
  const radicado  = esc(data.radicado);
  const nombre    = esc(data.nombre);
  const cedula    = esc(data.cedula);
  const correo    = esc(data.correo);
  const telefono  = esc(data.telefono);
  const tipo      = esc(data.tipo_operacion);
  const monto          = fmtMoneda(data.monto);
  const montoDesembolso = data.monto_desembolso ? fmtMoneda(data.monto_desembolso) : null;
  const plazo          = data.plazo ? `${esc(data.plazo)} meses` : "—";
  const fechaHora = data.fecha_radicacion ? fmtFechaHora(String(data.fecha_radicacion)) : "—";

  const fila = (label: string, value: string) => `
    <tr>
      <td width="40%" style="padding:9px 0;font-size:11px;color:#6B7280;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #F1F5F9;">${label}</td>
      <td style="padding:9px 0;font-size:11px;color:#172B36;font-weight:700;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #F1F5F9;">${value}</td>
    </tr>`;

  return `
    <p style="font-size:13px;color:#172B36;margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;">
      Se ha radicado una nueva solicitud de crédito en el portal. A continuación el resumen:
    </p>

    ${radicado ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#172B36;border-radius:8px;padding:14px 20px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 4px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Número de radicado</p>
          <p style="color:#FFC801;font-size:18px;font-weight:800;letter-spacing:0.06em;margin:0;font-family:Arial,Helvetica,sans-serif;">${radicado}</p>
        </td>
      </tr>
    </table>` : ""}

    <p style="font-size:10px;font-weight:800;color:#172B36;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">Datos del solicitante</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
      ${fila("Nombre completo", nombre || "—")}
      ${fila("Cédula", cedula || "—")}
      ${fila("Correo electrónico", correo || "—")}
      ${fila("Teléfono / Celular", telefono || "—")}
    </table>

    <p style="font-size:10px;font-weight:800;color:#172B36;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">Detalle de la solicitud</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
      ${fila("Tipo de crédito", tipo || "—")}
      ${montoDesembolso
        ? fila("Valor reestructura", monto) + fila("Valor desembolso", montoDesembolso)
        : fila("Monto solicitado", monto)}
      ${fila("Plazo solicitado", plazo)}
      ${fila("Fecha y hora de radicación", fechaHora)}
    </table>

    <p style="font-size:11px;color:#9CA3AF;line-height:1.6;margin:0;font-family:Arial,Helvetica,sans-serif;">
      Esta notificación fue generada automáticamente por el portal de asociados.
    </p>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: relaciones, error: errRel } = await admin
      .from("usuario_roles")
      .select("usuario_id")
      .eq("rol_codigo", ROL_CREDITO);

    if (errRel) throw errRel;
    if (!relaciones?.length) {
      return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = relaciones.map((r: { usuario_id: string }) => r.usuario_id);
    const { data: usuarios, error: errUsers } = await admin
      .from("usuarios")
      .select("email")
      .in("id", ids)
      .eq("activo", true);

    if (errUsers) throw errUsers;

    const bodyHtml = buildBodyHtml(body);
    const subject  = `Nueva solicitud de crédito radicada${body.radicado ? ` — ${body.radicado}` : ""}`;
    const html     = buildEmail({ label: "nueva solicitud de crédito", bodyHtml });

    const envios = await Promise.allSettled(
      (usuarios ?? []).map((u: { email: string }) => sendEmail(u.email, subject, html))
    );

    return new Response(JSON.stringify({
      ok: true,
      enviados: envios.filter(e => e.status === "fulfilled").length,
      fallidos: envios.filter(e => e.status === "rejected").length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
