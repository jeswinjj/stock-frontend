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
        <div className="bg-white px-4 py-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">
                    {hideBalance ? "₹ XXXXX" : formatCurrency(value)}
                </h3>
                {subValue && (
                    <span className={cn("text-sm font-medium", isProfit ? "text-green-600" : "text-red-600")}>
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    );
};
