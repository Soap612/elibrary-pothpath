"use client"

import { motion } from "framer-motion"
import {
    ArrowDownTrayIcon,
    DocumentTextIcon,
    ShareIcon,
    HeartIcon,
    BookmarkIcon,
    XMarkIcon,
    EyeIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline"
import {
    HeartIcon as HeartSolidIcon,
    BookmarkIcon as BookmarkSolidIcon
} from "@heroicons/react/24/solid"

type BookRow = {
    id: string
    title: string
    author: string | null
    description: string | null
    file_url: string
    upload_at: string
    file_size_bytes: number | null
    is_public: boolean
    genres: { name: string; color_code?: string } | null
}

const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
}

const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

interface BookDetailModalProps {
    book: BookRow
    isFavorite: boolean
    isBookmarked: boolean
    onClose: () => void
    onToggleFavorite: () => void
    onToggleBookmark: () => void
    onShare: () => void
}

export function BookDetailModal({
    book,
    isFavorite,
    isBookmarked,
    onClose,
    onToggleFavorite,
    onToggleBookmark,
    onShare
}: BookDetailModalProps) {
    const genreColor = book.genres?.color_code || "hsl(var(--primary))"

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: `${genreColor}15`,
                            color: genreColor,
                            border: `1px solid ${genreColor}30`
                        }}
                    >
                        {book.genres?.name || "Uncategorized"}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Book Cover and Basic Info */}
                    <div className="text-center mb-8">
                        <div
                            className="w-24 h-32 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md"
                            style={{
                                backgroundColor: `${genreColor}15`,
                                border: `1px solid ${genreColor}30`
                            }}
                        >
                            <DocumentTextIcon
                                className="w-10 h-10"
                                style={{ color: genreColor }}
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-card-foreground mb-3 leading-tight">
                            {book.title}
                        </h2>
                        {book.author && (
                            <p className="text-lg text-muted-foreground">by {book.author}</p>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="text-lg font-semibold text-card-foreground">
                                {formatFileSize(book.file_size_bytes)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">File Size</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center justify-center gap-1 text-sm text-card-foreground">
                                <CalendarDaysIcon className="w-4 h-4" />
                                {formatDate(book.upload_at)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Uploaded</div>
                        </div>
                    </div>

                    {/* Description */}
                    {book.description && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-card-foreground mb-3">Description</h3>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                {book.description}
                            </p>
                        </div>
                    )}

                    {/* Primary Actions */}
                    <div className="flex gap-3 mb-6">
                        <a
                            href={book.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
                        >
                            <DocumentTextIcon className="w-5 h-5" />
                            Read Online
                        </a>
                        <a
                            href={book.file_url}
                            download
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-semibold text-sm"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Download
                        </a>
                        <button
                            onClick={onShare}
                            className="px-4 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center justify-center gap-4 pt-6 border-t border-border">
                        <button
                            onClick={onToggleFavorite}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                        >
                            {isFavorite ? (
                                <HeartSolidIcon className="w-5 h-5 text-red-500" />
                            ) : (
                                <HeartIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className={isFavorite ? "text-red-500" : "text-muted-foreground"}>
                                {isFavorite ? "Favorited" : "Add to Favorites"}
                            </span>
                        </button>
                        <button
                            onClick={onToggleBookmark}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                        >
                            {isBookmarked ? (
                                <BookmarkSolidIcon className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <BookmarkIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className={isBookmarked ? "text-yellow-500" : "text-muted-foreground"}>
                                {isBookmarked ? "Bookmarked" : "Add to Bookmarks"}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}