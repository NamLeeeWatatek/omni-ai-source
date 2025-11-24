'use client'

import { useState } from 'react'
import { Button } from '@wataomi/ui'
import {
    FiSend,
    FiPaperclip,
    FiSmile,
    FiSearch,
    FiFilter,
    FiMoreVertical,
    FiPhone,
    FiVideo
} from 'react-icons/fi'

export default function InboxPage() {
    const [selectedConversation, setSelectedConversation] = useState(conversations[0])
    const [message, setMessage] = useState('')

    return (
        <div className="h-full flex">
            {/* Channels List */}
            <div className="w-64 border-r border-border/40 flex flex-col">
                <div className="p-4 border-b border-border/40">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search channels..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-2">
                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left mb-1"
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg ${channel.color} flex items-center justify-center`}>
                                    <span className="text-white font-semibold text-sm">
                                        {channel.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{channel.name}</p>
                                    <p className="text-xs text-muted-foreground">{channel.count} active</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversations List */}
            <div className="w-80 border-r border-border/40 flex flex-col">
                <div className="p-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="font-semibold">Conversations</h2>
                    <Button variant="ghost" size="sm">
                        <FiFilter className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-auto">
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className={`w-full p-4 border-b border-border/40 hover:bg-accent transition-colors text-left ${selectedConversation.id === conv.id ? 'bg-accent' : ''
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-semibold text-sm">
                                        {conv.customer.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-sm truncate">{conv.customer}</p>
                                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conv.lastMessage}
                                    </p>
                                    {conv.unread > 0 && (
                                        <div className="mt-1">
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-wata-purple text-white text-xs font-medium">
                                                {conv.unread}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="h-16 border-b border-border/40 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {selectedConversation.customer.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold">{selectedConversation.customer}</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedConversation.channel} • Active now
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                            <FiPhone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <FiVideo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <FiMoreVertical className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    {selectedConversation.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'customer'
                                    ? 'bg-muted'
                                    : 'bg-gradient-wata text-white'
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-muted-foreground' : 'text-white/70'
                                    }`}>
                                    {msg.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-border/40 p-4">
                    <div className="flex items-end space-x-2">
                        <Button variant="ghost" size="sm">
                            <FiPaperclip className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 glass rounded-lg border border-border/40 p-3">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                rows={1}
                                className="w-full bg-transparent resize-none outline-none text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        // Send message logic
                                        setMessage('')
                                    }
                                }}
                            />
                        </div>
                        <Button variant="ghost" size="sm">
                            <FiSmile className="w-4 h-4" />
                        </Button>
                        <Button size="sm" disabled={!message.trim()}>
                            <FiSend className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const channels = [
    { id: '1', name: 'WhatsApp', count: 45, color: 'bg-green-500' },
    { id: '2', name: 'Messenger', count: 32, color: 'bg-blue-500' },
    { id: '3', name: 'Instagram', count: 28, color: 'bg-pink-500' },
    { id: '4', name: 'Telegram', count: 15, color: 'bg-cyan-500' },
    { id: '5', name: 'Web Chat', count: 67, color: 'bg-purple-500' },
]

const conversations = [
    {
        id: '1',
        customer: 'Sarah Johnson',
        channel: 'WhatsApp',
        lastMessage: 'Thanks for the quick response!',
        time: '2m ago',
        unread: 2,
        messages: [
            { id: '1', sender: 'customer', content: 'Hi, I need help with my order', time: '10:30 AM' },
            { id: '2', sender: 'bot', content: 'Hello! I\'d be happy to help. Can you provide your order number?', time: '10:31 AM' },
            { id: '3', sender: 'customer', content: 'It\'s #12345', time: '10:32 AM' },
            { id: '4', sender: 'bot', content: 'Let me check that for you...', time: '10:32 AM' },
            { id: '5', sender: 'bot', content: 'Your order is currently being processed and will ship tomorrow!', time: '10:33 AM' },
            { id: '6', sender: 'customer', content: 'Thanks for the quick response!', time: '10:34 AM' },
        ],
    },
    {
        id: '2',
        customer: 'Mike Chen',
        channel: 'Messenger',
        lastMessage: 'Can I get more information about pricing?',
        time: '15m ago',
        unread: 0,
        messages: [
            { id: '1', sender: 'customer', content: 'Can I get more information about pricing?', time: '10:15 AM' },
        ],
    },
    {
        id: '3',
        customer: 'Emma Wilson',
        channel: 'Instagram',
        lastMessage: 'Perfect, that solved my issue.',
        time: '1h ago',
        unread: 0,
        messages: [
            { id: '1', sender: 'customer', content: 'Perfect, that solved my issue.', time: '9:30 AM' },
        ],
    },
]
