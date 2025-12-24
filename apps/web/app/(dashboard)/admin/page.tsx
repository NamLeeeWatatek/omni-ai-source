'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wrench, Sparkles, ArrowRight, LayoutGrid } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export default function AdminDashboardPage() {
    const router = useRouter();

    const adminSections = [
        {
            title: 'Creation Tools',
            description: 'Manage AI-powered creation tools and their configurations',
            icon: Wrench,
            href: '/admin/creation-tools/manage',
        },
        {
            title: 'Template Library',
            description: 'Configure reusable templates for your creation tools',
            icon: Sparkles,
            href: '/admin/templates/manage',
        },
    ];

    return (
        <PageShell
            title="Admin Dashboard"
            description="Manage your AI platform configuration"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl pt-4">
                {adminSections.map((section) => {
                    const Icon = section.icon;

                    return (
                        <Card
                            key={section.title}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/60 hover:border-primary/20 hover:-translate-y-0.5"
                            onClick={() => router.push(section.href as any)}
                        >
                            <CardHeader className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 transition-all group-hover:bg-primary/20">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>

                                <div className="space-y-2">
                                    <CardTitle className="text-xl">
                                        {section.title}
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        {section.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between group-hover:bg-accent/50 group-hover:text-primary pl-0 hover:pl-2 transition-all"
                                >
                                    <span className="font-medium">
                                        Manage
                                    </span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </PageShell>
    );
}
