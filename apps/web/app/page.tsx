'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
    FiMessageSquare,
    FiZap,
    FiBarChart2,
    FiShield,
    FiCheck,
    FiArrowRight,
    FiCpu,
    FiGitMerge,
    FiInbox
} from 'react-icons/fi'
import { MdAutoAwesome } from 'react-icons/md'
import Link from 'next/link'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <MdAutoAwesome className="w-8 h-8 text-slate-400" />
                            <span className="text-2xl font-bold gradient-text">WataOmi</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-sm hover:text-slate-400 transition-colors">Features</a>
                            <a href="#pricing" className="text-sm hover:text-slate-400 transition-colors">Pricing</a>
                            <a href="#" className="text-sm hover:text-slate-400 transition-colors">Docs</a>
                            <Link href="/dashboard">
                                <Button variant="outline" size="sm">Sign In</Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        {/* <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-700/10 border border-slate-600/30/20 mb-8"
                        >
                            <MdAutoAwesome className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400 font-medium">Powered by AI & n8n</span>
                        </motion.div> */}

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            <span className="gradient-text">One AI.</span>
                            <br />
                            <span className="text-foreground">Every Channel.</span>
                            <br />
                            <span className="gradient-text">Zero Code.</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
                            Build intelligent customer conversations across WhatsApp, Messenger, Instagram,
                            and more. No coding required. Powered by AI and seamlessly integrated with n8n.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/dashboard">
                                <Button size="lg" className="group">
                                    Start Building Free
                                    <FiArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline">
                                Watch Demo
                            </Button>
                        </div>

                        {/* Hero Visual */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mt-20 relative"
                        >
                            <div className="glass rounded-2xl p-8 border border-border/40 shadow-2xl shadow-slate-700/20/10">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="glass rounded-lg p-6 border border-slate-600/30/20">
                                        <FiCpu className="w-8 h-8 text-slate-400 mb-3" />
                                        <h3 className="font-semibold mb-2">AI Bots</h3>
                                        <p className="text-sm text-muted-foreground">Smart conversations</p>
                                    </div>
                                    <div className="glass rounded-lg p-6 border border-slate-600/30/20">
                                        <FiGitMerge className="w-8 h-8 text-slate-400 mb-3" />
                                        <h3 className="font-semibold mb-2">WataFlow</h3>
                                        <p className="text-sm text-muted-foreground">Visual builder</p>
                                    </div>
                                    <div className="glass rounded-lg p-6 border border-slate-600/30/20">
                                        <FiInbox className="w-8 h-8 text-slate-400 mb-3" />
                                        <h3 className="font-semibold mb-2">OmniInbox</h3>
                                        <p className="text-sm text-muted-foreground">Unified messages</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Everything you need to <span className="gradient-text">engage customers</span>
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Powerful features that make customer engagement effortless
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="glass rounded-xl p-6 border border-border/40 hover:border-slate-600/30/40 transition-all hover:shadow-lg hover:shadow-slate-700/20/10"
                            >
                                <div className="w-12 h-12 rounded-lg bg-gradient-wata flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Simple, <span className="gradient-text">transparent pricing</span>
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Start free, scale as you grow
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className={`glass rounded-2xl p-8 border ${plan.featured
                                    ? 'border-slate-600/30 shadow-xl shadow-slate-700/20/20 scale-105'
                                    : 'border-border/40'
                                    }`}
                            >
                                {plan.featured && (
                                    <div className="inline-block px-3 py-1 rounded-full bg-gradient-wata text-white text-sm font-medium mb-4">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                                <p className="text-muted-foreground mb-6">{plan.description}</p>
                                <Button
                                    className="w-full mb-6"
                                    variant={plan.featured ? 'default' : 'outline'}
                                >
                                    {plan.cta}
                                </Button>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <FiCheck className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="glass rounded-2xl p-12 border border-slate-600/30/20 text-center"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            Ready to transform your <span className="gradient-text">customer engagement?</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            Join thousands of businesses using WataOmi to automate conversations
                        </p>
                        <Link href="/dashboard">
                            <Button size="lg" className="group">
                                Start Building for Free
                                <FiArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <MdAutoAwesome className="w-6 h-6 text-slate-400" />
                                <span className="text-xl font-bold gradient-text">WataOmi</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                One AI. Every Channel. Zero Code.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
                        © 2024 WataOmi. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}

const features = [
    {
        icon: FiMessageSquare,
        title: 'Omnichannel Messaging',
        description: 'Connect WhatsApp, Messenger, Instagram, Telegram, and more in one unified platform.',
    },
    {
        icon: FiZap,
        title: 'Zero-Code Flow Builder',
        description: 'Build complex conversation flows with our intuitive drag-and-drop WataFlow builder.',
    },
    {
        icon: MdAutoAwesome,
        title: 'AI-Powered Responses',
        description: 'Let AI handle customer queries intelligently with context-aware responses.',
    },
    {
        icon: FiGitMerge,
        title: 'n8n Integration',
        description: 'Seamlessly connect with n8n workflows for unlimited automation possibilities.',
    },
    {
        icon: FiBarChart2,
        title: 'Analytics & Insights',
        description: 'Track performance, measure engagement, and optimize your customer interactions.',
    },
    {
        icon: FiShield,
        title: 'Enterprise Security',
        description: 'Bank-level encryption and compliance with GDPR, SOC 2, and ISO standards.',
    },
]

const pricingPlans = [
    {
        name: 'Starter',
        price: 0,
        description: 'Perfect for trying out WataOmi',
        cta: 'Start Free',
        featured: false,
        features: [
            '1 bot',
            '100 conversations/month',
            '2 channels',
            'Basic analytics',
            'Community support',
        ],
    },
    {
        name: 'Pro',
        price: 49,
        description: 'For growing businesses',
        cta: 'Start Pro Trial',
        featured: true,
        features: [
            '10 bots',
            '10,000 conversations/month',
            'Unlimited channels',
            'Advanced analytics',
            'n8n integration',
            'Priority support',
            'Custom branding',
        ],
    },
    {
        name: 'Enterprise',
        price: 299,
        description: 'For large organizations',
        cta: 'Contact Sales',
        featured: false,
        features: [
            'Unlimited bots',
            'Unlimited conversations',
            'Unlimited channels',
            'Advanced AI features',
            'Dedicated account manager',
            'SLA guarantee',
            'Custom integrations',
            'On-premise deployment',
        ],
    },
]
