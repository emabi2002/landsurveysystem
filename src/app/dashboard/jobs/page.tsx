'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import type { SurveyJob, JobType } from '@/lib/types/database'
import { format } from 'date-fns'

export default function SurveyJobsPage() {
  const [jobs, setJobs] = useState<SurveyJob[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadJobs()
    loadJobTypes()
  }, [])

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Failed to load survey jobs')
    } finally {
      setLoading(false)
    }
  }

  const loadJobTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('job_types')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setJobTypes(data || [])
    } catch (error) {
      console.error('Error loading job types:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      registered: 'outline',
      assigned: 'secondary',
      field_work: 'default',
      processing: 'default',
      qa_review: 'default',
      endorsed: 'default',
      completed: 'default',
      cancelled: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }

    return (
      <Badge className={colors[priority] || colors.normal}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const filteredJobs = jobs.filter((job) =>
    job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.case_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Survey Jobs</h2>
            <p className="text-muted-foreground">
              Manage cadastral survey job registrations and assignments
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register Survey Job</DialogTitle>
                <DialogDescription>
                  Create a new survey job registration
                </DialogDescription>
              </DialogHeader>
              <NewJobForm
                jobTypes={jobTypes}
                onSuccess={() => {
                  setDialogOpen(false)
                  loadJobs()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by job number, case ID, or purpose..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Jobs ({filteredJobs.length})</CardTitle>
            <CardDescription>Recent survey job registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No survey jobs found. Click "Register New Job" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Case/Title ID</TableHead>
                      <TableHead>SLA Due</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id} className="cursor-pointer hover:bg-accent">
                        <TableCell className="font-medium">{job.job_number}</TableCell>
                        <TableCell className="max-w-xs truncate">{job.purpose}</TableCell>
                        <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.case_id || job.title_id || '-'}
                        </TableCell>
                        <TableCell>
                          {job.sla_due ? format(new Date(job.sla_due), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(job.created_at), 'MMM dd, yyyy')}
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

function NewJobForm({ jobTypes, onSuccess }: { jobTypes: JobType[]; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    request_source: 'external',
    purpose: '',
    job_type_id: '',
    priority: 'normal',
    case_id: '',
    title_id: '',
    lrc_ref: '',
    location_description: '',
  })
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate job number (simple sequential for demo)
      const { count } = await supabase
        .from('survey_jobs')
        .select('*', { count: 'exact', head: true })

      const jobNumber = `SJ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

      // Calculate SLA due date based on job type
      const selectedType = jobTypes.find(t => t.id === formData.job_type_id)
      const slaDays = selectedType?.sla_days || 30
      const slaDate = new Date()
      slaDate.setDate(slaDate.getDate() + slaDays)

      const { error } = await supabase.from('survey_jobs').insert({
        job_number: jobNumber,
        ...formData,
        sla_due: slaDate.toISOString().split('T')[0],
        status: 'registered',
      })

      if (error) throw error

      toast.success(`Survey job ${jobNumber} registered successfully`)
      onSuccess()
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to register survey job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="request_source">Request Source</Label>
          <Select
            value={formData.request_source}
            onValueChange={(value) =>
              setFormData({ ...formData, request_source: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="external">External Surveyor</SelectItem>
              <SelectItem value="rot">Registrar of Titles</SelectItem>
              <SelectItem value="court">Court Order</SelectItem>
              <SelectItem value="enforcement">Enforcement</SelectItem>
              <SelectItem value="internal">Internal Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_type_id">Job Type</Label>
          <Select
            value={formData.job_type_id}
            onValueChange={(value) =>
              setFormData({ ...formData, job_type_id: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="Describe the purpose of this survey..."
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="case_id">Case ID</Label>
          <Input
            id="case_id"
            value={formData.case_id}
            onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title_id">Title ID</Label>
          <Input
            id="title_id"
            value={formData.title_id}
            onChange={(e) => setFormData({ ...formData, title_id: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lrc_ref">LRC Reference</Label>
          <Input
            id="lrc_ref"
            value={formData.lrc_ref}
            onChange={(e) => setFormData({ ...formData, lrc_ref: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_description">Location Description</Label>
        <Textarea
          id="location_description"
          value={formData.location_description}
          onChange={(e) =>
            setFormData({ ...formData, location_description: e.target.value })
          }
          placeholder="Describe the survey location..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Register Job'}
        </Button>
      </div>
    </form>
  )
}
