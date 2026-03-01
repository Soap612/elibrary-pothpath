"use client"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
    title,
    value,
    description,
    icon
}: {
    title: string
    value: number
    description: string
    icon: React.ReactNode
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                    <div className="text-primary">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}