"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Book, Cloud, Shield, ArrowRight, TrendingUp } from "lucide-react"

type Genre = { id: string; name: string; count: number }

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [genres, setGenres] = useState<Genre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(true)

  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      const { data, error } = await supabase
        .from("genres")
        .select(`
            id,
            name,
            books(id)
          `)

      if (error) {
        console.error(error)
        setGenres([])
        setLoadingGenres(false)
        return
      }

      const sorted = (data || [])
        .map(g => ({ id: g.id, name: g.name, count: g.books?.length || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)

      setGenres(sorted)
      setLoadingGenres(false)
    }
    fetchGenres()
  }, [])

  const handleSearch = () => {
    if (!q.trim()) return router.push("/library")
    router.push(`/library?q=${encodeURIComponent(q.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Discover Your Next Favorite Book
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore thousands of books across various genres. Pothpath is your open library for
            discovering, reading, and sharing knowledge with the world.
          </p>

          {/* Search Bar */}
          <div className="mt-8 w-full max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by title, author, or keyword…"
                className="w-full pl-12 pr-32 py-4 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
              <Button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                size="sm"
              >
                Search
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/library" className="sm:w-auto w-full">
              <Button size="lg" className="w-full shadow-sm gap-2">
                <Book className="w-4 h-4" />
                Explore Library
              </Button>
            </Link>
            <Link href="/upload" className="sm:w-auto w-full">
              <Button size="lg" variant="secondary" className="w-full gap-2">
                <Cloud className="w-4 h-4" />
                Upload a PDF
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Genres */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-2xl font-semibold">Popular Genres</h3>
        </div>

        {loadingGenres ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg animate-pulse bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {genres.map((genre) => (
              <Link key={genre.id} href={`/library?genreId=${genre.id}`}>
                <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 group border-2 hover:border-primary/20 py-2">
                  <CardContent className="text-center">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {genre.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {genre.count} books
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Pothpath?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of digital reading with our powerful features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Easy Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Share your knowledge by uploading PDFs. Simple, fast, and secure file handling.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
