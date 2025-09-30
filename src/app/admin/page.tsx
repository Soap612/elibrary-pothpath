"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cog,
  LogOut,
  XCircle,
  BookOpen,
  BarChart3,
  Tag,
  RefreshCw,
} from "lucide-react"
import { BooksTab } from "@/components/admin/BooksTab"
import { GenresTab } from "@/components/admin/GenresTab"
import { AnalyticsTab } from "@/components/admin/AnalyticsTab"

const ALLOWED_ADMIN_EMAILS = process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS?.split(',') || []

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Check if user is admin and has allowed email
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Check if user's email is in the allowed list
      const userEmail = session.user.email
      if (!userEmail || !ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setUser(session.user)
      setLoading(false)
    }
    getSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // Reload the page to refresh all data
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin panel.
          </p>
          <Button onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cog className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage books, genres, and view analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Logged in as: {user?.email}
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="genres" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Genres
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <BooksTab />
          </TabsContent>

          <TabsContent value="genres">
            <GenresTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}