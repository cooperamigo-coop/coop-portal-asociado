import { supabase } from './supabase'

const DEFAULT_BUCKET = 'documentos-solicitudes'
const BUCKETS_CANDIDATOS = [
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET,
  DEFAULT_BUCKET,
  'documentos',
  'documentos_solicitudes',
  'documentos-solicitud',
].filter(Boolean)

const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const EXT_PERMITIDAS  = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf'])

// El bucket es privado: la URL firmada se pide a la Edge Function
// obtener-documento-portal (no hay SELECT directo de anon sobre
// storage.objects). "carpeta" es el id de la solicitud o la carpeta
// aleatoria de la solicitud de afiliación — actúa como credencial.
let _bucketConfirmado = null

async function _urlFirmada(carpeta, ruta) {
  const { data, error } = await supabase.functions.invoke('obtener-documento-portal', {
    body: { carpeta, ruta },
  })
  if (error) throw error
  return data.url
}

async function validarPdfSinClave(archivo) {
  if (archivo.type !== 'application/pdf') return
  const buffer = await archivo.slice(0, 4096).arrayBuffer()
  const texto = new TextDecoder('latin1').decode(buffer)
  if (texto.includes('/Encrypt')) {
    const err = new Error('Este documento está bloqueado con clave, elimínela y cárguelo nuevamente.')
    err.esValidacion = true
    throw err
  }
}

export async function subirDocumentoSolicitud(solicitudId, tipo, archivo) {
  const ext = archivo.name.split('.').pop().toLowerCase()
  if (!EXT_PERMITIDAS.has(ext) || !MIME_PERMITIDOS.has(archivo.type)) {
    throw new Error('Solo se permiten imágenes (JPG, PNG, WebP) y PDF.')
  }

  await validarPdfSinClave(archivo)

  const carpeta = String(solicitudId)
  const ruta = `${carpeta}/${tipo}_${Date.now()}.${ext}`

  if (_bucketConfirmado) {
    const { error } = await supabase.storage
      .from(_bucketConfirmado)
      .upload(ruta, archivo)
    if (!error) {
      return await _urlFirmada(carpeta, ruta)
    }
    // Reset on failure so the loop below can try other buckets
    _bucketConfirmado = null
  }

  let ultimoError = null
  for (const bucket of BUCKETS_CANDIDATOS) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(ruta, archivo)
    if (!error) {
      _bucketConfirmado = bucket
      return await _urlFirmada(carpeta, ruta)
    }
    const msg = String(error?.message || '')
    if (msg.includes('Bucket not found') || msg.includes('row-level security') || msg.includes('Unauthorized')) {
      ultimoError = error
      continue
    }
    throw error
  }

  throw ultimoError || new Error('Bucket de Storage no encontrado.')
}

export function obtenerMensajeErrorSubidaDocumento(error) {
  if (error?.esValidacion) return error.message
  const msg = String(error?.message || '')
  if (msg.includes('row-level security policy')) {
    return 'No hay permisos de Storage (RLS) para subir al bucket "documentos". Ajuste las policies en Supabase.'
  }
  if (msg.includes('Bucket not found')) {
    return 'No se encontró el bucket de documentos en Supabase.'
  }
  return 'No se pudo subir el archivo. Verifique su conexión o el tamaño del archivo.'
}
