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

// Fotos de cámara de celular (sobre todo HEIC/JPEG sin comprimir) pueden pesar
// 10-20MB — sin este límite se intentan subir completas sobre datos móviles
// antes de fallar en el servidor, con un mensaje genérico y sin aviso previo.
const TAMANO_MAXIMO_MB    = 8
const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024

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
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    const err = new Error(`El archivo pesa demasiado (máximo ${TAMANO_MAXIMO_MB}MB). Reduce el tamaño o toma la foto con menor calidad e intenta de nuevo.`)
    err.esValidacion = true
    throw err
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
  // El detalle técnico queda en consola para diagnóstico — el usuario final
  // solo necesita saber que algo falló y qué puede intentar.
  if (msg.includes('row-level security policy') || msg.includes('Bucket not found')) {
    console.error('[documentos.service] Error de configuración de Storage:', msg)
    return 'No pudimos guardar el documento en este momento. Intenta de nuevo en unos minutos o contáctanos si el problema persiste.'
  }
  console.error('[documentos.service] Error al subir documento:', msg)
  return 'No se pudo subir el archivo. Verifica tu conexión e intenta de nuevo.'
}
