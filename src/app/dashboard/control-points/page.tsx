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
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { ControlPoint, AccuracyClass } from '@/lib/types/database'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const ControlPointsMap = dynamic(
  () => import('@/components/maps/ControlPointsMap').then(mod => mod.ControlPointsMap),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-muted rounded-lg animate-pulse" /> }
)

export default function ControlPointsPage() {
  const [points, setPoints] = useState<ControlPoint[]>([])
  const [accuracyClasses, setAccuracyClasses] = useState<AccuracyClass[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<ControlPoint | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map')
  const supabase = createClient()

  useEffect(() => {
    loadPoints()
    loadAccuracyClasses()
  }, [])

  const loadPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('control_points')
        .select('*')
        .order('code')

      if (error) throw error
      setPoints(data || [])
    } catch (error) {
      console.error('Error loading control points:', error)
      toast.error('Failed to load control points')
    } finally {
      setLoading(false)
    }
  }

  const loadAccuracyClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('accuracy_classes')
        .select('*')
        .order('code')

      if (error) throw error
      setAccuracyClasses(data || [])
    } catch (error) {
      console.error('Error loading accuracy classes:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this control point?')) return

    try {
      const { error } = await supabase
        .from('control_points')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Control point deleted')
      loadPoints()
    } catch (error) {
      console.error('Error deleting point:', error)
      toast.error('Failed to delete control point')
    }
  }

  const handleEdit = (point: ControlPoint) => {
    setEditingPoint(point)
    setDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      deprecated: 'secondary',
      destroyed: 'destructive',
    }

    return <Badge variant={variants[status] || 'outline'}>{status.toUpperCase()}</Badge>
  }

  // Convert control points to map format
  const mapPoints = points.map(point => {
    // Extract coordinates from PostGIS geometry (simplified - real implementation would parse WKT/GeoJSON)
    // For now, using mock coordinates for Papua New Guinea
    const lat = point.geom ? -6.314993 + (Math.random() - 0.5) * 2 : -6.314993
    const lng = point.geom ? 143.95555 + (Math.random() - 0.5) * 2 : 143.95555

    return {
      id: point.id,
      code: point.code,
      lat,
      lng,
      elevation: undefined,
      datum: point.datum,
      status: point.status,
      accuracy_class: point.accuracy_class_id,
      monument_type: point.monument_type,
      description: point.description,
    }
  })

  const filteredPoints = points.filter(point =>
    point.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Control Points</h2>
            <p className="text-muted-foreground">
              Geodetic control network with 3D coordinates (PostGIS)
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPoint(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Control Point
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPoint ? 'Edit Control Point' : 'Add Control Point'}
                </DialogTitle>
                <DialogDescription>
                  Enter control point details with coordinates and accuracy information
                </DialogDescription>
              </DialogHeader>
              <ControlPointForm
                point={editingPoint}
                accuracyClasses={accuracyClasses}
                onSuccess={() => {
                  setDialogOpen(false)
                  setEditingPoint(null)
                  loadPoints()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Map View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Control Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Map or Table View */}
        {viewMode === 'map' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Control Points Network Map
              </CardTitle>
              <CardDescription>
                Interactive map showing all active control points
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="w-full h-[600px] bg-muted rounded-lg animate-pulse" />
              ) : (
                <ControlPointsMap
                  points={mapPoints.filter(p =>
                    p.code.toLowerCase().includes(searchTerm.toLowerCase())
                  )}
                  onPointClick={(point) => {
                    const fullPoint = points.find(p => p.id === point.id)
                    if (fullPoint) handleEdit(fullPoint)
                  }}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Control Points ({filteredPoints.length})</CardTitle>
              <CardDescription>Manage geodetic control network</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredPoints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No control points found. Click "Add Control Point" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Monument Type</TableHead>
                        <TableHead>Installed</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPoints.map((point) => (
                        <TableRow key={point.id}>
                          <TableCell className="font-medium">{point.code}</TableCell>
                          <TableCell>{point.datum}</TableCell>
                          <TableCell>{getStatusBadge(point.status)}</TableCell>
                          <TableCell>{point.monument_type || '-'}</TableCell>
                          <TableCell>
                            {point.installed_on || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {point.description || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(point)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(point.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

function ControlPointForm({
  point,
  accuracyClasses,
  onSuccess,
}: {
  point: ControlPoint | null
  accuracyClasses: AccuracyClass[]
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: point?.code || '',
    latitude: '',
    longitude: '',
    elevation: '',
    datum: point?.datum || 'WGS84',
    accuracy_class_id: point?.accuracy_class_id || '',
    status: point?.status || 'active',
    monument_type: point?.monument_type || '',
    description: point?.description || '',
    installed_on: point?.installed_on || '',
  })
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create PostGIS point geometry (PointZ with elevation)
      const geom = formData.latitude && formData.longitude
        ? `SRID=4326;POINT Z(${formData.longitude} ${formData.latitude} ${formData.elevation || 0})`
        : null

      const payload = {
        code: formData.code,
        geom,
        datum: formData.datum,
        accuracy_class_id: formData.accuracy_class_id || null,
        status: formData.status,
        monument_type: formData.monument_type || null,
        description: formData.description || null,
        installed_on: formData.installed_on || null,
      }

      if (point) {
        // Update existing
        const { error } = await supabase
          .from('control_points')
          .update(payload)
          .eq('id', point.id)

        if (error) throw error
        toast.success('Control point updated')
      } else {
        // Create new
        const { error } = await supabase
          .from('control_points')
          .insert(payload)

        if (error) throw error
        toast.success('Control point created')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving control point:', error)
      toast.error('Failed to save control point')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="code">Control Point Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="CP-001"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude (WGS84) *</Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="-6.314993"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude (WGS84) *</Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="143.95555"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="elevation">Elevation (m)</Label>
          <Input
            id="elevation"
            type="number"
            step="0.001"
            value={formData.elevation}
            onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
            placeholder="100.000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="datum">Datum</Label>
          <Select
            value={formData.datum}
            onValueChange={(value) => setFormData({ ...formData, datum: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WGS84">WGS84</SelectItem>
              <SelectItem value="GDA94">GDA94</SelectItem>
              <SelectItem value="PNG94">PNG94</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accuracy_class_id">Accuracy Class</Label>
          <Select
            value={formData.accuracy_class_id}
            onValueChange={(value) =>
              setFormData({ ...formData, accuracy_class_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select accuracy class" />
            </SelectTrigger>
            <SelectContent>
              {accuracyClasses.map((ac) => (
                <SelectItem key={ac.id} value={ac.id}>
                  {ac.code} - {ac.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'deprecated' | 'destroyed' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
              <SelectItem value="destroyed">Destroyed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monument_type">Monument Type</Label>
          <Input
            id="monument_type"
            value={formData.monument_type}
            onChange={(e) =>
              setFormData({ ...formData, monument_type: e.target.value })
            }
            placeholder="e.g., Concrete pillar, Brass disk"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installed_on">Installation Date</Label>
          <Input
            id="installed_on"
            type="date"
            value={formData.installed_on}
            onChange={(e) =>
              setFormData({ ...formData, installed_on: e.target.value })
            }
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Location description, access notes, etc."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : point ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
