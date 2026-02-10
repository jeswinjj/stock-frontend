'use client';
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface PortfolioBarChartProps {
    invested: number;
    currentValue: number;
}

export const PortfolioBarChart = ({ invested, currentValue }: PortfolioBarChartProps) => {
    const { hideBalance } = useAuth();
    const isProfit = currentValue >= invested;
    const profitAmount = Math.max(0, currentValue - invested);
    const lossAmount = Math.max(0, invested - currentValue);
    const remainingInvested = isProfit ? invested : currentValue;

    // Total width representation
    const total = Math.max(invested, currentValue);
    const investedWidth = (remainingInvested / total) * 100;
    const profitWidth = (profitAmount / total) * 100;
    const lossWidth = (lossAmount / total) * 100;

    const maskValue = (val: number) => hideBalance ? "₹ XXXXX" : formatCurrency(val);

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                <span>Portfolio Composition</span>
                <span>{maskValue(currentValue)}</span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${investedWidth}%` }}
                    title={hideBalance ? "Invested Amount Hidden" : `Invested: ${formatCurrency(remainingInvested)}`}
                />
                {isProfit && (
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${profitWidth}%` }}
                        title={hideBalance ? "Profit Amount Hidden" : `Profit: ${formatCurrency(profitAmount)}`}
                    />
                )}
                {!isProfit && (
                    <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${lossWidth}%` }}
                        title={hideBalance ? "Loss Amount Hidden" : `Loss: ${formatCurrency(lossAmount)}`}
                    />
                )}
            </div>
            <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                    <span>Invested ({maskValue(invested)})</span>
                </div>
                {isProfit ? (
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 bg-green-500 rounded-sm" />
                        <span>Profit ({maskValue(profitAmount)})</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 bg-red-500 rounded-sm" />
                        <span>Loss ({maskValue(lossAmount)})</span>
                    </div>
                )}
            </div>
        </div>
    );
};
