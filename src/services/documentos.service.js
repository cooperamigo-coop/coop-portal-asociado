import { supabase } from './supabase'

const DEFAULT_BUCKET = 'documentos'
const BUCKETS_CANDIDATOS = [
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET,
  DEFAULT_BUCKET,
  'documentos-solicitudes',
  'documentos_solicitudes',
  'documentos-solicitud',
].filter(Boolean)

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

  let ultimoError = null
  let bucketUsado = null

  for (const bucket of BUCKETS_CANDIDATOS) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(ruta, archivo, { upsert: true })
    if (!error) {
      bucketUsado = bucket
      break
    }
    const msg = String(error?.message || '')
    if (msg.includes('Bucket not found')) {
      ultimoError = error
      continue
    }
    throw error
  }

  if (!bucketUsado) {
    throw ultimoError || new Error('Bucket de Storage no encontrado.')
  }

  const { data } = supabase.storage.from(bucketUsado).getPublicUrl(ruta)
  return data.publicUrl
}

export function obtenerMensajeErrorSubidaDocumento(error) {
  const msg = String(error?.message || '')
  if (msg.includes('row-level security policy')) {
    return 'No hay permisos de Storage (RLS) para subir al bucket "documentos". Ajuste las policies en Supabase.'
  }
  if (msg.includes('Bucket not found')) {
    return 'No se encontró el bucket de documentos en Supabase.'
  }
  return 'No se pudo subir el archivo. Verifique su conexión o el tamaño del archivo.'
}
