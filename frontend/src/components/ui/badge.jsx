import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-white text-gray-900 shadow hover:bg-gray-100",
                secondary:
                    "border-transparent bg-gray-800 text-gray-100 hover:bg-gray-700",
                destructive:
                    "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
                outline: "text-gray-100 border-gray-700",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
