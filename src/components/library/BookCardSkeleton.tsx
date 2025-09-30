interface BookCardSkeletonProps {
    viewMode: "grid" | "list"
}

export function BookCardSkeleton({ viewMode }: BookCardSkeletonProps) {
    if (viewMode === "list") {
        return (
            <div className="rounded-xl border shadow-sm p-6 bg-card">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-16 h-20 rounded-lg animate-pulse bg-muted" />
                    <div className="flex-1 space-y-3">
                        <div className="h-6 rounded animate-pulse w-3/4 bg-muted" />
                        <div className="h-4 rounded animate-pulse w-1/2 bg-muted" />
                        <div className="h-4 rounded animate-pulse w-full bg-muted" />
                        <div className="h-4 rounded animate-pulse w-2/3 bg-muted" />
                        <div className="flex gap-4">
                            <div className="h-8 rounded animate-pulse w-24 bg-muted" />
                            <div className="h-8 rounded animate-pulse w-24 bg-muted" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border shadow-sm p-5 space-y-3 bg-card">
            <div className="h-4 rounded animate-pulse w-1/3 bg-muted" />
            <div className="w-12 h-16 rounded-lg animate-pulse mx-auto bg-muted" />
            <div className="h-6 rounded animate-pulse bg-muted" />
            <div className="h-4 rounded animate-pulse w-2/3 mx-auto bg-muted" />
            <div className="h-12 rounded animate-pulse bg-muted" />
            <div className="h-3 rounded animate-pulse w-full bg-muted" />
        </div>
    )
}