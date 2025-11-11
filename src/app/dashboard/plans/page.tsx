'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { FileCheck, CheckCircle, Clock, XCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { Plan, SurveyJob } from '@/lib/types/database'
import { format } from 'date-fns'

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [surveyJobs, setSurveyJobs] = useState<SurveyJob[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPlans()
    loadSurveyJobs()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Failed to load survey plans')
    } finally {
      setLoading(false)
    }
  }

  const loadSurveyJobs = async () => {
    try {
      const { data, error} = await supabase
        .from('survey_jobs')
        .select('id, job_number, purpose')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSurveyJobs(data as SurveyJob[] || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      draft: { variant: 'secondary', icon: FileText },
      review: { variant: 'outline', icon: Clock },
      endorsed: { variant: 'default', icon: CheckCircle },
      superseded: { variant: 'destructive', icon: XCircle },
    }

    const item = config[status] || config.draft
    const Icon = item.icon

    return (
      <Badge variant={item.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  const handleEndorse = async (plan: Plan) => {
    setSelectedPlan(plan)
    setDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Survey Plans</h2>
          <p className="text-muted-foreground">
            Plan compilation, endorsement, and official numbering
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {plans.filter(p => p.status === 'review').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Endorsed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {plans.filter(p => p.status === 'endorsed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.filter(p => p.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Endorsement Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Endorse Survey Plan</DialogTitle>
              <DialogDescription>
                Review and endorse the survey plan. This action is irreversible.
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <EndorsementForm
                plan={selectedPlan}
                onSuccess={() => {
                  setDialogOpen(false)
                  setSelectedPlan(null)
                  loadPlans()
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Survey Plans
            </CardTitle>
            <CardDescription>
              Manage plan compilation, review, and endorsement workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No survey plans found</p>
                <p className="text-sm mt-2">Plans will appear here once field work is processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Number</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sheets</TableHead>
                      <TableHead>Endorsed By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {plan.plan_no || <span className="text-muted-foreground">Pending</span>}
                        </TableCell>
                        <TableCell>v{plan.version}</TableCell>
                        <TableCell>{getStatusBadge(plan.status)}</TableCell>
                        <TableCell>{plan.sheet_count}</TableCell>
                        <TableCell>
                          {plan.endorsed_by || '-'}
                        </TableCell>
                        <TableCell>
                          {plan.endorsement_date
                            ? format(new Date(plan.endorsement_date), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {plan.status === 'review' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEndorse(plan)}
                            >
                              Endorse
                            </Button>
                          )}
                          {plan.status === 'endorsed' && plan.is_immutable && (
                            <Badge variant="outline">Locked</Badge>
                          )}
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

function EndorsementForm({
  plan,
  onSuccess,
}: {
  plan: Plan
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    approval_level: 'senior_surveyor',
    comments: '',
    digital_signature: '',
  })
  const supabase = createClient()

  const handleEndorse = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate plan number if not exists
      const planNumber = plan.plan_no || await generatePlanNumber()

      // Create digital signature (simplified - use proper crypto in production)
      const signature = await createDigitalSignature(plan, formData)

      // Update plan to endorsed status
      const { error } = await supabase
        .from('plans')
        .update({
          status: 'endorsed',
          plan_no: planNumber,
          endorsement_date: new Date().toISOString(),
          endorsed_by: 'Current User', // Replace with actual user from auth
          digital_signature: signature,
          is_immutable: true, // Lock the plan
        })
        .eq('id', plan.id)

      if (error) throw error

      // Create audit log entry
      await supabase.from('audit_log').insert({
        actor: 'current_user@lands.gov.pg',
        action: 'endorse',
        entity_table: 'plans',
        entity_id: plan.id,
        after_state: { plan_no: planNumber, endorsed: true },
      })

      toast.success(`Plan ${planNumber} endorsed successfully`)
      onSuccess()
    } catch (error) {
      console.error('Error endorsing plan:', error)
      toast.error('Failed to endorse plan')
    } finally {
      setLoading(false)
    }
  }

  const generatePlanNumber = async (): Promise<string> => {
    // Generate sequential plan number
    const { count } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'endorsed')

    const year = new Date().getFullYear()
    const sequence = (count || 0) + 1
    return `SP-${year}-${String(sequence).padStart(5, '0')}`
  }

  const createDigitalSignature = async (plan: Plan, form: typeof formData): Promise<string> => {
    // In production, use proper cryptographic signing
    // For demo, create a hash-like string
    const data = JSON.stringify({
      plan_id: plan.id,
      approval_level: form.approval_level,
      timestamp: new Date().toISOString(),
      comments: form.comments,
    })

    return btoa(data).substring(0, 32)
  }

  return (
    <form onSubmit={handleEndorse} className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/50">
        <h4 className="font-medium mb-2">Plan Details</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Current Status:</dt>
          <dd className="font-medium">{plan.status.toUpperCase()}</dd>

          <dt className="text-muted-foreground">Version:</dt>
          <dd>{plan.version}</dd>

          <dt className="text-muted-foreground">Sheet Count:</dt>
          <dd>{plan.sheet_count}</dd>
        </dl>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approval_level">Approval Level *</Label>
        <Select
          value={formData.approval_level}
          onValueChange={(value) =>
            setFormData({ ...formData, approval_level: value })
          }
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="survey_officer">Survey Officer</SelectItem>
            <SelectItem value="senior_surveyor">Senior Surveyor</SelectItem>
            <SelectItem value="chief_surveyor">Chief Surveyor</SelectItem>
            <SelectItem value="surveyor_general">Surveyor-General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Endorsement Comments</Label>
        <Textarea
          id="comments"
          value={formData.comments}
          onChange={(e) =>
            setFormData({ ...formData, comments: e.target.value })
          }
          placeholder="Add any notes or comments about this endorsement..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="digital_signature">Digital Signature PIN *</Label>
        <Input
          id="digital_signature"
          type="password"
          value={formData.digital_signature}
          onChange={(e) =>
            setFormData({ ...formData, digital_signature: e.target.value })
          }
          placeholder="Enter your signature PIN"
          required
        />
        <p className="text-xs text-muted-foreground">
          Your digital signature will be permanently attached to this endorsement
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-1">⚠️ Warning</h4>
        <p className="text-sm text-yellow-800">
          Once endorsed, this plan becomes immutable and cannot be modified.
          A plan number will be assigned and the plan will be locked.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Endorsing...' : 'Endorse Plan'}
        </Button>
      </div>
    </form>
  )
}
