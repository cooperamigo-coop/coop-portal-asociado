import { supabase } from './supabase'

const BUCKET = 'documentos-solicitudes'

/**
 * Sube un documento de soporte al bucket de Supabase Storage.
 * @param {string} solicitudId  - ID de la solicitud en BD
 * @param {string} tipo         - Identificador del documento (ej. 'soporte_laboral', 'liquidacion_matricula')
 * @param {File}   archivo      - Archivo seleccionado por el usuario
 * @returns {Promise<string>}   - URL pública del archivo subido
 */
export async function subirDocumentoSolicitud(solicitudId, tipo, archivo) {
  const ext  = archivo.name.split('.').pop().toLowerCase()
  const ruta = `${solicitudId}/${tipo}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, archivo, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
  return data.publicUrl
}
