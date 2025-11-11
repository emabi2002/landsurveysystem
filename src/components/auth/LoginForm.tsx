'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Signed in successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="bg-white rounded-lg p-3">
            <img src="/dlpp-logo.svg" alt="DLPP" className="h-20 w-20" />
          </div>
          <div className="text-center">
            <CardTitle className="text-white text-xl mb-1">DLPP Surveying Division</CardTitle>
            <CardDescription className="text-green-50">
              Department of Lands & Physical Planning
            </CardDescription>
          </div>
        </div>
        <p className="text-sm text-green-100 text-center mt-2">
          Sign in to access the survey management system
        </p>
      </CardHeader>
      <CardContent className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@lands.gov.pg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="border-green-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="border-green-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
          <p>Demo credentials: admin@lands.gov.pg / demo123</p>
          <p className="text-red-600 mt-2">⚠️ CHANGE PASSWORD IMMEDIATELY IN PRODUCTION</p>
        </div>
      </CardContent>
    </Card>
  )
}
