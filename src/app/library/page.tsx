"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { BookCard } from "@/components/library/BookCard"
import { BookCardSkeleton } from "@/components/library/BookCardSkeleton"
import { BookDetailModal } from "@/components/library/BookDetailModal"
import { EmptyState } from "@/components/library/EmptyState"

type Genre = {
  id: string
  name: string
  description?: string
  slug?: string
  color_code?: string
  is_active: boolean
  sort_order: number
}

type BookRow = {
  id: string
  title: string
  author: string | null
  description: string | null
  file_url: string
  upload_at: string
  file_size_bytes: number | null
  download_count: number
  is_public: boolean
  genres: { name: string; color_code?: string } | null
}

const PAGE_SIZE = 12

export default function LibraryPage() {
  const [books, setBooks] = useState<BookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // filters & state
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest" | "az" | "popular">("newest")
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null)

  // load genres once
  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
      if (!error && data) setGenres(data as Genre[])
    }
    fetchGenres()

    // Load user preferences from localStorage
    const savedFavorites = localStorage.getItem('library-favorites')
    const savedBookmarks = localStorage.getItem('library-bookmarks')
    const savedViewMode = localStorage.getItem('library-view-mode')

    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)))
    if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)))
    if (savedViewMode) setViewMode(savedViewMode as "grid" | "list")
  }, [])

  // fetch first page whenever filters change
  useEffect(() => {
    fetchBooks(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, genreId])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('library-favorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('library-bookmarks', JSON.stringify(Array.from(bookmarks)))
  }, [bookmarks])

  useEffect(() => {
    localStorage.setItem('library-view-mode', viewMode)
  }, [viewMode])

  // build query and fetch
  async function fetchBooks(reset = false) {
    if (reset) {
      setLoading(true)
      setBooks([])
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      let query = supabase
        .from("books")
        .select("*, genres(name, color_code)", { count: "exact" })
        .eq("status", "approved")
        .eq("is_public", true)

      if (genreId) query = query.eq("genre_id", genreId)
      if (search.trim()) {
        const term = search.trim()
        query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,description.ilike.%${term}%`)
      }

      // Apply sorting
      switch (sort) {
        case "newest":
          query = query.order("upload_at", { ascending: false })
          break
        case "oldest":
          query = query.order("upload_at", { ascending: true })
          break
        case "az":
          query = query.order("title", { ascending: true })
          break
      }

      // pagination range
      const from = reset ? 0 : books.length
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      const newRows = (data || []) as BookRow[]
      setBooks(reset ? newRows : [...books, ...newRows])

      if (count !== null) {
        setHasMore((reset ? newRows.length : books.length + newRows.length) < count)
      } else {
        setHasMore(newRows.length === PAGE_SIZE)
      }
    } catch (err) {
      console.error("Error fetching books:", err)
      if (reset) setBooks([])
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // UI helpers
  const formattedCount = useMemo(() => books.length, [books])

  const toggleFavorite = (bookId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(bookId)) {
        newFavorites.delete(bookId)
      } else {
        newFavorites.add(bookId)
      }
      return newFavorites
    })
  }

  const toggleBookmark = (bookId: string) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev)
      if (newBookmarks.has(bookId)) {
        newBookmarks.delete(bookId)
      } else {
        newBookmarks.add(bookId)
      }
      return newBookmarks
    })
  }

  const shareBook = async (book: BookRow) => {
    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author} on Pothpath`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      await navigator.clipboard.writeText(book.file_url)
      alert("Book link copied to clipboard!")
    }
  }

  const clearFilters = () => {
    setSearch("")
    setGenreId("")
    setSort("newest")
  }

  const filteredBooks = useMemo(() => {
    return books
  }, [books])

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8"
        >
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text">
              📚 Pothpath Library
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Discover and explore approved books from our community
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm">
              <span className="font-semibold">{formattedCount}</span> book{formattedCount === 1 ? "" : "s"} available
            </div>
            <div className="flex gap-1 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or description..."
              className="w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent backdrop-blur-sm bg-background"
            />
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent backdrop-blur-sm bg-background"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort & Filter Toggle */}
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="flex-1 px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent backdrop-blur-sm bg-background"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A → Z (Title)</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </motion.div>

        {/* Active Filters */}
        {(search || genreId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap items-center gap-2 mb-6"
          >
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-accent">
                Search: "{search}"
                <button onClick={() => setSearch("")} className="hover:bg-accent/50 rounded-full p-0.5">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {genreId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-accent">
                Genre: {genres.find(g => g.id === genreId)?.name}
                <button onClick={() => setGenreId("")} className="hover:bg-accent/50 rounded-full p-0.5">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm underline text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Grid/List View */}
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <EmptyState onClearFilters={clearFilters} hasFilters={!!(search || genreId)} />
        ) : (
          <>
            <AnimatePresence>
              <motion.div
                className={viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-4"
                }
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    viewMode={viewMode}
                    isFavorite={favorites.has(book.id)}
                    isBookmarked={bookmarks.has(book.id)}
                    onToggleFavorite={() => toggleFavorite(book.id)}
                    onToggleBookmark={() => toggleBookmark(book.id)}
                    onShare={() => shareBook(book)}
                    onViewDetails={() => setSelectedBook(book)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <motion.button
                  onClick={() => fetchBooks(false)}
                  disabled={loadingMore}
                  className="px-8 py-3 border-2 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-background hover:bg-accent"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-primary" />
                      Loading...
                    </span>
                  ) : (
                    "Load More Books"
                  )}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailModal
            book={selectedBook}
            isFavorite={favorites.has(selectedBook.id)}
            isBookmarked={bookmarks.has(selectedBook.id)}
            onClose={() => setSelectedBook(null)}
            onToggleFavorite={() => toggleFavorite(selectedBook.id)}
            onToggleBookmark={() => toggleBookmark(selectedBook.id)}
            onShare={() => shareBook(selectedBook)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

