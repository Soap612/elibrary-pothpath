"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"

type BookRow = {
  id: string
  title: string
  author: string | null
  description: string | null
  file_url: string
  created_at?: string | null
  genres: { name: string } | null
  isOpenLibrary?: boolean
  openLibraryKey?: string
}

type Genre = { id: string; name: string }

const PAGE_SIZE = 12

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] flex justify-center items-center">Loading Library...</div>}>
      <LibraryContent />
    </Suspense>
  )
}

function LibraryContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('q') || ""
  const initialGenre = searchParams.get('genreId') || ""

  const [books, setBooks] = useState<BookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // filters
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState<"newest" | "oldest" | "az">("newest")
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>(initialGenre)

  // Update effect to grab the newest URL params if they change
  useEffect(() => {
    setSearch(searchParams.get('q') || "")
    setGenreId(searchParams.get('genreId') || "")
  }, [searchParams])

  // load genres once
  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase.from("genres").select("*").order("name")
      if (!error && data) setGenres(data as Genre[])
    }
    fetchGenres()
  }, [])

  // fetch first page whenever filters change
  useEffect(() => {
    // When filters change, we need to reset the fetched list. 
    // We pass the current search term that triggered it.
    fetchBooks(true, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, genreId])

  // build query and fetch
  async function fetchBooks(reset = false, searchArg?: string) {
    const currentSearch = searchArg !== undefined ? searchArg : search

    if (reset) {
      setLoading(true)
      setBooks([])
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Use existing state unless resetting
      const existingBooks = reset ? [] : books
      let query = supabase
        .from("books")
        .select("*, genres(name)", { count: "exact" })
        .eq("status", "approved")

      if (genreId) query = query.eq("genre_id", genreId)
      if (search.trim()) {
        const term = search.trim()
        // search in title or author (case-insensitive)
        query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%`)
      }

      if (sort === "newest") query = query.order("created_at", { ascending: false })
      if (sort === "oldest") query = query.order("created_at", { ascending: true })
      if (sort === "az") query = query.order("title", { ascending: true })

      let from = 0
      let to = PAGE_SIZE - 1

      // Calculate properly what page to fetch for local database pagination vs openlibrary pagination
      if (!reset) {
        // If we only have local books currently, we fetch the next local page
        // But if we already have OpenLibrary books mixed in, local pagination is "done"
        const localBooksCount = existingBooks.filter(b => !b.isOpenLibrary).length
        from = localBooksCount
        to = from + PAGE_SIZE - 1
      }

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      let newRows = (data || []) as BookRow[]
      let isLocalDone = false
      const newTotalLocalCount = reset ? newRows.length : existingBooks.filter(b => !b.isOpenLibrary).length + newRows.length

      if (count !== null) {
        isLocalDone = newTotalLocalCount >= count
      } else {
        isLocalDone = newRows.length < PAGE_SIZE
      }

      // If we are searching, and local results are short/done, try OpenLibrary!
      if (currentSearch.trim() && (isLocalDone || newRows.length < PAGE_SIZE)) {
        try {
          // Find how many pages of OpenLibrary we've already fetched
          const openLibraryBooks = reset ? [] : existingBooks.filter(b => b.isOpenLibrary)
          // OpenLibrary pagination is 1-indexed for 'page'
          const openLibraryPage = Math.floor(openLibraryBooks.length / PAGE_SIZE) + 1

          const limit = Math.max(PAGE_SIZE - newRows.length, PAGE_SIZE) // fetch enough to fill page

          const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(currentSearch.trim())}&page=${openLibraryPage}&limit=${limit}`)
          if (olRes.ok) {
            const olData = await olRes.json()
            if (olData.docs && olData.docs.length > 0) {
              const olRows: BookRow[] = olData.docs.map((doc: { key: string; title: string; author_name?: string[] }) => ({
                id: `ol-${doc.key}`,
                title: doc.title,
                author: doc.author_name ? doc.author_name[0] : "Unknown Author",
                description: "Available from OpenLibrary online catalog.",
                file_url: `https://openlibrary.org${doc.key}`,
                created_at: null,
                genres: { name: "External" },
                isOpenLibrary: true,
                openLibraryKey: doc.key
              }))

              // Only add them if this API call adds new results not already in state
              newRows = [...newRows, ...olRows]
              setHasMore(olData.numFound > (openLibraryBooks.length + olRows.length))
            } else {
              setHasMore(false)
            }
          } else {
            console.error("OL returned !ok")
            setHasMore(false)
          }
        } catch (olErr) {
          console.error("OpenLibrary fetch error:", olErr)
          setHasMore(false) // Give up on external results gracefully
        }
      } else {
        setHasMore(!isLocalDone)
      }

      setBooks(reset ? newRows : [...existingBooks, ...newRows])

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

  const badgeClasses = (name?: string) => {
    const n = (name || "").toLowerCase()
    if (n.includes("science") || n.includes("විද්")) return "bg-green-100 text-green-700"
    if (n.includes("history") || n.includes("ඉතිහා")) return "bg-amber-100 text-amber-700"
    if (n.includes("novel") || n.includes("නවකතා")) return "bg-indigo-100 text-indigo-700"
    if (n.includes("short") || n.includes("කෙටි")) return "bg-pink-100 text-pink-700"
    if (n.includes("econom") || n.includes("ආර්ථ")) return "bg-purple-100 text-purple-700"
    if (n.includes("politic") || n.includes("දේශපාලන")) return "bg-red-100 text-red-700"
    if (n.includes("tech") || n.includes("තොරතුරු") || n.includes("it")) return "bg-sky-100 text-sky-700"
    return "bg-gray-100 text-gray-700"
  }

  const formatWhen = (iso?: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const onCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard")
    } catch {
      alert("Could not copy link")
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
              Pothpath Library
            </h1>
            <p className="text-sm">Explore approved books. Use search and filters to find what you want.</p>
          </div>
          <div className="text-sm">
            Showing <span className="font-medium">{formattedCount}</span> result{formattedCount === 1 ? "" : "s"}
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or author..."
              className="w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest" | "az")}
              className="w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="az">Sort: A → Z (Title)</option>
            </select>
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl border shadow-sm p-4">
                <div className="h-5 w-1/2 rounded animate-pulse mb-3" />
                <div className="h-4 w-1/3 rounded animate-pulse mb-2" />
                <div className="h-3 w-3/4 rounded animate-pulse mb-1.5" />
                <div className="h-3 w-2/3 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <motion.ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {books.map((book) => (
                <motion.li
                  key={book.id}
                  className="group border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${badgeClasses(book.genres?.name)}`}>
                        {book.genres?.name || "Uncategorized"}
                      </span>
                      {book.created_at && (
                        <span className="text-xs ml-auto">{formatWhen(book.created_at)}</span>
                      )}
                    </div>

                    <h2 className="text-lg font-semibold leading-snug line-clamp-2">{book.title}</h2>
                    {book.author && <p className="text-sm mt-1">{book.author}</p>}

                    {book.description && (
                      <p className="text-sm mt-3 line-clamp-3">{book.description}</p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <a
                        href={book.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary-foreground hover:bg-primary"
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                        {book.isOpenLibrary ? "Open in OpenLibrary" : "View PDF"}
                      </a>

                      {!book.isOpenLibrary && (
                        <a
                          href={book.file_url}
                          download
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          Download
                        </a>
                      )}

                      {!book.isOpenLibrary && (
                        <button
                          onClick={() => onCopy(book.file_url)}
                          className="ml-auto text-xs text-blue-500 hover:text-blue-700"
                        >
                          Copy link
                        </button>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchBooks(false)}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-md border shadow-sm"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 rounded-2xl border shadow-sm"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3">
        <DocumentTextIcon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold">No books found</h3>
      <p className="text-sm mt-1">Try adjusting your search or filters</p>
    </motion.div>
  )
}