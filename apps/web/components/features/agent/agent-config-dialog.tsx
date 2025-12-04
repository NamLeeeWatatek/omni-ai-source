import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const agentConfigSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    systemPrompt: z.string().min(1, 'System prompt is required'),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1),
    model: z.string().optional(),
})

interface AgentConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    config?: any | null
    onSubmit: (data: z.infer<typeof agentConfigSchema>) => Promise<void>
}

export function AgentConfigDialog({ 
    open, 
    onOpenChange, 
    config,
    onSubmit 
}: AgentConfigDialogProps) {
    const form = useForm<z.infer<typeof agentConfigSchema>>({
        resolver: zodResolver(agentConfigSchema),
        defaultValues: {
            name: 'AI Assistant',
            description: '',
            systemPrompt: 'You are a helpful AI assistant.',
            temperature: 0.7,
            maxTokens: 2000,
            model: 'gpt-4',
        },
    })

    useEffect(() => {
        if (config && open) {
            form.reset({
                name: config.name || 'AI Assistant',
                description: config.description || '',
                systemPrompt: config.systemPrompt || 'You are a helpful AI assistant.',
                temperature: config.temperature ?? 0.7,
                maxTokens: config.maxTokens ?? 2000,
                model: config.model || 'gpt-4',
            })
        }
    }, [config, open, form])

    const handleSubmit = async (values: z.infer<typeof agentConfigSchema>) => {
        try {
            await onSubmit(values)
            onOpenChange(false)
        } catch (error) {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Agent Configuration</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="AI Assistant" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Agent description..." 
                                            rows={2}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="systemPrompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>System Prompt</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="You are a helpful AI assistant..." 
                                            rows={4}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Instructions for the AI agent
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="temperature"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temperature</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.1"
                                                min={0}
                                                max={2}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0.7)}
                                            />
                                        </FormControl>
                                        <FormDescription>0-2</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxTokens"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Tokens</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 2000)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="gpt-4" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
