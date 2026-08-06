import { useCallback, useEffect, useMemo, useState } from 'react'
import { type FileError, type FileRejection, useDropzone } from 'react-dropzone'
import { supabase } from '@/db/supabase'

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
}

type UseFirebaseUploadOptions = {
  /** Chemin dans Firebase Storage, ex: "preuves/plainte_id" */
  path: string
  /** MIME types autorisés (ex: "image/png", "image/*"). Par défaut tous. */
  allowedMimeTypes?: string[]
  /** Taille max par fichier en octets */
  maxFileSize?: number
  /** Nombre max de fichiers */
  maxFiles?: number
  /** Écraser si le fichier existe déjà */
  upsert?: boolean
}

type UseFirebaseUploadReturn = ReturnType<typeof useFirebaseUpload>

const useFirebaseUpload = (options: UseFirebaseUploadOptions) => {
  const {
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
  } = options

  const [files, setFiles]         = useState<FileWithPreview[]>([])
  const [loading, setLoading]     = useState<boolean>(false)
  const [errors, setErrors]       = useState<{ name: string; message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])
  // URLs de téléchargement Firebase après upload réussi
  const [downloadURLs, setDownloadURLs] = useState<Record<string, string>>({})

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) return false
    return errors.length === 0 && successes.length === files.length
  }, [errors.length, successes.length, files.length])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          ;(file as FileWithPreview).preview = URL.createObjectURL(file)
          ;(file as FileWithPreview).errors = []
          return file as FileWithPreview
        })

      const invalidFiles = fileRejections.map(({ file, errors: errs }) => {
        ;(file as FileWithPreview).preview = URL.createObjectURL(file)
        ;(file as FileWithPreview).errors = errs
        return file as FileWithPreview
      })

      setFiles((prev) => [...prev, ...validFiles, ...invalidFiles])
    },
    [files]
  )

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles !== 1,
  })

  const onUpload = useCallback(async () => {
    setLoading(true)

    const filesWithErrors  = errors.map((x) => x.name)
    const filesToUpload = filesWithErrors.length > 0
      ? [...files.filter((f) => filesWithErrors.includes(f.name)), ...files.filter((f) => !successes.includes(f.name))]
      : files

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        try {
          const snakeName = file.name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '_')
          const filePath  = `${path}/${snakeName}`
          const { error: upErr } = await supabase.storage
            .from('preuves')
            .upload(filePath, file, { contentType: file.type, upsert: true })
          if (upErr) throw new Error(upErr.message)
          const url = supabase.storage.from('preuves').getPublicUrl(filePath).data.publicUrl
          setDownloadURLs((prev) => ({ ...prev, [file.name]: url }))
          return { name: file.name, message: undefined }
        } catch (err: unknown) {
          return { name: file.name, message: err instanceof Error ? err.message : 'Erreur upload' }
        }
      })
    )

    const responseErrors = responses.filter((x) => x.message !== undefined)
    setErrors(responseErrors as { name: string; message: string }[])

    const newSuccesses = Array.from(new Set([
      ...successes,
      ...responses.filter((x) => x.message === undefined).map((x) => x.name),
    ]))
    setSuccesses(newSuccesses)
    setLoading(false)
  }, [files, path, errors, successes])

  useEffect(() => {
    if (files.length === 0) { setErrors([]); return }
    if (files.length <= maxFiles) {
      let changed = false
      const newFiles = files.map((file) => {
        if (file.errors.some((e) => e.code === 'too-many-files')) {
          file.errors = file.errors.filter((e) => e.code !== 'too-many-files')
          changed = true
        }
        return file
      })
      if (changed) setFiles(newFiles)
    }
  }, [files.length, maxFiles])

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    downloadURLs,
    maxFileSize,
    maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

// Alias rétrocompatible pour ne pas casser dropzone.tsx
const useSupabaseUpload = useFirebaseUpload
type UseSupabaseUploadOptions = UseFirebaseUploadOptions
type UseSupabaseUploadReturn  = UseFirebaseUploadReturn

export {
  useFirebaseUpload,
  useSupabaseUpload,
  type UseFirebaseUploadOptions,
  type UseSupabaseUploadOptions,
  type UseFirebaseUploadReturn,
  type UseSupabaseUploadReturn,
}
