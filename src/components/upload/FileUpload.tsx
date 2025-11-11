'use client'

import { useCallback, useState } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileWithPreview extends File {
  preview?: string
  uploadProgress?: number
  status?: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface FileUploadProps {
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  onFilesChange?: (files: FileWithPreview[]) => void
  allowedTypes?: string[]
  jobId?: string
}

export function FileUpload({
  accept = '*',
  maxSize = 100, // 100MB default
  maxFiles = 10,
  onFilesChange,
  allowedTypes = ['GNSS', 'RINEX', 'CSV', 'photo', 'field_notes', 'PDF'],
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxSize}MB` }
    }

    // Check file type (basic validation by extension)
    const extension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = [
      'rinex', 'rnx', 'obs', 'nav', // GNSS/RINEX
      'csv', 'txt', 'dat', // Data files
      'jpg', 'jpeg', 'png', 'tiff', // Photos
      'pdf', 'doc', 'docx', // Documents
      'raw', 'ubx', // Raw GNSS
    ]

    if (extension && !validExtensions.includes(extension)) {
      return { valid: false, error: 'Unsupported file type' }
    }

    return { valid: true }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files))
      }
    },
    [files]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validatedFiles: FileWithPreview[] = newFiles.map((file) => {
      const validation = validateFile(file)
      const fileWithPreview = file as FileWithPreview
      fileWithPreview.status = validation.valid ? 'pending' : 'error'
      fileWithPreview.error = validation.error
      fileWithPreview.uploadProgress = 0

      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }

      return fileWithPreview
    })

    const updatedFiles = [...files, ...validatedFiles]
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={(file as FileWithPreview).preview}
          alt={file.name}
          className="w-10 h-10 object-cover rounded"
        />
      )
    }
    return <File className="w-10 h-10 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          multiple
          onChange={handleChange}
        />

        <div className="space-y-2">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supported: GNSS, RINEX, CSV, Photos, PDF (max {maxSize}MB per file)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Files ({files.length}/{maxFiles})
            </p>
            {files.some(f => f.status === 'error') && (
              <p className="text-xs text-destructive">
                Some files have validation errors
              </p>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {getFileIcon(file)}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>

                  {file.status === 'uploading' && (
                    <Progress value={file.uploadProgress || 0} className="mt-2" />
                  )}

                  {file.error && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {file.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
