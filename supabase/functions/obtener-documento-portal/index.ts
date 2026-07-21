import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKET = "documentos-solicitudes";
// Vigencia larga: la URL se persiste en la fila de la solicitud y se
// reutiliza para previsualizar el documento semanas/meses después.
const VIGENCIA_SEGUNDOS = 60 * 60 * 24 * 365 * 10; // 10 años

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { carpeta, ruta } = await req.json();

    if (typeof carpeta !== "string" || typeof ruta !== "string" || !carpeta || !ruta) {
      return new Response(JSON.stringify({ error: "carpeta y ruta son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // La carpeta actúa como credencial: solo quien la conoce (generada
    // aleatoriamente en el cliente al iniciar la solicitud, o el id real de
    // la solicitud de crédito) puede pedir firmas de rutas dentro de ella.
    // Bloquea además cualquier intento de path traversal.
    const carpetaSegura = carpeta.replace(/[^a-zA-Z0-9_-]/g, "");
    if (carpetaSegura !== carpeta || !ruta.startsWith(`${carpeta}/`) || ruta.includes("..")) {
      return new Response(JSON.stringify({ error: "Ruta inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(ruta, VIGENCIA_SEGUNDOS);

    if (error) throw error;

    return new Response(JSON.stringify({ url: data.signedUrl }), {
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
