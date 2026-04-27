import { supabase } from './supabase'

const DEFAULT_BUCKET = 'documentos'
const BUCKETS_CANDIDATOS = [
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET,
  DEFAULT_BUCKET,
  'documentos-solicitudes',
  'documentos_solicitudes',
  'documentos-solicitud',
].filter(Boolean)

const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const EXT_PERMITIDAS  = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf'])

let _bucketConfirmado = null

export async function subirDocumentoSolicitud(solicitudId, tipo, archivo) {
  const ext = archivo.name.split('.').pop().toLowerCase()
  if (!EXT_PERMITIDAS.has(ext) || !MIME_PERMITIDOS.has(archivo.type)) {
    throw new Error('Solo se permiten imágenes (JPG, PNG, WebP) y PDF.')
  }

  const ruta = `${solicitudId}/${tipo}_${Date.now()}.${ext}`

  if (_bucketConfirmado) {
    const { error } = await supabase.storage
      .from(_bucketConfirmado)
      .upload(ruta, archivo, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(_bucketConfirmado).getPublicUrl(ruta)
    return data.publicUrl
  }

  let ultimoError = null
  for (const bucket of BUCKETS_CANDIDATOS) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(ruta, archivo, { upsert: true })
    if (!error) {
      _bucketConfirmado = bucket
      const { data } = supabase.storage.from(bucket).getPublicUrl(ruta)
      return data.publicUrl
    }
    const msg = String(error?.message || '')
    if (msg.includes('Bucket not found')) {
      ultimoError = error
      continue
    }
    throw error
  }

  throw ultimoError || new Error('Bucket de Storage no encontrado.')
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
