import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCompactCurrency(value: number) {
    if (value === null || value === undefined) return '';
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    let formatted: string;
    let suffix = '';
    if (abs >= 1e12) {
        formatted = (abs / 1e12).toFixed(2);
        suffix = 'T';
    } else if (abs >= 1e9) {
        formatted = (abs / 1e9).toFixed(2);
        suffix = 'B';
    } else if (abs >= 1e6) {
        formatted = (abs / 1e6).toFixed(2);
        suffix = 'M';
    } else {
        return formatCurrency(value);
    }
    // Remove trailing .00 or .0
    formatted = Number(formatted).toString();
    return `${sign}₹${formatted}${suffix}`;
}

export function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatPercentage(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
