"use client"

import { motion } from "framer-motion"
import {
    ArrowDownTrayIcon,
    DocumentTextIcon,
    ShareIcon,
    BookmarkIcon,
    HeartIcon,
} from "@heroicons/react/24/outline"
import { BookmarkIcon as BookmarkSolid, HeartIcon as HeartSolid } from "@heroicons/react/24/solid"

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

const formatWhen = (iso: string) => {
    const now = new Date()
    const date = new Date(iso)
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

interface BookCardProps {
    book: BookRow
    viewMode: "grid" | "list"
    isFavorite: boolean
    isBookmarked: boolean
    onToggleFavorite: () => void
    onToggleBookmark: () => void
    onShare: () => void
    onViewDetails: () => void
}

export function BookCard({
    book,
    viewMode,
    isFavorite,
    isBookmarked,
    onToggleFavorite,
    onToggleBookmark,
    onShare,
    onViewDetails
}: BookCardProps) {
    const genreColor = book.genres?.color_code || "hsl(var(--primary))"

    if (viewMode === "list") {
        return (
            <motion.div
                className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-all duration-300 group"
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.01 }}
            >
                <div className="flex gap-4">
                    {/* Book Cover */}
                    <div
                        className="flex-shrink-0 w-16 h-20 rounded-lg flex items-center justify-center bg-muted group-hover:bg-muted/80 transition-colors"
                        style={{
                            backgroundColor: `${genreColor}15`,
                            border: `1px solid ${genreColor}30`
                        }}
                    >
                        <DocumentTextIcon
                            className="w-8 h-8"
                            style={{ color: genreColor }}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-card-foreground group-hover:text-primary transition-colors mb-1">
                                    {book.title}
                                </h3>
                                {book.author && (
                                    <p className="text-muted-foreground text-sm">by {book.author}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 ml-4">
                                <button
                                    onClick={onToggleFavorite}
                                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                >
                                    {isFavorite ? (
                                        <HeartSolid className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <HeartIcon className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                                    )}
                                </button>
                                <button
                                    onClick={onToggleBookmark}
                                    className="p-2 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-colors"
                                >
                                    {isBookmarked ? (
                                        <BookmarkSolid className="w-4 h-4 text-yellow-500" />
                                    ) : (
                                        <BookmarkIcon className="w-4 h-4 text-muted-foreground hover:text-yellow-500 transition-colors" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {book.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
                                {book.description}
                            </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: `${genreColor}15`,
                                    color: genreColor,
                                    border: `1px solid ${genreColor}30`
                                }}
                            >
                                {book.genres?.name || "Uncategorized"}
                            </span>
                            <span>{formatWhen(book.upload_at)}</span>
                            <span>{formatFileSize(book.file_size_bytes)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <a
                                href={book.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                            >
                                <DocumentTextIcon className="w-4 h-4" />
                                Read Now
                            </a>
                            <a
                                href={book.file_url}
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium text-sm"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Download
                            </a>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={onShare}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                                >
                                    <ShareIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onViewDetails}
                                    className="px-3 py-2 text-muted-foreground hover:text-foreground font-medium transition-colors text-sm"
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Grid View
    return (
        <motion.div
            className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-300 group"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ scale: 1.02, y: -2 }}
        >
            {/* Header with genre and actions */}
            <div className="flex items-center justify-between mb-4">
                <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `${genreColor}15`,
                        color: genreColor,
                        border: `1px solid ${genreColor}30`
                    }}
                >
                    {book.genres?.name || "Uncategorized"}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleFavorite}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                        {isFavorite ? (
                            <HeartSolid className="w-4 h-4 text-red-500" />
                        ) : (
                            <HeartIcon className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                        )}
                    </button>
                    <button
                        onClick={onToggleBookmark}
                        className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-colors"
                    >
                        {isBookmarked ? (
                            <BookmarkSolid className="w-4 h-4 text-yellow-500" />
                        ) : (
                            <BookmarkIcon className="w-4 h-4 text-muted-foreground hover:text-yellow-500 transition-colors" />
                        )}
                    </button>
                </div>
            </div>

            {/* Book cover */}
            <div
                className="w-14 h-18 rounded-lg flex items-center justify-center mx-auto mb-4 bg-muted group-hover:bg-muted/80 transition-colors"
                style={{
                    backgroundColor: `${genreColor}15`,
                    border: `1px solid ${genreColor}30`
                }}
            >
                <DocumentTextIcon
                    className="w-6 h-6"
                    style={{ color: genreColor }}
                />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-2 text-card-foreground group-hover:text-primary transition-colors text-center">
                {book.title}
            </h3>

            {book.author && (
                <p className="text-sm mb-3 text-muted-foreground text-center">by {book.author}</p>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-4">
                <span>{formatWhen(book.upload_at)}</span>
                <span>•</span>
                <span>{formatFileSize(book.file_size_bytes)}</span>
            </div>

            {/* Primary Actions */}
            <div className="flex gap-2 mb-3">
                <a
                    href={book.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    <DocumentTextIcon className="w-4 h-4" />
                    Read
                </a>
                <a
                    href={book.file_url}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm rounded-lg transition-colors font-medium"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Save
                </a>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                    onClick={onShare}
                    className="text-xs transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
                >
                    <ShareIcon className="w-3.5 h-3.5" />
                    Share
                </button>
                <button
                    onClick={onViewDetails}
                    className="text-xs transition-colors text-muted-foreground hover:text-foreground font-medium"
                >
                    View Details
                </button>
            </div>
        </motion.div>
    )
}