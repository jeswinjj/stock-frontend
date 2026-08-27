import api from '@/services/api';

/**
 * TradingView Datafeed API Abstraction
 * Implements IBasicDataFeed interfacing with our Node/Express backend /api/market-data/ endpoints.
 */

export interface Bar {
    time: number; // Unix timestamp in milliseconds or seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface SymbolInfo {
    name: string;
    ticker: string;
    description: string;
    type: string;
    session: string;
    timezone: string;
    exchange: string;
    minmov: number;
    pricescale: number;
    has_intraday: boolean;
    has_daily: boolean;
    has_weekly_and_monthly: boolean;
    supported_resolutions: string[];
    volume_precision: number;
    data_status: string;
}

const configurationData = {
    supported_resolutions: ['1D', '1W', '1M', '5m', '15m', '60m'],
    exchanges: [
        {
            value: 'NSE',
            name: 'National Stock Exchange of India',
            desc: 'NSE India'
        }
    ],
    symbols_types: [
        {
            name: 'equity',
            value: 'equity'
        }
    ]
};

class Datafeed {
    private subscriptions: Map<string, NodeJS.Timeout> = new Map();

    onReady(callback: (config: typeof configurationData) => void) {
        setTimeout(() => callback(configurationData), 0);
    }

    async searchSymbols(
        userInput: string,
        exchange: string,
        symbolType: string,
        onResultReadyCallback: (result: any[]) => void
    ) {
        try {
            const res = await api.get(`/stocks/search?q=${encodeURIComponent(userInput)}`);
            const results = res.data.map((item: any) => ({
                symbol: item.symbol,
                full_name: item.symbol,
                description: item.name,
                exchange: 'NSE',
                type: 'equity'
            }));
            onResultReadyCallback(results);
        } catch (err) {
            console.error('Datafeed searchSymbols error:', err);
            onResultReadyCallback([]);
        }
    }

    async resolveSymbol(
        symbolName: string,
        onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void,
        onResolveErrorCallback: (reason: string) => void
    ) {
        try {
            const cleanSymbol = symbolName.trim().toUpperCase();
            
            const symbolInfo: SymbolInfo = {
                name: cleanSymbol,
                ticker: cleanSymbol,
                description: cleanSymbol,
                type: 'equity',
                session: '0915-1530',
                timezone: 'Asia/Kolkata',
                exchange: 'NSE',
                minmov: 1,
                pricescale: 100, // 2 decimal places
                has_intraday: true,
                has_daily: true,
                has_weekly_and_monthly: true,
                supported_resolutions: configurationData.supported_resolutions,
                volume_precision: 0,
                data_status: 'streaming'
            };

            setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
        } catch (err: any) {
            onResolveErrorCallback('Symbol not found');
        }
    }

    async getBars(
        symbolInfo: SymbolInfo,
        resolution: string,
        periodParams: { from: number; to: number; firstDataRequest: boolean },
        onHistoryCallback: (bars: Bar[], meta: { noData: boolean }) => void,
        onErrorCallback: (error: string) => void
    ) {
        const { from, to, firstDataRequest } = periodParams;

        try {
            const res = await api.get(`/market-data/${symbolInfo.name}/history`, {
                params: {
                    resolution,
                    from,
                    to
                }
            });

            const bars: Bar[] = res.data.bars || [];

            if (bars.length === 0) {
                onHistoryCallback([], { noData: true });
                return;
            }

            onHistoryCallback(bars, { noData: false });
        } catch (err: any) {
            console.error('Datafeed getBars error:', err);
            onErrorCallback(err.message || 'Failed to fetch historical bars');
        }
    }

    subscribeBars(
        symbolInfo: SymbolInfo,
        resolution: string,
        onRealtimeCallback: (bar: Bar) => void,
        subscriberUID: string,
        onResetCacheNeededCallback: () => void
    ) {
        // Controlled 15s polling for live last bar update
        if (this.subscriptions.has(subscriberUID)) {
            clearInterval(this.subscriptions.get(subscriberUID)!);
        }

        const timer = setInterval(async () => {
            try {
                const res = await api.get(`/market-data/${symbolInfo.name}/history`, {
                    params: { resolution }
                });
                const bars: Bar[] = res.data.bars || [];
                if (bars.length > 0) {
                    const latestBar = bars[bars.length - 1];
                    onRealtimeCallback(latestBar);
                }
            } catch (err) {
                // Silent error swallow for live updates
            }
        }, 15000);

        this.subscriptions.set(subscriberUID, timer);
    }

    unsubscribeBars(subscriberUID: string) {
        if (this.subscriptions.has(subscriberUID)) {
            clearInterval(this.subscriptions.get(subscriberUID)!);
            this.subscriptions.delete(subscriberUID);
        }
    }
}

export const createDatafeed = () => new Datafeed();
