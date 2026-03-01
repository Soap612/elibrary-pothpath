// src/components/admin/BooksTab.tsx
import { useState, useEffect } from "react";
import {
    Search,
    Filter,
    RefreshCw,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    FileText,
    User,
    Tag,
    Calendar,
    Download,
    BookOpen,
    Eye,
    EyeOff,
    Archive,
    MoreVertical,
    ChevronDown,
    Download as DownloadIcon
} from "lucide-react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { EditBookModal } from "@/components/admin/EditBookModal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Genre = {
    id: string;
    name: string;
    slug?: string;
    color_code?: string;
    is_active: boolean;
    sort_order: number;
}

type Book = {
    id: string
    title: string
    author: string
    description: string | null
    status: "pending" | "approved" | "rejected" | "archived"
    upload_at: string
    file_url: string
    genre_id: string | null
    file_size_bytes: number | null
    download_count: number
    is_public: boolean
    upload_by: string | null
    genres?: { name: string } | null
}

export function BooksTab() {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "archived" | "all">("pending")
    const [genreFilter, setGenreFilter] = useState<string>("all")
    const [sort, setSort] = useState<"newest" | "oldest" | "az" | "downloads">("newest")
    const [genres, setGenres] = useState<Genre[]>([])
    const [editBook, setEditBook] = useState<Book | null>(null)
    const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<"list" | "grid">("list")
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    useEffect(() => {
        fetchGenres()
    }, [])

    useEffect(() => {
        fetchBooks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, sort, genreFilter])

    async function fetchGenres() {
        try {
            const { data, error } = await supabase
                .from("genres")
                .select("*")
                .eq("is_active", true)
                .order("sort_order")

            if (error) {
                console.error('Error fetching genres:', error)
                throw error
            }

            if (data) setGenres(data)
        } catch (error) {
            console.error('Failed to fetch genres:', error)
            toast.error('Failed to load genres')
        }
    }

    async function fetchBooks() {
        setLoading(true)
        try {
            let query = supabase
                .from("books")
                .select(`
                    *,
                    genres (
                        name
                    )
                `)

            if (status !== "all") query = query.eq("status", status)
            if (genreFilter !== "all") query = query.eq("genre_id", genreFilter)
            if (search.trim()) {
                query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
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
                case "downloads":
                    query = query.order("download_count", { ascending: false })
                    break
            }

            const { data, error } = await query
            if (error) {
                console.error('Supabase query error:', error)
                throw error
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const booksData = (data || []).map((book: any) => ({
                ...book,
                genres: Array.isArray(book.genres) ? book.genres[0] : book.genres
            })) as Book[]

            setBooks(booksData)
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Error fetching books:", err)
            toast.error(`Failed to load books: ${err.message}`)
            setBooks([])
        } finally {
            setLoading(false)
        }
    }

    async function updateStatus(id: string, newStatus: Book["status"]) {
        try {
            const updateData: Record<string, string> = {
                status: newStatus,
                updated_at: new Date().toISOString(),
            }

            if (newStatus === "approved") {
                updateData.approved_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from("books")
                .update(updateData)
                .eq("id", id)

            if (error) {
                console.error('Update status error:', error)
                toast.error(`Failed to update status: ${error.message}`)
                return
            }

            toast.success(`Book ${newStatus} successfully`)

            if (status !== "all") {
                setBooks((prev: Book[]) => prev.filter((book: Book) => book.id !== id))
            } else {
                fetchBooks()
            }
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Error updating status:', err)
            toast.error(`Failed to update status: ${err.message}`)
        }
    }

    async function toggleBookVisibility(id: string, currentVisibility: boolean) {
        try {
            const { error } = await supabase
                .from("books")
                .update({
                    is_public: !currentVisibility,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id)

            if (error) {
                toast.error("Failed to update visibility")
                return
            }

            toast.success(`Book ${!currentVisibility ? "published" : "hidden"} successfully`)
            fetchBooks()
        } catch {
            toast.error("Failed to update visibility")
        }
    }

    async function deleteBook(id: string) {
        if (!confirm("Are you sure you want to delete this book?")) return

        const { error } = await supabase.from("books").delete().eq("id", id)
        if (error) {
            toast.error("Failed to delete book")
            return
        }

        toast.success("Book deleted successfully")
        setBooks((prev: Book[]) => prev.filter((book: Book) => book.id !== id))
    }

    async function bulkUpdateStatus(newStatus: Book["status"]) {
        if (selectedBooks.size === 0) {
            toast.error("No books selected")
            return
        }

        if (!confirm(`Are you sure you want to update ${selectedBooks.size} books to "${newStatus}"?`)) return

        const bookIds = Array.from(selectedBooks)
        const updateData: Record<string, string> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        }

        if (newStatus === "approved") {
            updateData.approved_at = new Date().toISOString()
        }

        const { error } = await supabase
            .from("books")
            .update(updateData)
            .in("id", bookIds)

        if (error) {
            toast.error("Failed to update books")
            return
        }

        toast.success(`Updated ${selectedBooks.size} books to ${newStatus}`)
        setSelectedBooks(new Set())
        fetchBooks()
    }

    function toggleBookSelection(id: string) {
        const newSelected = new Set(selectedBooks)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedBooks(newSelected)
    }

    function selectAllBooks() {
        if (selectedBooks.size === books.length) {
            setSelectedBooks(new Set())
        } else {
            setSelectedBooks(new Set(books.map((book: Book) => book.id)))
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Unknown"
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(2)} MB`
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary" as const, label: "Pending", color: "text-yellow-600" },
            approved: { variant: "default" as const, label: "Approved", color: "text-green-600" },
            rejected: { variant: "destructive" as const, label: "Rejected", color: "text-red-600" },
            archived: { variant: "outline" as const, label: "Archived", color: "text-gray-600" }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
        return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>
    }

    const stats = {
        total: books.length,
        pending: books.filter((b: Book) => b.status === 'pending').length,
        approved: books.filter((b: Book) => b.status === 'approved').length,
        rejected: books.filter((b: Book) => b.status === 'rejected').length,
        archived: books.filter((b: Book) => b.status === 'archived').length,
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <CardTitle>Book Management</CardTitle>
                            <CardDescription>
                                Review and manage book submissions. Total: {stats.total} books
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === "list" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                            >
                                List
                            </Button>
                            <Button
                                variant={viewMode === "grid" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                            >
                                Grid
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <Card className="p-3 text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                        </Card>
                        <Card className="p-3 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </Card>
                        <Card className="p-3 text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                            <div className="text-sm text-muted-foreground">Approved</div>
                        </Card>
                        <Card className="p-3 text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-sm text-muted-foreground">Rejected</div>
                        </Card>
                        <Card className="p-3 text-center">
                            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
                            <div className="text-sm text-muted-foreground">Archived</div>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or author..."
                                className="pl-9"
                            />
                        </div>

                        <Select value={status} onValueChange={(value: "pending" | "approved" | "rejected" | "archived" | "all") => setStatus(value)}>
                            <SelectTrigger>
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                                <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sort} onValueChange={(value: "newest" | "oldest" | "az" | "downloads") => setSort(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="az">A → Z (Title)</SelectItem>
                                <SelectItem value="downloads">Most Downloads</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                            <Button onClick={fetchBooks} variant="outline" className="flex items-center gap-2 flex-1">
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg">
                            <div className="space-y-2">
                                <Label>Genre</Label>
                                <Select value={genreFilter} onValueChange={setGenreFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All genres" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Genres</SelectItem>
                                        {genres.map((genre: Genre) => (
                                            <SelectItem key={genre.id} value={genre.id}>
                                                {genre.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Visibility</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="public">Public Only</SelectItem>
                                        <SelectItem value="private">Private Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" onClick={() => {
                                    setGenreFilter("all")
                                    setSearch("")
                                }}>
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {selectedBooks.size > 0 && (
                        <Card className="mb-6 bg-muted/50">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            {selectedBooks.size} book{selectedBooks.size > 1 ? 's' : ''} selected
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    Update Status
                                                    <ChevronDown className="w-4 h-4 ml-2" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => bulkUpdateStatus("approved")}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => bulkUpdateStatus("rejected")}>
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => bulkUpdateStatus("archived")}>
                                                    <Archive className="w-4 h-4 mr-2" />
                                                    Archive
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedBooks(new Set())}
                                        >
                                            Clear Selection
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Books List/Grid */}
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-lg animate-pulse bg-muted" />
                            ))}
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No books found</h3>
                            <p className="text-muted-foreground">
                                {status === "all" ? "No books in the system" : `No ${status} books found`}
                            </p>
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="space-y-4">
                            {/* Header with select all */}
                            <div className="flex items-center gap-4 p-2 border-b">
                                <Switch
                                    checked={selectedBooks.size === books.length && books.length > 0}
                                    onCheckedChange={selectAllBooks}
                                />
                                <span className="text-sm text-muted-foreground">Select all</span>
                            </div>

                            {books.map((book: Book) => (
                                <Card key={book.id} className="p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <Switch
                                            checked={selectedBooks.has(book.id)}
                                            onCheckedChange={() => toggleBookSelection(book.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-semibold text-lg">{book.title}</h3>
                                                        {getStatusBadge(book.status)}
                                                        {!book.is_public && (
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                <EyeOff className="w-3 h-3" />
                                                                Hidden
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4" />
                                                            <span>{book.author}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Tag className="w-4 h-4" />
                                                            <span>{book.genres?.name || "Uncategorized"}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formatDate(book.upload_at)}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Download className="w-4 h-4" />
                                                            <span>{book.download_count} downloads</span>
                                                        </div>
                                                    </div>

                                                    {book.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {book.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>Size: {formatFileSize(book.file_size_bytes)}</span>
                                                        <span>•</span>
                                                        <span>Public: {book.is_public ? "Yes" : "No"}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {book.status === "pending" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updateStatus(book.id, "approved")}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateStatus(book.id, "rejected")}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="sm" variant="outline">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => setEditBook(book)}>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => toggleBookVisibility(book.id, book.is_public)}
                                                            >
                                                                {book.is_public ? (
                                                                    <EyeOff className="w-4 h-4 mr-2" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                )}
                                                                {book.is_public ? "Hide" : "Publish"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={book.file_url} target="_blank" rel="noopener noreferrer">
                                                                    <FileText className="w-4 h-4 mr-2" />
                                                                    View PDF
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => deleteBook(book.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        // Grid View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {books.map((book: Book) => (
                                <Card key={book.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(book.status)}
                                                {!book.is_public && (
                                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => setEditBook(book)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => toggleBookVisibility(book.id, book.is_public)}
                                                    >
                                                        {book.is_public ? (
                                                            <EyeOff className="w-4 h-4 mr-2" />
                                                        ) : (
                                                            <Eye className="w-4 h-4 mr-2" />
                                                        )}
                                                        {book.is_public ? "Hide" : "Publish"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={book.file_url} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            View PDF
                                                        </a>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold line-clamp-2 mb-1">{book.title}</h3>
                                            <p className="text-sm text-muted-foreground">{book.author}</p>
                                        </div>

                                        {book.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {book.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{book.genres?.name || "Uncategorized"}</span>
                                            <span>{formatDate(book.upload_at)}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <DownloadIcon className="w-3 h-3" />
                                                    {book.download_count}
                                                </span>
                                                <span>{formatFileSize(book.file_size_bytes)}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {book.status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateStatus(book.id, "approved")}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateStatus(book.id, "rejected")}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <EditBookModal
                book={editBook}
                onClose={() => setEditBook(null)}
                onSaved={fetchBooks}
                genres={genres}
            />
        </div>
    )
}