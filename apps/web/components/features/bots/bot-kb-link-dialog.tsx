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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const linkKBSchema = z.object({
    knowledgeBaseId: z.string().min(1, 'Please select a knowledge base'),
    priority: z.number().min(1).max(100),
})

interface BotKBLinkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBases: Array<{ id: string; name: string }>
    onSubmit: (data: z.infer<typeof linkKBSchema>) => Promise<void>
}

export function BotKBLinkDialog({ 
    open, 
    onOpenChange, 
    knowledgeBases,
    onSubmit 
}: BotKBLinkDialogProps) {
    const form = useForm<z.infer<typeof linkKBSchema>>({
        resolver: zodResolver(linkKBSchema),
        defaultValues: {
            knowledgeBaseId: '',
            priority: 1,
        },
    })

    const handleSubmit = async (values: z.infer<typeof linkKBSchema>) => {
        try {
            await onSubmit(values)
            form.reset()
            onOpenChange(false)
        } catch (error) {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link Knowledge Base</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="knowledgeBaseId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Knowledge Base</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a knowledge base" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {knowledgeBases.map((kb) => (
                                                <SelectItem key={kb.id} value={kb.id}>
                                                    {kb.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            min={1}
                                            max={100}
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Higher priority knowledge bases are queried first (1-100)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                                Link
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
