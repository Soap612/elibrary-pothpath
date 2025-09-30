// src/app/books/edit/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    Save,
    Upload,
    BookOpen,
    User,
    Tag,
    FileText,
    Shield,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react"

type Book = {
    id: string
    title: string
    author: string
    description: string | null
    file_url: string
    genre_id: string | null
    file_size_bytes: number | null
    status: string
    is_public: boolean
    upload_at: string
    published_at: string | null
    upload_by: string
    approved_by: string | null
    approved_at: string | null
    tags: string[] | null
    updated_at: string
    version: number | null
    genres: {
        name: string
    } | null
}

type Genre = {
    id: string
    name: string
}

export default function EditBookPage() {
    const router = useRouter()
    const params = useParams()
    const bookId = params.id as string

    const [book, setBook] = useState<Book | null>(null)
    const [genres, setGenres] = useState<Genre[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        description: "",
        genre_id: "none", // Changed from empty string to "none"
        is_public: true,
        tags: [] as string[],
        status: "pending"
    })

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push("/login")
                return
            }

            try {
                // Fetch book data
                const { data: bookData, error: bookError } = await supabase
                    .from("books")
                    .select("*, genres(name)")
                    .eq("id", bookId)
                    .single()

                if (bookError) {
                    throw new Error("Book not found")
                }

                // Check if user owns this book
                if (bookData.upload_by !== session.user.id) {
                    throw new Error("You don't have permission to edit this book")
                }

                setBook(bookData as Book)
                setFormData({
                    title: bookData.title,
                    author: bookData.author,
                    description: bookData.description || "",
                    genre_id: bookData.genre_id || "none", // Map null/empty to "none"
                    is_public: bookData.is_public,
                    tags: bookData.tags || [],
                    status: bookData.status
                })

                // Fetch genres
                const { data: genresData, error: genresError } = await supabase
                    .from("genres")
                    .select("id, name")
                    .eq("is_active", true)
                    .order("name")

                if (!genresError && genresData) {
                    setGenres(genresData)
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [bookId, router])

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleTagsChange = (value: string) => {
        const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        setFormData(prev => ({
            ...prev,
            tags: tagsArray
        }))
    }

    const handleSave = async () => {
        if (!book) return

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const { error: updateError } = await supabase
                .from("books")
                .update({
                    title: formData.title,
                    author: formData.author,
                    description: formData.description || null,
                    genre_id: formData.genre_id === "none" ? null : formData.genre_id, // Convert "none" back to null
                    is_public: formData.is_public,
                    tags: formData.tags.length > 0 ? formData.tags : null,
                    status: formData.status,
                    updated_at: new Date().toISOString()
                })
                .eq("id", bookId)

            if (updateError) {
                throw updateError
            }

            setSuccess("Book updated successfully!")

            // Redirect to profile after 2 seconds
            setTimeout(() => {
                router.push("/profile")
            }, 2000)

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update book")
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        router.push("/profile")
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Unknown size"

        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 Bytes'

        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading book details...</p>
                </div>
            </div>
        )
    }

    if (error && !book) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Error</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => router.push("/profile")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Profile
                    </Button>
                </div>
            </div>
        )
    }

    if (!book) {
        return null
    }

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/profile")}
                            className="mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Profile
                        </Button>
                        <h1 className="text-3xl font-extrabold tracking-tight">Edit Book</h1>
                        <p className="text-muted-foreground mt-2">
                            Update your book information and settings
                        </p>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/15 border border-green-500/50 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Book Information
                                </CardTitle>
                                <CardDescription>
                                    Update the basic information about your book
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        placeholder="Enter book title"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="author">Author *</Label>
                                    <Input
                                        id="author"
                                        value={formData.author}
                                        onChange={(e) => handleInputChange("author", e.target.value)}
                                        placeholder="Enter author name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        placeholder="Enter book description"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="genre">Genre</Label>
                                        <Select
                                            value={formData.genre_id}
                                            onValueChange={(value) => handleInputChange("genre_id", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select genre" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* Fixed: Use "none" instead of empty string */}
                                                <SelectItem value="none">No Genre</SelectItem>
                                                {genres.map((genre) => (
                                                    <SelectItem key={genre.id} value={genre.id}>
                                                        {genre.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags</Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags.join(', ')}
                                        onChange={(e) => handleTagsChange(e.target.value)}
                                        placeholder="Enter tags separated by commas"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Separate tags with commas (e.g., fiction, fantasy, adventure)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Visibility Settings
                                </CardTitle>
                                <CardDescription>
                                    Control who can see and access your book
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {formData.is_public ? (
                                            <Eye className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <EyeOff className="w-5 h-5 text-amber-600" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {formData.is_public ? "Public" : "Private"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formData.is_public
                                                    ? "Anyone can view and download this book"
                                                    : "Only you can see this book"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleInputChange("is_public", !formData.is_public)}
                                    >
                                        {formData.is_public ? "Make Private" : "Make Public"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Info & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Book Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">File URL</p>
                                    <p className="text-sm truncate" title={book.file_url}>
                                        {book.file_url ? "File attached" : "No file"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">File Size</p>
                                    <p className="text-sm">{formatFileSize(book.file_size_bytes)}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Uploaded</p>
                                    <p className="text-sm">{formatDate(book.upload_at)}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-sm">{formatDate(book.updated_at)}</p>
                                </div>

                                {book.approved_at && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                        <p className="text-sm">{formatDate(book.approved_at)}</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSave}
                                        disabled={saving || !formData.title || !formData.author}
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Current Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        book.status === 'approved' ? 'default' :
                                            book.status === 'rejected' ? 'destructive' :
                                                book.status === 'archived' ? 'outline' : 'secondary'
                                    }>
                                        {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {book.status === 'approved' && '✓ Your book is live and available for download'}
                                        {book.status === 'pending' && '⏳ Your book is awaiting approval'}
                                        {book.status === 'rejected' && '❌ Your book was rejected by moderators'}
                                        {book.status === 'archived' && '📦 Your book is archived and hidden'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}