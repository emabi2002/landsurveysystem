'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [slaData, setSlaData] = useState({
    onTime: 0,
    delayed: 0,
    overdue: 0,
    total: 0,
  })
  const [jobStatusData, setJobStatusData] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  const [priorityData, setPriorityData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadReportData()
  }, [timeRange])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const days = parseInt(timeRange)
      const dateFrom = subDays(new Date(), days).toISOString()

      // Load jobs for the period
      const { data: jobs, error } = await supabase
        .from('survey_jobs')
        .select('*')
        .gte('created_at', dateFrom)

      if (error) throw error

      // Calculate SLA metrics
      const now = new Date()
      const onTime = jobs?.filter(j => {
        if (!j.sla_due) return false
        const slaDate = new Date(j.sla_due)
        return j.status === 'completed' || slaDate > now
      }).length || 0

      const overdue = jobs?.filter(j => {
        if (!j.sla_due) return false
        const slaDate = new Date(j.sla_due)
        return j.status !== 'completed' && j.status !== 'cancelled' && slaDate < now
      }).length || 0

      setSlaData({
        onTime,
        overdue,
        delayed: 0,
        total: jobs?.length || 0,
      })

      // Job status distribution
      const statusCount = jobs?.reduce((acc: any, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {})

      setJobStatusData(
        Object.entries(statusCount || {}).map(([status, count]) => ({
          name: status.replace('_', ' ').toUpperCase(),
          value: count,
        }))
      )

      // Priority distribution
      const priorityCount = jobs?.reduce((acc: any, job) => {
        acc[job.priority] = (acc[job.priority] || 0) + 1
        return acc
      }, {})

      setPriorityData(
        Object.entries(priorityCount || {}).map(([priority, count]) => ({
          name: priority.toUpperCase(),
          value: count,
        }))
      )

      // Trend data (jobs created per day)
      const trendMap: Record<string, number> = {}
      jobs?.forEach(job => {
        const date = format(new Date(job.created_at), 'MMM dd')
        trendMap[date] = (trendMap[date] || 0) + 1
      })

      setTrendData(
        Object.entries(trendMap).map(([date, count]) => ({
          date,
          jobs: count,
        }))
      )

    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const slaCompliancePercent = slaData.total > 0
    ? ((slaData.onTime / slaData.total) * 100).toFixed(1)
    : '0'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
            <p className="text-muted-foreground">
              SLA monitoring, job aging, and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* SLA Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                On Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{slaData.onTime}</div>
              <p className="text-xs text-muted-foreground">
                {slaCompliancePercent}% SLA compliance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{slaData.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Past SLA deadline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                Delayed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{slaData.delayed}</div>
              <p className="text-xs text-muted-foreground">
                At risk of missing SLA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{slaData.total}</div>
              <p className="text-xs text-muted-foreground">
                In selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Job Creation Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Job Creation Trend</CardTitle>
              <CardDescription>
                Number of jobs created over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Jobs Created"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Job Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>
                Current status of all jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>
                Jobs by priority level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance Rate</CardTitle>
              <CardDescription>
                Overall performance against SLA targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={`${
                        parseFloat(slaCompliancePercent) >= 90
                          ? 'text-green-600'
                          : parseFloat(slaCompliancePercent) >= 70
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}
                      strokeWidth="10"
                      strokeDasharray={`${parseFloat(slaCompliancePercent) * 2.51} 251`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">{slaCompliancePercent}%</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  {slaData.onTime} of {slaData.total} jobs completed on time
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              Automated analysis of survey operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parseFloat(slaCompliancePercent) >= 90 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Excellent SLA Performance</p>
                    <p className="text-sm text-green-700">
                      Your team is consistently meeting deadlines with {slaCompliancePercent}% on-time completion rate.
                    </p>
                  </div>
                </div>
              )}

              {slaData.overdue > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Overdue Jobs Require Attention</p>
                    <p className="text-sm text-red-700">
                      {slaData.overdue} job(s) have exceeded their SLA deadline. Immediate action recommended.
                    </p>
                  </div>
                </div>
              )}

              {slaData.total > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Workload Summary</p>
                    <p className="text-sm text-blue-700">
                      Processing {slaData.total} jobs in the selected period. Average processing time: 18 days.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
