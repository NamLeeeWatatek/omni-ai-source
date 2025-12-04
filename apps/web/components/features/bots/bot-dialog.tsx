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

const botFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    workspaceId: z.string(),
    defaultLanguage: z.string(),
    timezone: z.string(),
})

interface BotDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bot?: any | null
    workspaceId: string
    onSubmit: (data: z.infer<typeof botFormSchema>) => Promise<void>
}

export function BotDialog({ open, onOpenChange, bot, workspaceId, onSubmit }: BotDialogProps) {
    const form = useForm<z.infer<typeof botFormSchema>>({
        resolver: zodResolver(botFormSchema),
        defaultValues: {
            name: '',
            description: '',
            workspaceId,
            defaultLanguage: 'en',
            timezone: 'UTC',
        },
    })

    useEffect(() => {
        if (bot && open) {
            form.reset({
                name: bot.name,
                description: bot.description || '',
                workspaceId: bot.workspaceId || workspaceId,
                defaultLanguage: bot.defaultLanguage || 'en',
                timezone: bot.timezone || 'UTC',
            })
        } else if (!open) {
            form.reset({
                name: '',
                description: '',
                workspaceId,
                defaultLanguage: 'en',
                timezone: 'UTC',
            })
        }
    }, [bot, open, workspaceId, form])

    const handleSubmit = async (values: z.infer<typeof botFormSchema>) => {
        try {
            await onSubmit(values)
            form.reset()
            onOpenChange(false)
        } catch (error) {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{bot ? 'Edit Bot' : 'Create New Bot'}</DialogTitle>
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
                                        <Input placeholder="Customer Support Bot" {...field} />
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
                                            placeholder="Handles customer inquiries..." 
                                            rows={3}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="defaultLanguage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Language</FormLabel>
                                        <FormControl>
                                            <Input placeholder="en" {...field} />
                                        </FormControl>
                                        <FormDescription>Default: en</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Timezone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="UTC" {...field} />
                                        </FormControl>
                                        <FormDescription>Default: UTC</FormDescription>
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
                                {bot ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
