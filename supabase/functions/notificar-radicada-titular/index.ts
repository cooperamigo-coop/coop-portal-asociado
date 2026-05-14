import { buildEmail } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Cooperativa Multiactiva Luis Amigó <no-reply@cooperamigo.coop>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend: ${err}`);
  }
  return res.json();
}

function escaparHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Bogota",
    });
  } catch {
    return iso;
  }
}

const PASOS = [
  "Recepción de la solicitud y validación inicial.",
  "Revisión de información y documentos.",
  "Análisis de riesgo y capacidad de pago.",
  "Aprobación y formalización del crédito.",
  "Desembolso (si aplica) y notificación de resultado.",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      to,
      nombre,
      radicado,
      fecha_solicitud_iso,
      requiere_codeudores,
      num_codeudores,
    } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: "Missing: to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nombreSeguro   = escaparHtml(nombre);
    const radicadoSeguro = radicado ? escaparHtml(String(radicado)) : null;
    const fechaFmt       = fecha_solicitud_iso ? formatFecha(fecha_solicitud_iso) : null;
    const numCod         = Number(num_codeudores) || 0;
    const textoCodeudores = requiere_codeudores
      ? `Se ha registrado la participación de ${numCod} codeudor${numCod === 1 ? "" : "es"} en esta solicitud.`
      : null;

    const bodyHtml = `
      <p style="font-size:13px;color:#172B36;margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;">
        Estimado(a) <strong>${nombreSeguro}</strong>,
      </p>
      <p style="font-size:13px;color:#4B5563;line-height:1.6;margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;">
        Tu solicitud de crédito ha sido
        <strong style="color:#1a7a4a;">radicada exitosamente</strong>${radicadoSeguro ? " con el siguiente número:" : "."}
      </p>

      ${radicadoSeguro ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td style="background:#172B36;border-radius:8px;padding:16px 20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.5);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 6px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Número de radicado</p>
            <p class="em-big" style="color:#FFC801;font-size:20px;font-weight:800;letter-spacing:0.06em;margin:0;font-family:Arial,Helvetica,sans-serif;">${radicadoSeguro}</p>
          </td>
        </tr>
      </table>
      ` : ""}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
        ${fechaFmt ? `
        <tr>
          <td width="40%" style="padding:9px 0;font-size:11px;color:#6B7280;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #F1F5F9;">Fecha de radicación</td>
          <td style="padding:9px 0;font-size:11px;color:#172B36;font-weight:700;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #F1F5F9;">${fechaFmt}</td>
        </tr>
        ` : ""}
        ${textoCodeudores ? `
        <tr>
          <td style="padding:9px 0;font-size:11px;color:#6B7280;font-family:Arial,Helvetica,sans-serif;">Codeudores</td>
          <td style="padding:9px 0;font-size:11px;color:#172B36;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${escaparHtml(textoCodeudores)}</td>
        </tr>` : ""}
      </table>

      <p style="font-size:12px;font-weight:800;color:#172B36;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">¿Qué sigue?</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        ${PASOS.map((paso, i) => `
        <tr>
          <td valign="top" width="22" style="padding:5px 8px 5px 0;font-size:11px;font-weight:800;color:#114C5A;font-family:Arial,Helvetica,sans-serif;">${i + 1}.</td>
          <td style="padding:5px 0;font-size:11px;color:#4B5563;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">${paso}</td>
        </tr>`).join("")}
      </table>

      <p style="font-size:11px;color:#9CA3AF;line-height:1.6;margin:0;font-family:Arial,Helvetica,sans-serif;">
        Para consultas o más información:
        <a href="mailto:info@cooperamigo.coop" style="color:#172B36;font-weight:600;text-decoration:none;">info@cooperamigo.coop</a>
      </p>
    `;

    await sendEmail(
      to,
      "Cooperamigó — Solicitud de crédito radicada",
      buildEmail({ label: "confirmación de solicitud", bodyHtml }),
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
