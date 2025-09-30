import { useState, useEffect } from "react";
import { Edit, Trash2, Tag, Plus, Search, Filter, ArrowUpDown, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Genre = {
    id: string;
    name: string;
    slug?: string;
    color_code?: string;
    is_active: boolean;
    sort_order: number;
    description?: string;
    book_count?: number;
}

type BookCountResult = {
    genre_id: string;
    book_count: number;
}

export function GenresTab() {
    const [genres, setGenres] = useState<Genre[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showInactive, setShowInactive] = useState(false)
    const [sortBy, setSortBy] = useState<"name" | "sort_order" | "book_count">("sort_order")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color_code: "#3b82f6",
        is_active: true,
        sort_order: 0
    })

    useEffect(() => {
        fetchGenres()
    }, [])

    async function fetchGenres() {
        setLoading(true)
        const { data: genresData, error } = await supabase
            .from("genres")
            .select("*")
            .order("sort_order")

        if (error) {
            toast.error("Failed to fetch genres")
            setLoading(false)
            return
        }

        // Get book counts for each genre
        const { data: bookCounts, error: countError } = await supabase
            .from("books")
            .select("genre_id")
            .eq("status", "approved")

        if (!countError && bookCounts) {
            const countMap = bookCounts.reduce((acc: Record<string, number>, book) => {
                if (book.genre_id) {
                    acc[book.genre_id] = (acc[book.genre_id] || 0) + 1
                }
                return acc
            }, {})

            const genresWithCounts = genresData.map(genre => ({
                ...genre,
                book_count: countMap[genre.id] || 0
            }))

            setGenres(genresWithCounts)
        } else {
            setGenres(genresData)
        }
        setLoading(false)
    }

    const filteredAndSortedGenres = genres
        .filter(genre =>
            genre.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (showInactive || genre.is_active)
        )
        .sort((a, b) => {
            let aValue: string | number = a[sortBy] ?? 0
            let bValue: string | number = b[sortBy] ?? 0

            if (sortBy === "book_count") {
                aValue = a.book_count || 0
                bValue = b.book_count || 0
            }

            if ((aValue ?? 0) < (bValue ?? 0)) return sortDirection === "asc" ? -1 : 1
            if ((aValue ?? 0) > (bValue ?? 0)) return sortDirection === "asc" ? 1 : -1
            return 0
        })

    function openAddDialog() {
        setEditingGenre(null)
        setFormData({
            name: "",
            description: "",
            color_code: "#3b82f6",
            is_active: true,
            sort_order: genres.length
        })
        setDialogOpen(true)
    }

    function openEditDialog(genre: Genre) {
        setEditingGenre(genre)
        setFormData({
            name: genre.name,
            description: genre.description || "",
            color_code: genre.color_code || "#3b82f6",
            is_active: genre.is_active,
            sort_order: genre.sort_order
        })
        setDialogOpen(true)
    }

    async function handleSubmit() {
        if (!formData.name.trim()) {
            toast.error("Genre name is required")
            return
        }

        const slug = formData.name.trim().toLowerCase().replace(/\s+/g, '-')
        const genreData = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color_code: formData.color_code,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            slug
        }

        if (editingGenre) {
            const { error } = await supabase
                .from("genres")
                .update(genreData)
                .eq("id", editingGenre.id)

            if (error) {
                toast.error("Failed to update genre")
                return
            }
            toast.success("Genre updated successfully")
        } else {
            const { error } = await supabase
                .from("genres")
                .insert([genreData])

            if (error) {
                toast.error("Failed to add genre (maybe duplicate name)")
                return
            }
            toast.success("Genre added successfully")
        }

        setDialogOpen(false)
        fetchGenres()
    }

    async function deleteGenre(id: string, name: string) {
        if (!confirm(`Delete genre "${name}"? Books linked to this genre will keep the genre_id but show as "Uncategorized".`)) {
            return
        }

        const { error } = await supabase.from("genres").delete().eq("id", id)
        if (error) {
            toast.error("Failed to delete genre")
            return
        }

        toast.success("Genre deleted successfully")
        fetchGenres()
    }

    async function toggleGenreStatus(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from("genres")
            .update({ is_active: !currentStatus })
            .eq("id", id)

        if (error) {
            toast.error("Failed to update genre status")
            return
        }

        toast.success(`Genre ${currentStatus ? "deactivated" : "activated"}`)
        fetchGenres()
    }

    function handleSort(field: "name" | "sort_order" | "book_count") {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortDirection("asc")
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Genre Management</CardTitle>
                            <CardDescription>
                                Add, edit, and manage book genres. Total: {genres.length} genres
                            </CardDescription>
                        </div>
                        <Button onClick={openAddDialog} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Genre
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search genres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <ArrowUpDown className="w-4 h-4" />
                                        Sort
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleSort("name")}>
                                        Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort("sort_order")}>
                                        Order {sortBy === "sort_order" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort("book_count")}>
                                        Book Count {sortBy === "book_count" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                variant={showInactive ? "default" : "outline"}
                                onClick={() => setShowInactive(!showInactive)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                {showInactive ? "All" : "Active"}
                            </Button>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-lg animate-pulse bg-muted" />
                            ))}
                        </div>
                    ) : filteredAndSortedGenres.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No genres found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery || !showInactive
                                    ? "Try adjusting your search or filter settings"
                                    : "Create your first genre to get started"
                                }
                            </p>
                            <Button onClick={openAddDialog}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Genre
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredAndSortedGenres.map((genre) => (
                                <Card key={genre.id} className="p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div
                                                className="w-6 h-6 rounded-full border shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: genre.color_code || "#6b7280" }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium truncate">{genre.name}</span>
                                                    <Badge variant={genre.is_active ? "default" : "secondary"}>
                                                        {genre.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                {genre.description && (
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {genre.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                    <span>Order: {genre.sort_order}</span>
                                                    <span>•</span>
                                                    <span>{genre.book_count || 0} books</span>
                                                    {genre.slug && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-mono">{genre.slug}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleGenreStatus(genre.id, genre.is_active)}
                                            >
                                                {genre.is_active ? "Deactivate" : "Activate"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEditDialog(genre)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteGenre(genre.id, genre.name)}
                                                disabled={(genre.book_count || 0) > 0}
                                                title={(genre.book_count || 0) > 0 ? "Cannot delete genre with books" : "Delete genre"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGenre ? "Edit Genre" : "Add New Genre"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGenre
                                ? "Update the genre details below."
                                : "Create a new genre for organizing books."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Genre Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter genre name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="color">Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={formData.color_code}
                                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                        className="w-16 p-1 h-10"
                                    />
                                    <Input
                                        value={formData.color_code}
                                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Sort Order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Active Genre</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingGenre ? "Update Genre" : "Add Genre"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}