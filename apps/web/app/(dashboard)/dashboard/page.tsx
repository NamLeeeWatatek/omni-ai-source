"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { FiActivity, FiCreditCard, FiDollarSign, FiUsers } from "react-icons/fi"
import { fetchAPI } from "@/lib/api"

interface DashboardStats {
    total_flows: number
    active_bots: number
    total_conversations: number
    messages_today: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchAPI("/stats/dashboard")
                setStats(data)
            } catch (error) {
                console.error("Error fetching stats:", error)
                setStats(null)
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Spinner className="size-8 text-primary" />
            </div>
        )
    }

    return (
        <div className="content-wrapper h-full">
            <div className="page-container max-w-7xl mx-auto">
                <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
                </div>
                <Button>Download</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between mb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Flows</h3>
                        <FiDollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.total_flows || 0}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </Card>

                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between mb-2">
                        <h3 className="tracking-tight text-sm font-medium">Active Bots</h3>
                        <FiUsers className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.active_bots || 0}</div>
                    <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </Card>

                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between mb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Conversations</h3>
                        <FiCreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.total_conversations || 0}</div>
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
                </Card>

                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between mb-2">
                        <h3 className="tracking-tight text-sm font-medium">Messages Today</h3>
                        <FiActivity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.messages_today || 0}</div>
                    <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-xl font-semibold">Overview</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="h-[350px] w-full bg-muted/20 flex items-center justify-center text-muted-foreground rounded-lg">
                            Chart Placeholder
                        </div>
                    </div>
                </Card>
                <Card className="lg:col-span-3">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-xl font-semibold">Recent Sales</h3>
                        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center text-white font-semibold">
                                    OM
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium">Olivia Martin</p>
                                    <p className="text-xs text-muted-foreground">olivia.martin@email.com</p>
                                </div>
                                <div className="font-medium">+$1,999.00</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center text-white font-semibold">
                                    JL
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium">Jackson Lee</p>
                                    <p className="text-xs text-muted-foreground">jackson.lee@email.com</p>
                                </div>
                                <div className="font-medium">+$39.00</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            </div>
        </div>
    )
}
