// src/app/profile/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    User,
    Mail,
    Calendar,
    Book,
    CloudUpload,
    Download,
    Edit3,
    Save,
    X,
    LogOut,
    Shield
} from "lucide-react"

type UserProfile = {
    id: string
    email: string
    user_metadata?: {
        full_name?: string
        avatar_url?: string
        picture?: string
        bio?: string
    }
    created_at: string
}

type UserBook = {
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

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [userBooks, setUserBooks] = useState<UserBook[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const getProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push("/login")
                return
            }

            setUser({
                id: session.user.id,
                email: session.user.email!,
                user_metadata: {
                    full_name: session.user.user_metadata?.full_name || "",
                    bio: session.user.user_metadata?.bio || "",
                    avatar_url: session.user.user_metadata?.avatar_url || "",
                    picture: session.user.user_metadata?.picture || ""
                },
                created_at: session.user.created_at
            })

            // Fetch user's uploaded books using upload_by column
            const { data: books, error } = await supabase
                .from("books")
                .select("*, genres(name)")
                .eq("upload_by", session.user.id)
                .order("upload_at", { ascending: false })

            if (error) {
                console.error("Error fetching books:", error)
            }

            if (books) {
                setUserBooks(books as UserBook[])
            }

            setLoading(false)
        }

        getProfile()
    }, [router])

    const handleSaveProfile = async () => {
        if (!user) return

        setSaving(true)
        // Add profile update logic here if needed
        setSaving(false)
        setEditing(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
    }

    const getInitials = (name: string, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email.slice(0, 2).toUpperCase()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Unknown size"

        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 Bytes'

        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary" as const, label: "Pending" },
            approved: { variant: "default" as const, label: "Approved" },
            rejected: { variant: "destructive" as const, label: "Rejected" },
            archived: { variant: "outline" as const, label: "Archived" }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    // Helper function to get avatar URL
    const getAvatarUrl = () => {
        return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""
    }

    const handleEditBook = (bookId: string) => {
        // Navigate to edit book page
        router.push(`/books/edit/${bookId}`)
    }

    const handleDownloadBook = async (book: UserBook) => {
        // Implement download logic
        if (book.file_url) {
            window.open(book.file_url, '_blank')
        }
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">User Profile</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your account and view your uploaded books
                        </p>
                    </div>
                    <div className="flex gap-2">
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <CardHeader className="text-center">
                                <div className="flex justify-center mb-4">
                                    <Avatar className="w-24 h-24 border-4 border-background">
                                        <AvatarImage
                                            src={getAvatarUrl()}
                                            alt={user.user_metadata?.full_name || user.email}
                                        />
                                        <AvatarFallback className="text-lg">
                                            {getInitials(user.user_metadata?.full_name || "", user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <CardTitle className="text-xl">
                                    {user.user_metadata?.full_name || "User"}
                                </CardTitle>
                                <CardDescription className="flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {formatDate(user.created_at)}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Book className="w-4 h-4" />
                                    <span>{userBooks.length} books uploaded</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4" />
                                    <span>Verified Account</span>
                                </div>

                                <Separator />

                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        asChild
                                    >
                                        <a href="/upload">Upload New Book</a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - User's Books */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CloudUpload className="w-5 h-5" />
                                    Your Uploaded Books
                                </CardTitle>
                                <CardDescription>
                                    Manage and track the books you've uploaded to Pothpath
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {userBooks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No books uploaded yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Start sharing your knowledge by uploading your first book
                                        </p>
                                        <Button asChild>
                                            <a href="/upload">Upload Your First Book</a>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userBooks.map((book) => (
                                            <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-lg">{book.title}</h3>
                                                        {getStatusBadge(book.status)}
                                                        {!book.is_public && (
                                                            <Badge variant="outline">Private</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        by {book.author}
                                                    </p>
                                                    {book.description && (
                                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                            {book.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>{book.genres?.name || "Uncategorized"}</span>
                                                        <span>•</span>
                                                        <span>Uploaded {formatDate(book.upload_at)}</span>
                                                        <span>•</span>
                                                        <span>{formatFileSize(book.file_size_bytes)}</span>
                                                        {book.tags && book.tags.length > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    Tags: {book.tags.slice(0, 3).join(', ')}
                                                                    {book.tags.length > 3 && ` +${book.tags.length - 3} more`}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownloadBook(book)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Download
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditBook(book.id)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}