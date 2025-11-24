'use client'

import { useState } from 'react'
import { Button } from '@wataomi/ui'
import {
    FiSearch,
    FiUsers,
    FiMail,
    FiShield,
    FiMoreVertical,
    FiCheckCircle
} from 'react-icons/fi'
import { FaCrown } from 'react-icons/fa'

export default function TeamPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const teamMembers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Owner',
            avatar: 'JD',
            status: 'active',
            joined: '2024-01-01',
            last_active: '2 hours ago'
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'Admin',
            avatar: 'JS',
            status: 'active',
            joined: '2024-01-05',
            last_active: '1 day ago'
        },
        {
            id: 3,
            name: 'Bob Johnson',
            email: 'bob@example.com',
            role: 'Member',
            avatar: 'BJ',
            status: 'active',
            joined: '2024-01-10',
            last_active: '3 days ago'
        },
        {
            id: 4,
            name: 'Alice Williams',
            email: 'alice@example.com',
            role: 'Member',
            avatar: 'AW',
            status: 'invited',
            joined: '2024-01-20',
            last_active: 'Never'
        }
    ]

    const roles = [
        {
            name: 'Owner',
            description: 'Full access to all features and settings',
            icon: FaCrown,
            color: 'text-wata-purple'
        },
        {
            name: 'Admin',
            description: 'Manage team members and workflows',
            icon: FiShield,
            color: 'text-wata-blue'
        },
        {
            name: 'Member',
            description: 'Create and edit workflows',
            icon: FiUsers,
            color: 'text-wata-cyan'
        }
    ]

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Team</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their permissions
                    </p>
                </div>
                <Button>
                    <FiMail className="w-4 h-4 mr-2" />
                    Invite Member
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiUsers className="w-5 h-5 text-wata-purple" />
                        <h3 className="text-sm font-medium text-muted-foreground">Total Members</h3>
                    </div>
                    <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiCheckCircle className="w-5 h-5 text-wata-blue" />
                        <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {teamMembers.filter(m => m.status === 'active').length}
                    </p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiMail className="w-5 h-5 text-wata-cyan" />
                        <h3 className="text-sm font-medium text-muted-foreground">Invited</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {teamMembers.filter(m => m.status === 'invited').length}
                    </p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiShield className="w-5 h-5 text-wata-pink" />
                        <h3 className="text-sm font-medium text-muted-foreground">Admins</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {teamMembers.filter(m => m.role === 'Admin' || m.role === 'Owner').length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Members List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search team members..."
                            className="w-full glass rounded-lg pl-12 pr-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Members List */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="divide-y divide-border/40">
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="p-6 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-wata-purple to-wata-blue flex items-center justify-center text-white font-semibold">
                                                {member.avatar}
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{member.name}</h3>
                                                    {member.role === 'Owner' && (
                                                        <FaCrown className="w-4 h-4 text-wata-purple" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${member.status === 'active'
                                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                        }`}>
                                                        {member.status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Last active: {member.last_active}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={member.role}
                                                className="glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                disabled={member.role === 'Owner'}
                                            >
                                                <option>Owner</option>
                                                <option>Admin</option>
                                                <option>Member</option>
                                            </select>
                                            <Button variant="ghost" size="sm">
                                                <FiMoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Roles Info */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-xl p-6 sticky top-8">
                        <h2 className="text-xl font-semibold mb-6">Roles & Permissions</h2>

                        <div className="space-y-4">
                            {roles.map((role) => (
                                <div
                                    key={role.name}
                                    className="p-4 rounded-lg bg-muted/20 border border-border/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg bg-muted ${role.color}`}>
                                            <role.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{role.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {role.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/40">
                            <h3 className="font-semibold mb-3">Invite New Member</h3>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    className="w-full glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <select className="w-full glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20">
                                    <option>Member</option>
                                    <option>Admin</option>
                                </select>
                                <Button className="w-full">
                                    <FiMail className="w-4 h-4 mr-2" />
                                    Send Invitation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
