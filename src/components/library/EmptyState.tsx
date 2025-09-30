"use client"

import { motion } from "framer-motion"
import { DocumentTextIcon } from "@heroicons/react/24/outline"

interface EmptyStateProps {
    onClearFilters: () => void
    hasFilters: boolean
}

export function EmptyState({ onClearFilters, hasFilters }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 rounded-2xl border-2 border-dashed border-border bg-card"
        >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <DocumentTextIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasFilters
                    ? "Try adjusting your search criteria or filters to find more books."
                    : "The library is currently empty. Check back later for new additions!"
                }
            </p>
            {hasFilters && (
                <button
                    onClick={onClearFilters}
                    className="px-6 py-3 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                >
                    Clear Filters
                </button>
            )}
        </motion.div>
    )
}