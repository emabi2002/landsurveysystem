'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MapPin,
  FileText,
  Database,
  Upload,
  CheckSquare,
  FileCheck,
  Scale,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Survey Jobs', href: '/dashboard/jobs', icon: FileText },
  { name: 'Work Orders', href: '/dashboard/work-orders', icon: CheckSquare },
  { name: 'Field Uploads', href: '/dashboard/uploads', icon: Upload },
  { name: 'Control Points', href: '/dashboard/control-points', icon: MapPin },
  { name: 'Processing & QA', href: '/dashboard/processing', icon: CheckSquare },
  { name: 'Plans', href: '/dashboard/plans', icon: FileCheck },
  { name: 'Parcel Fabric', href: '/dashboard/fabric', icon: Database },
  { name: 'Legal Disputes', href: '/dashboard/disputes', icon: Scale },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-green-600 to-green-800 border-r border-green-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-24 items-center justify-between border-b border-green-700 px-4 bg-gradient-to-r from-green-700 to-green-600">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-white rounded-lg p-2">
                <img src="/dlpp-logo.svg" alt="DLPP Logo" className="h-14 w-14" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">DLPP</p>
                <p className="text-green-100 text-xs">Surveying Division</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-green-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-green-800 shadow-sm'
                      : 'text-green-50 hover:bg-green-700 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-green-700 p-4 bg-green-800/50">
            <div className="flex items-center gap-3">
              <Avatar className="border-2 border-green-400">
                <AvatarFallback className="bg-green-600 text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-white">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-green-200">Surveyor</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-green-100 hover:text-white hover:bg-green-700"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-green-200 bg-white shadow-sm px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-green-700 hover:bg-green-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-green-800 rounded-full"></div>
            <h1 className="text-lg font-semibold text-gray-800">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="text-xs text-gray-500 hidden sm:block">
            DLPP Surveying Division
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
