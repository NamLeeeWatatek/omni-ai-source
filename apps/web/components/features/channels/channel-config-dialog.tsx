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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const channelConfigSchema = z.object({
    provider: z.string().min(1, 'Provider is required'),
    name: z.string().min(1, 'Name is required'),
    pageId: z.string().optional(),
    pageAccessToken: z.string().optional(),
    verifyToken: z.string().optional(),
    appSecret: z.string().optional(),
    isActive: z.boolean(),
})

interface ChannelConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    channel?: any | null
    providers: Array<{ value: string; label: string }>
    onSubmit: (data: z.infer<typeof channelConfigSchema>) => Promise<void>
}

export function ChannelConfigDialog({ 
    open, 
    onOpenChange, 
    channel,
    providers,
    onSubmit 
}: ChannelConfigDialogProps) {
    const form = useForm<z.infer<typeof channelConfigSchema>>({
        resolver: zodResolver(channelConfigSchema),
        defaultValues: {
            provider: '',
            name: '',
            pageId: '',
            pageAccessToken: '',
            verifyToken: '',
            appSecret: '',
            isActive: true,
        },
    })

    useEffect(() => {
        if (channel && open) {
            form.reset({
                provider: channel.provider,
                name: channel.name,
                pageId: channel.config?.pageId || '',
                pageAccessToken: channel.config?.pageAccessToken || '',
                verifyToken: channel.config?.verifyToken || '',
                appSecret: channel.config?.appSecret || '',
                isActive: channel.isActive ?? true,
            })
        } else if (!open) {
            form.reset()
        }
    }, [channel, open, form])

    const handleSubmit = async (values: z.infer<typeof channelConfigSchema>) => {
        try {
            await onSubmit(values)
            form.reset()
            onOpenChange(false)
        } catch (error) {
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{channel ? 'Edit Channel' : 'Add Channel'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {providers.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="My Facebook Page" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pageId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Page ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123456789" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pageAccessToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Page Access Token</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="EAAxxxx..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="verifyToken"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verify Token</FormLabel>
                                        <FormControl>
                                            <Input placeholder="my_verify_token" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="appSecret"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>App Secret</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="abc123..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active</FormLabel>
                                        <FormDescription>
                                            Enable this channel to receive messages
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                                {channel ? 'Update' : 'Add'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
