'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    FiUserPlus,
    FiMail,
    FiShield,
    FiTrash2,
    FiMoreVertical
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function TeamPage() {
    const [inviteEmail, setInviteEmail] = useState('')

    const sendInvite = () => {
        if (!inviteEmail.trim()) {
            toast.error('Please enter an email address')
            return
        }
        toast.success(`Invitation sent to ${inviteEmail}`)
        setInviteEmail('')
    }

    return (
        <div className="h-full">
            <div className="page-header">
                <h1 className="text-3xl font-bold">Team</h1>
                <p className="text-muted-foreground">
                    Manage your team members and permissions
                </p>
            </div>

            {/* Invite Section */}
            <Card className="p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="pl-10"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') sendInvite()
                            }}
                        />
                    </div>
                    <Button onClick={sendInvite}>
                        <FiUserPlus className="w-4 h-4 mr-2" />
                        Send Invite
                    </Button>
                </div>
            </Card>

            {/* Team Members */}
            <Card className="overflow-hidden">
                <div className="p-6 border-b border-border/40">
                    <h2 className="text-lg font-semibold">Team Members</h2>
                </div>

                <div className="divide-y divide-border/40">
                    {/* Current User */}
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-wata flex items-center justify-center">
                                <span className="text-white font-semibold">You</span>
                            </div>
                            <div>
                                <p className="font-medium">You (Owner)</p>
                                <p className="text-sm text-muted-foreground">your@email.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="default" className="flex items-center gap-2">
                                <FiShield className="w-4 h-4" />
                                Owner
                            </Badge>
                        </div>
                    </div>

                    {/* Placeholder for future members */}
                    <div className="p-12 text-center text-muted-foreground">
                        <FiUserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No team members yet</p>
                        <p className="text-sm mt-1">Invite colleagues to collaborate</p>
                    </div>
                </div>
            </Card>

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-500">
                    <strong>Note:</strong> Team management features are coming soon. You'll be able to invite members, assign roles, and manage permissions.
                </p>
            </div>
        </div>
    )
}
