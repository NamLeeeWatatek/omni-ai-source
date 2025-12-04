import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
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
import type { KnowledgeBase } from '@/lib/types/knowledge-base'

const collectionFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    isPublic: z.boolean(),
})

interface KBCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBase?: KnowledgeBase | null
    onSubmit: (data: {
        name: string
        description: string
        color: string
        isPublic: boolean
    }) => Promise<void>
}

export function KBCollectionDialog({ 
    open, 
    onOpenChange, 
    knowledgeBase,
    onSubmit 
}: KBCollectionDialogProps) {
    const form = useForm<z.infer<typeof collectionFormSchema>>({
        resolver: zodResolver(collectionFormSchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#3B82F6',
            isPublic: false,
        },
    })

    useEffect(() => {
        if (knowledgeBase && open) {
            form.reset({
                name: knowledgeBase.name,
                description: knowledgeBase.description || '',
                color: knowledgeBase.color || '#3B82F6',
                isPublic: knowledgeBase.isPublic || false,
            })
        } else if (!open) {
            form.reset({
                name: '',
                description: '',
                color: '#3B82F6',
                isPublic: false,
            })
        }
    }, [knowledgeBase, open, form])

    const handleSubmit = async (values: z.infer<typeof collectionFormSchema>) => {
        try {
            await onSubmit({
                ...values,
                description: values.description || '',
            })
            form.reset()
            onOpenChange(false)
        } catch (error) {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {knowledgeBase ? 'Edit Collection' : 'Create New Collection'}
                    </DialogTitle>
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
                                        <Input placeholder="Product Documentation" {...field} />
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
                                            placeholder="All product docs and guides..." 
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
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    type="color"
                                                    {...field}
                                                    className="w-20 h-10"
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="#3B82F6"
                                                    className="flex-1"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isPublic"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-end">
                                        <FormLabel>Visibility</FormLabel>
                                        <div className="flex items-center gap-2 h-10">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription className="!mt-0">
                                                Public (accessible by all bots)
                                            </FormDescription>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Spinner className="w-4 h-4 mr-2" />
                                        {knowledgeBase ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    knowledgeBase ? 'Update' : 'Create'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
