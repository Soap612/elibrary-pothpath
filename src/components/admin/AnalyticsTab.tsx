"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    RefreshCw,
    CheckCircle,
    BookOpen,
    TrendingUp,
    Users
} from "lucide-react"
import { StatCard } from "@/components/admin/StatCard"
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'

type AnalyticsBook = {
    id: string
    status: "pending" | "approved" | "rejected" | "archived"
    genre_id: string | null
    genres: { name: string } | null
    upload_at: string
    published_at: string | null
    is_public: boolean
}

type MonthlyData = {
    month: string
    approved: number
    pending: number
    total: number
}

type StatusData = {
    name: string
    value: number
    color: string
}

export function AnalyticsTab() {
    const [books, setBooks] = useState<AnalyticsBook[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from("books")
                .select("id, status, genre_id, genres(name), upload_at, published_at, is_public")

            if (!error && data) {
                setBooks(data.map(book => ({
                    ...book,
                    genres: Array.isArray(book.genres) ? book.genres[0] : book.genres
                })) as AnalyticsBook[])
            }
            setLoading(false)
        }

        fetchData()
    }, [])

    const countsByStatus = useMemo(() => {
        const counts = { approved: 0, pending: 0, rejected: 0, archived: 0 }
        books.forEach(book => {
            counts[book.status] = (counts[book.status] || 0) + 1
        })
        return counts
    }, [books])

    const booksByGenre = useMemo(() => {
        const genreMap: Record<string, number> = {}
        books
            .filter(book => book.status === "approved")
            .forEach(book => {
                const genreName = book.genres?.name || "Uncategorized"
                genreMap[genreName] = (genreMap[genreName] || 0) + 1
            })
        return genreMap
    }, [books])

    // Monthly upload data
    const monthlyData = useMemo(() => {
        const monthly: Record<string, MonthlyData> = {}

        books.forEach(book => {
            const date = new Date(book.upload_at)
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

            if (!monthly[monthKey]) {
                monthly[monthKey] = {
                    month: monthName,
                    approved: 0,
                    pending: 0,
                    total: 0
                }
            }

            monthly[monthKey].total++
            if (book.status === 'approved') {
                monthly[monthKey].approved++
            } else if (book.status === 'pending') {
                monthly[monthKey].pending++
            }
        })

        return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))
    }, [books])

    // Status data for pie chart
    const statusData = useMemo((): StatusData[] => [
        { name: 'Approved', value: countsByStatus.approved, color: '#10b981' },
        { name: 'Pending', value: countsByStatus.pending, color: '#f59e0b' },
        { name: 'Rejected', value: countsByStatus.rejected, color: '#ef4444' },
        { name: 'Archived', value: countsByStatus.archived, color: '#6b7280' }
    ], [countsByStatus])

    // Genre data for bar chart
    const genreChartData = useMemo(() => {
        return Object.entries(booksByGenre)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10) // Top 10 genres
            .map(([name, count]) => ({ name, count }))
    }, [booksByGenre])

    // Public vs Private books
    const publicPrivateData = useMemo(() => {
        const publicBooks = books.filter(book => book.is_public).length
        const privateBooks = books.length - publicBooks
        return [
            { name: 'Public', value: publicBooks, color: '#10b981' },
            { name: 'Private', value: privateBooks, color: '#6b7280' }
        ]
    }, [books])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                        Loading analytics data...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-lg animate-pulse bg-muted" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Books"
                    value={books.length}
                    description="All books in system"
                    icon={<BookOpen className="w-6 h-6" />}
                />
                <StatCard
                    title="Approved Books"
                    value={countsByStatus.approved}
                    description="Currently published"
                    icon={<CheckCircle className="w-6 h-6" />}
                />
                <StatCard
                    title="Pending Review"
                    value={countsByStatus.pending}
                    description="Awaiting approval"
                    icon={<RefreshCw className="w-6 h-6" />}
                />
                <StatCard
                    title="Public Books"
                    value={books.filter(book => book.is_public).length}
                    description="Visible to users"
                    icon={<Users className="w-6 h-6" />}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Upload Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Upload Trend</CardTitle>
                        <CardDescription>
                            Book uploads over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Books" />
                                <Area type="monotone" dataKey="approved" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Approved" />
                                <Area type="monotone" dataKey="pending" stackId="3" stroke="#ffc658" fill="#ffc658" name="Pending" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                        <CardDescription>
                            Breakdown of books by approval status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label={(props: any) => `${props.name} (${(props.percent * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} books`, 'Count']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Genres Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Genres</CardTitle>
                        <CardDescription>
                            Most popular genres (approved books only)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={genreChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} books`, 'Count']} />
                                <Bar dataKey="count" fill="#8884d8" name="Books" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Public vs Private */}
                <Card>
                    <CardHeader>
                        <CardTitle>Visibility Distribution</CardTitle>
                        <CardDescription>
                            Public vs Private books
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={publicPrivateData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label={(props: any) => `${props.name} (${(props.percent * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {publicPrivateData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} books`, 'Count']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {books.length > 0 ? ((countsByStatus.approved / books.length) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {countsByStatus.approved} of {books.length} books approved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Rate</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {books.length > 0 ? ((countsByStatus.pending / books.length) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {countsByStatus.pending} books awaiting review
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Genres</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Object.keys(booksByGenre).length}</div>
                        <p className="text-xs text-muted-foreground">
                            Genres with approved books
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}