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
        <div className="h-full">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
                </div>
                <Button>Download</Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Flows Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-blue-600/10 text-blue-600">
                                <FiDollarSign className="w-6 h-6" />
                            </div>
                            <div className="flex items-center text-xs font-medium text-green-500">
                                <span>+20.1%</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.total_flows || 0}</h3>
                        <p className="text-sm text-muted-foreground">Total Flows</p>
                    </div>
                </div>

                {/* Active Bots Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-green-600/10 text-green-600">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            <div className="flex items-center text-xs font-medium text-green-500">
                                <span>+180.1%</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.active_bots || 0}</h3>
                        <p className="text-sm text-muted-foreground">Active Bots</p>
                    </div>
                </div>

                {/* Total Conversations Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-cyan-600/10 text-cyan-600">
                                <FiCreditCard className="w-6 h-6" />
                            </div>
                            <div className="flex items-center text-xs font-medium text-green-500">
                                <span>+19%</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.total_conversations || 0}</h3>
                        <p className="text-sm text-muted-foreground">Total Conversations</p>
                    </div>
                </div>

                {/* Messages Today Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-600">
                                <FiActivity className="w-6 h-6" />
                            </div>
                            <div className="flex items-center text-xs font-medium text-green-500">
                                <span>+201</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.messages_today || 0}</h3>
                        <p className="text-sm text-muted-foreground">Messages Today</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-7 mt-6">
                <div className="glass lg:col-span-4 rounded-xl overflow-hidden">
                    <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
                        <h3 className="text-xl font-semibold">Overview</h3>
                    </div>
                    <div className="p-6">
                        <div className="h-[350px] w-full bg-muted/20 flex items-center justify-center text-muted-foreground rounded-lg border border-border/40">
                            Chart Placeholder
                        </div>
                    </div>
                </div>
                <div className="glass lg:col-span-3 rounded-xl overflow-hidden">
                    <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
                        <h3 className="text-xl font-semibold">Recent Sales</h3>
                        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold shadow-md shadow-blue-600/30">
                                    OM
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium">Olivia Martin</p>
                                    <p className="text-xs text-muted-foreground">olivia.martin@email.com</p>
                                </div>
                                <div className="font-medium">+$1,999.00</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-semibold shadow-md shadow-cyan-600/30">
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
                </div>
            </div>
        </div>
    )
}
