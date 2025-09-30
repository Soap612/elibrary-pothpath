"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

type AnalyticsBook = {
    id: string
    status: "pending" | "approved" | "rejected" | "archived"
    genre_id: string | null
    genres: { name: string } | null
    download_count: number
}


export function EditBookModal({
    book,
    onClose,
    onSaved,
    genres
}: {
    book: Book | null
    onClose: () => void
    onSaved: () => void
    genres: Genre[]
}) {
    const [title, setTitle] = useState("")
    const [author, setAuthor] = useState("")
    const [description, setDescription] = useState("")
    const [genreId, setGenreId] = useState<string>("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (book) {
            setTitle(book.title)
            setAuthor(book.author)
            setDescription(book.description || "")
            setGenreId(book.genre_id || "")
        }
    }, [book])

    async function save() {
        if (!book) return

        setSaving(true)
        const { error } = await supabase
            .from("books")
            .update({
                title,
                author,
                description: description || null,
                genre_id: genreId || null
            })
            .eq("id", book.id)

        setSaving(false)

        if (error) {
            alert("Failed to update book")
            return
        }

        onSaved()
        onClose()
    }

    if (!book) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Edit Book</CardTitle>
                    <CardDescription>
                        Update book information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Book title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input
                            id="author"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Author name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Book description"
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Select value={genreId} onValueChange={setGenreId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a genre" />
                            </SelectTrigger>
                            <SelectContent>
                                {genres.map((genre) => (
                                    <SelectItem key={genre.id} value={genre.id}>
                                        {genre.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <div className="flex gap-3 p-6 pt-0">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={saving} className="flex-1">
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </Card>
        </div>
    )
}