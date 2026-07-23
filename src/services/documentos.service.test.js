import { describe, it, expect, vi, beforeEach } from 'vitest'

// El servicio real importa el cliente de Supabase, que exige variables de
// entorno y hace llamadas de red. Para probar solo la lógica de validación
// de archivos (extensión, tipo, tamaño, PDF cifrado) reemplazamos ese cliente
// por uno falso — así la prueba es rápida, no depende de internet ni de
// credenciales reales, y no toca ningún dato de producción.
const uploadMock = vi.fn()
const invokeMock = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload: uploadMock }) },
    functions: { invoke: invokeMock },
  },
}))

const { subirDocumentoSolicitud, obtenerMensajeErrorSubidaDocumento } = await import('./documentos.service')

function crearArchivo(nombre, tipo, contenido = 'contenido', size = null) {
  const archivo = new File([contenido], nombre, { type: tipo })
  if (size !== null) Object.defineProperty(archivo, 'size', { value: size })
  return archivo
}

beforeEach(() => {
  uploadMock.mockReset()
  invokeMock.mockReset()
})

describe('subirDocumentoSolicitud — validaciones antes de tocar Storage', () => {
  it('rechaza una extensión no permitida (ej. .exe)', async () => {
    const archivo = crearArchivo('virus.exe', 'application/x-msdownload')
    await expect(subirDocumentoSolicitud('sol-1', 'cedula_frente', archivo))
      .rejects.toThrow('Solo se permiten imágenes')
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('rechaza cuando la extensión es válida pero el MIME no coincide (spoofing)', async () => {
    // Un archivo renombrado a .jpg pero cuyo Content-Type real no es de imagen
    const archivo = crearArchivo('foto.jpg', 'application/x-msdownload')
    await expect(subirDocumentoSolicitud('sol-1', 'cedula_frente', archivo))
      .rejects.toThrow('Solo se permiten imágenes')
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('rechaza un archivo que excede el tamaño máximo (8MB)', async () => {
    const archivo = crearArchivo('foto.jpg', 'image/jpeg', 'x', 9 * 1024 * 1024)
    await expect(subirDocumentoSolicitud('sol-1', 'cedula_frente', archivo))
      .rejects.toThrow('pesa demasiado')
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('rechaza un PDF protegido con contraseña', async () => {
    // "/Encrypt" es el marcador estándar de PDF cifrado dentro de sus primeros bytes
    const archivo = crearArchivo('doc.pdf', 'application/pdf', '%PDF-1.4 /Encrypt 0 0 R')
    await expect(subirDocumentoSolicitud('sol-1', 'cedula_frente', archivo))
      .rejects.toThrow('bloqueado con clave')
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('acepta un PDF sin cifrar y sube el archivo', async () => {
    uploadMock.mockResolvedValue({ error: null })
    invokeMock.mockResolvedValue({ data: { url: 'https://signed-url.example.com/x' }, error: null })

    const archivo = crearArchivo('doc.pdf', 'application/pdf', '%PDF-1.4 contenido normal')
    const url = await subirDocumentoSolicitud('sol-1', 'cedula_frente', archivo)

    expect(url).toBe('https://signed-url.example.com/x')
    expect(uploadMock).toHaveBeenCalledTimes(1)
  })

  it('acepta una imagen JPEG válida y dentro del tamaño permitido', async () => {
    uploadMock.mockResolvedValue({ error: null })
    invokeMock.mockResolvedValue({ data: { url: 'https://signed-url.example.com/y' }, error: null })

    const archivo = crearArchivo('foto.jpg', 'image/jpeg', 'x', 2 * 1024 * 1024)
    const url = await subirDocumentoSolicitud('sol-1', 'cedula_frente', archivo)

    expect(url).toBe('https://signed-url.example.com/y')
  })
})

describe('obtenerMensajeErrorSubidaDocumento', () => {
  it('devuelve el mensaje original cuando el error viene de una validación de negocio', () => {
    const error = new Error('Este documento está bloqueado con clave, elimínela y cárguelo nuevamente.')
    error.esValidacion = true
    expect(obtenerMensajeErrorSubidaDocumento(error)).toBe(error.message)
  })

  it('devuelve un mensaje genérico (sin detalle técnico) ante un error de configuración de Storage', () => {
    const error = new Error('Bucket not found')
    const mensaje = obtenerMensajeErrorSubidaDocumento(error)
    expect(mensaje).not.toContain('Bucket not found')
    expect(mensaje).toContain('Intenta de nuevo')
  })

  it('devuelve un mensaje genérico ante cualquier otro error inesperado', () => {
    const error = new Error('network timeout at 10.0.0.1:5432')
    const mensaje = obtenerMensajeErrorSubidaDocumento(error)
    expect(mensaje).not.toContain('10.0.0.1')
  })
})
