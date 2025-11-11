'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from 'lucide-react'

export default function ParcelFabricPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Parcel Fabric</h2>
          <p className="text-muted-foreground">
            Authoritative parcel boundaries with version control
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Versioned Parcel Fabric
            </CardTitle>
            <CardDescription>
              Manage splits, amalgamations, boundary adjustments, and easements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Parcel fabric management</p>
              <p className="text-sm mt-2">PostGIS polygons with temporal versioning</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
