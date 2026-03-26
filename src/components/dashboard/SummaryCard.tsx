import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SummaryCardProps {
    title: string;
    value: number;
    subValue?: string;
    isProfit?: boolean;
}

export const SummaryCard = ({ title, value, subValue, isProfit }: SummaryCardProps) => {
    const { hideBalance } = useAuth();

    return (
        <div className="bg-white dark:bg-slate-800 p-4 md:px-4 md:py-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md duration-300">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className="mt-2 flex flex-col items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {hideBalance ? "₹ XXXXX" : formatCurrency(value)}
                </h3>
                {subValue && (
                    <span className={cn(
                        "text-sm font-medium px-2 py-0.5 rounded-full",
                        isProfit
                            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                            : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                    )}>
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    );
};
