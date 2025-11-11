'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { FileText, CheckSquare, MapPin, AlertTriangle, Clock } from 'lucide-react'

interface Stats {
  totalJobs: number
  activeJobs: number
  pendingEndorsement: number
  controlPoints: number
  overdueJobs: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    pendingEndorsement: 0,
    controlPoints: 0,
    overdueJobs: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Total jobs
      const { count: totalJobs } = await supabase
        .from('survey_jobs')
        .select('*', { count: 'exact', head: true })

      // Active jobs (not completed or cancelled)
      const { count: activeJobs } = await supabase
        .from('survey_jobs')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '(completed,cancelled)')

      // Pending endorsement
      const { count: pendingEndorsement } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'review')

      // Control points
      const { count: controlPoints } = await supabase
        .from('control_points')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Overdue jobs
      const { count: overdueJobs } = await supabase
        .from('survey_jobs')
        .select('*', { count: 'exact', head: true })
        .lt('sla_due', new Date().toISOString().split('T')[0])
        .not('status', 'in', '(completed,cancelled)')

      setStats({
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        pendingEndorsement: pendingEndorsement || 0,
        controlPoints: controlPoints || 0,
        overdueJobs: overdueJobs || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      icon: FileText,
      description: 'All survey jobs in system',
      color: 'text-blue-600',
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: CheckSquare,
      description: 'Jobs in progress',
      color: 'text-green-600',
    },
    {
      title: 'Pending Endorsement',
      value: stats.pendingEndorsement,
      icon: FileText,
      description: 'Plans awaiting approval',
      color: 'text-orange-600',
    },
    {
      title: 'Control Points',
      value: stats.controlPoints,
      icon: MapPin,
      description: 'Active control points',
      color: 'text-purple-600',
    },
    {
      title: 'Overdue Jobs',
      value: stats.overdueJobs,
      icon: AlertTriangle,
      description: 'Past SLA deadline',
      color: 'text-red-600',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of surveying operations and key metrics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest survey job registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No recent jobs to display
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Jobs approaching SLA deadline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No upcoming deadlines
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/dashboard/jobs"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Register Job</p>
                  <p className="text-xs text-muted-foreground">New survey job</p>
                </div>
              </a>
              <a
                href="/dashboard/uploads"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Upload Data</p>
                  <p className="text-xs text-muted-foreground">Field data files</p>
                </div>
              </a>
              <a
                href="/dashboard/control-points"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Control Points</p>
                  <p className="text-xs text-muted-foreground">Manage network</p>
                </div>
              </a>
              <a
                href="/dashboard/plans"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <CheckSquare className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Endorse Plans</p>
                  <p className="text-xs text-muted-foreground">Review & approve</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
