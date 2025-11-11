'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'

export default function WorkOrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Orders</h2>
          <p className="text-muted-foreground">
            Field work planning and resource allocation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Work Orders Management</CardTitle>
            <CardDescription>
              Generate work orders, assign instruments, and track field activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Work orders interface</p>
              <p className="text-sm mt-2">Scope, instruments, safety, and checklists</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
