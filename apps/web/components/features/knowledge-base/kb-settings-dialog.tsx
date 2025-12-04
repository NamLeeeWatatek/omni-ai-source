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
import type { KnowledgeBase } from '@/lib/types/knowledge-base'

const settingsFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    embeddingModel: z.string().min(1, 'Embedding model is required'),
    chunkSize: z.number().min(100, 'Chunk size must be at least 100').max(10000),
    chunkOverlap: z.number().min(0).max(1000),
})

interface KBSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBase: KnowledgeBase | null
    onSave: (data: {
        name: string
        description: string
        embeddingModel: string
        chunkSize: number
        chunkOverlap: number
    }) => Promise<void>
}

export function KBSettingsDialog({ open, onOpenChange, knowledgeBase, onSave }: KBSettingsDialogProps) {
    const form = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            name: '',
            description: '',
            embeddingModel: 'text-embedding-004',
            chunkSize: 1000,
            chunkOverlap: 200,
        },
    })

    useEffect(() => {
        if (knowledgeBase && open) {
            form.reset({
                name: knowledgeBase.name,
                description: knowledgeBase.description || '',
                embeddingModel: knowledgeBase.embeddingModel,
                chunkSize: knowledgeBase.chunkSize,
                chunkOverlap: knowledgeBase.chunkOverlap,
            })
        }
    }, [knowledgeBase, open, form])

    const handleSubmit = async (values: z.infer<typeof settingsFormSchema>) => {
        try {
            await onSave({
                ...values,
                description: values.description || '',
            })
            onOpenChange(false)
        } catch (error) {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Knowledge Base Settings</DialogTitle>
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
                                        <Input {...field} />
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
                                        <Textarea rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="embeddingModel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Embedding Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="text-embedding-004" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Model used for generating embeddings
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="chunkSize"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chunk Size</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="chunkOverlap"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chunk Overlap</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 200)}
                                            />
                                        </FormControl>
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
                                {form.formState.isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
