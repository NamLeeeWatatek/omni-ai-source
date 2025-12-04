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

const documentFormSchema = z.object({
    name: z.string().min(1, 'Document name is required'),
    content: z.string().min(1, 'Content is required'),
})

interface KBDocumentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: { name: string; content: string }) => Promise<void>
}

export function KBDocumentDialog({ open, onOpenChange, onSubmit }: KBDocumentDialogProps) {
    const form = useForm<z.infer<typeof documentFormSchema>>({
        resolver: zodResolver(documentFormSchema),
        defaultValues: {
            name: '',
            content: '',
        },
    })

    const handleSubmit = async (values: z.infer<typeof documentFormSchema>) => {
        try {
            await onSubmit(values)
            form.reset()
            onOpenChange(false)
        } catch {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Document</DialogTitle>
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
                                        <Input placeholder="Document name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Paste your document content here..." 
                                            rows={12}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The content will be processed and embedded for search
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                Create & Process
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
