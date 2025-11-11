'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function DisputesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Legal Disputes</h2>
          <p className="text-muted-foreground">
            Boundary disputes and legal case liaison
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Dispute Management
            </CardTitle>
            <CardDescription>
              Track disputes, escalations, and evidence bundles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Legal disputes interface</p>
              <p className="text-sm mt-2">Escalation to Legal with evidence packaging</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
