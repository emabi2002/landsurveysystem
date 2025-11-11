'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/upload/FileUpload'
import { createClient } from '@/lib/supabase/client'
import { Upload, Download, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { FieldUpload, SurveyJob } from '@/lib/types/database'
import { format } from 'date-fns'

export default function UploadsPage() {
  const [uploads, setUploads] = useState<FieldUpload[]>([])
  const [surveyJobs, setSurveyJobs] = useState<SurveyJob[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadUploads()
    loadSurveyJobs()
  }, [])

  const loadUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('field_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setUploads(data || [])
    } catch (error) {
      console.error('Error loading uploads:', error)
      toast.error('Failed to load field uploads')
    } finally {
      setLoading(false)
    }
  }

  const loadSurveyJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_jobs')
        .select('id, job_number, purpose')
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSurveyJobs(data as SurveyJob[] || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    type LucideIcon = typeof Upload
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: LucideIcon }> = {
      pending: { variant: 'secondary', icon: Upload },
      validated: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getFileTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      GNSS: 'bg-blue-100 text-blue-800',
      RINEX: 'bg-purple-100 text-purple-800',
      CSV: 'bg-green-100 text-green-800',
      photo: 'bg-orange-100 text-orange-800',
      field_notes: 'bg-gray-100 text-gray-800',
      PDF: 'bg-red-100 text-red-800',
    }

    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Field Uploads</h2>
            <p className="text-muted-foreground">
              Upload and validate GNSS, RINEX, photos, and field data
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Field Data</DialogTitle>
                <DialogDescription>
                  Upload GNSS observations, RINEX files, photos, and field notes
                </DialogDescription>
              </DialogHeader>
              <UploadForm
                surveyJobs={surveyJobs}
                onSuccess={() => {
                  setDialogOpen(false)
                  loadUploads()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Upload Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {uploads.filter(u => u.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Validated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {uploads.filter(u => u.status === 'validated').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {uploads.filter(u => u.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uploads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>
              Field data files with validation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No uploads found. Click "Upload Files" to add field data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {upload.file_name}
                        </TableCell>
                        <TableCell>
                          <Badge className={getFileTypeColor(upload.type)}>
                            {upload.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {upload.file_size ? (
                            `${(upload.file_size / 1024 / 1024).toFixed(2)} MB`
                          ) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(upload.status)}</TableCell>
                        <TableCell>
                          {format(new Date(upload.uploaded_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function UploadForm({
  surveyJobs,
  onSuccess,
}: {
  surveyJobs: SurveyJob[]
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    survey_job_id: '',
    type: 'GNSS',
  })
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    if (!formData.survey_job_id) {
      toast.error('Please select a survey job')
      return
    }

    setLoading(true)

    try {
      // In a real implementation, upload files to Supabase Storage or SharePoint
      // For now, just create metadata records

      const uploadPromises = files.map(async (file) => {
        // Simulate file validation
        const validations = {
          file_format: 'OK',
          crs_check: 'OK',
          checksum: Math.random().toString(36).substring(7),
        }

        // Create checksum (simplified)
        const checksum = await hashFile(file)

        return supabase.from('field_uploads').insert({
          survey_job_id: formData.survey_job_id,
          type: formData.type,
          file_name: file.name,
          file_url: `storage/${formData.survey_job_id}/${file.name}`, // Mock URL
          file_size: file.size,
          checksum,
          validations,
          status: 'pending',
        })
      })

      const results = await Promise.all(uploadPromises)

      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        throw new Error('Some files failed to upload')
      }

      toast.success(`${files.length} file(s) uploaded successfully`)
      onSuccess()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setLoading(false)
    }
  }

  // Simple hash function for demo
  const hashFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // In production, use crypto.subtle.digest or similar
      const hash = `${file.name}-${file.size}-${Date.now()}`
      resolve(btoa(hash).substring(0, 16))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="survey_job_id">Survey Job *</Label>
          <Select
            value={formData.survey_job_id}
            onValueChange={(value) =>
              setFormData({ ...formData, survey_job_id: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select survey job" />
            </SelectTrigger>
            <SelectContent>
              {surveyJobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.job_number} - {job.purpose.substring(0, 50)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">File Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GNSS">GNSS Data</SelectItem>
              <SelectItem value="RINEX">RINEX Files</SelectItem>
              <SelectItem value="CSV">CSV Data</SelectItem>
              <SelectItem value="photo">Photos</SelectItem>
              <SelectItem value="field_notes">Field Notes</SelectItem>
              <SelectItem value="PDF">PDF Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Files *</Label>
          <FileUpload
            maxSize={100}
            maxFiles={20}
            onFilesChange={(uploadedFiles) => {
              setFiles(uploadedFiles.filter(f => f.status !== 'error') as File[])
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || files.length === 0}>
          {loading ? 'Uploading...' : `Upload ${files.length} File(s)`}
        </Button>
      </div>
    </form>
  )
}
