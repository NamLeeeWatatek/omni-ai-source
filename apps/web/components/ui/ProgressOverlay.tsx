import { useProgressOverlay } from '@/lib/hooks/useProgressOverlay'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Progress } from '@/components/ui/Progress'
import { Spinner } from '@/components/ui/Spinner'
import { FiCheckCircle, FiLoader } from 'react-icons/fi'

export function ProgressOverlay() {
    const {
        open,
        title,
        description,
        steps,
        currentStep,
        progress,
        cancelProgress
    } = useProgressOverlay()

    const animatedProgress = progress !== undefined
        ? progress
        : steps.length > 0
            ? ((currentStep + 1) / steps.length) * 100
            : 0

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="max-w-md">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <FiLoader className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Progress value={animatedProgress} className="w-full" />
                        <p className="text-xs text-center text-muted-foreground">
                            {Math.round(animatedProgress)}% complete
                        </p>
                    </div>

                    {/* Current Step */}
                    {steps.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Current step:</p>
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                <Spinner className="w-4 h-4" />
                                <span className="text-sm">{steps[currentStep] || steps[steps.length - 1]}</span>
                            </div>
                        </div>
                    )}

                    {/* Steps List */}
                    {steps.length > 1 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                    {index < currentStep ? (
                                        <FiCheckCircle className="w-3 h-3 text-green-500" />
                                    ) : index === currentStep ? (
                                        <Spinner className="w-3 h-3" />
                                    ) : (
                                        <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                                    )}
                                    <span className={index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cancel Button */}
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={cancelProgress}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            Cancel operation
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Re-export functions from hook for convenience
export {
    showProgressOverlay,
    hideProgressOverlay,
    updateProgressOverlay,
    completeProgressOverlay,
    failProgressOverlay
} from '@/lib/hooks/useProgressOverlay'
