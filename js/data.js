/**
 * OPTIONS DATA API LAYER
 * Integrates with multiple data sources for options chains, market data, and analysis
 */

// Popular stocks available on Robinhood for options trading
const ROBINHOOD_STOCKS = [
    // Tech Giants
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'NFLX',
    // Financial
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'PYPL', 'SQ',
    // Healthcare
    'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'CVS', 'MRNA', 'LLY',
    // Consumer
    'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'DIS', 'COST', 'TGT',
    // Energy
    'XOM', 'CVX', 'COP', 'SLB', 'OXY',
    // Industrials
    'BA', 'CAT', 'GE', 'MMM', 'UPS', 'HON',
    // Communication
    'T', 'VZ', 'CMCSA', 'TMUS',
    // Meme Stocks & High Volatility
    'GME', 'AMC', 'BB', 'PLTR', 'COIN', 'RIVN', 'LCID',
    // ETFs
    'SPY', 'QQQ', 'IWM', 'DIA', 'TLT', 'GLD', 'SLV', 'USO', 'XLF', 'XLE'
];

// Data cache
const dataCache = {
    optionsChains: {},
    stockPrices: {},
    volatility: {},
    earnings: {},
    lastUpdate: {}
};

/**
 * Get stock price from multiple APIs with fallback
 */
async function getStockPrice(symbol) {
    // Check cache (valid for 1 minute)
    if (dataCache.stockPrices[symbol] && 
        Date.now() - dataCache.lastUpdate[symbol] < 60000) {
        return dataCache.stockPrices[symbol];
    }

    // Use simulated data (in production, integrate real APIs)
    const price = generateSimulatedPrice(symbol);
    dataCache.stockPrices[symbol] = price;
    dataCache.lastUpdate[symbol] = Date.now();
    return price;
}

/**
 * Generate simulated options chain for a stock
 * In production, this would call real options data APIs
 */
function generateOptionsChain(symbol, stockPrice) {
    const chain = [];
    const expirations = getExpirationDates();
    
    // Generate strikes around current price
    const strikeIncrement = getStrikeIncrement(stockPrice);
    const strikeCount = 20; // 10 above, 10 below
    
    for (let expiration of expirations) {
        const dte = Math.floor((expiration.date - Date.now()) / (1000 * 60 * 60 * 24));
        
        for (let i = -strikeCount/2; i < strikeCount/2; i++) {
            const strike = Math.round((stockPrice + (i * strikeIncrement)) / strikeIncrement) * strikeIncrement;
            
            // Calculate option metrics
            const callOption = generateOptionData(symbol, strike, 'call', expiration, stockPrice, dte);
            const putOption = generateOptionData(symbol, strike, 'put', expiration, stockPrice, dte);
            
            chain.push(callOption);
            chain.push(putOption);
        }
    }
    
    return chain;
}

/**
 * Generate individual option data
 */
function generateOptionData(symbol, strike, type, expiration, stockPrice, dte) {
    const isCall = type === 'call';
    const moneyness = isCall ? stockPrice / strike : strike / stockPrice;
    
    // Calculate IV based on moneyness and DTE
    const baseIV = 0.30 + (Math.random() * 0.30); // 30-60%
    const ivSkew = !isCall ? 0.05 : -0.02; // Put skew
    const iv = baseIV + ivSkew;
    
    // Calculate Greeks using Black-Scholes approximations
    const greeks = calculateGreeks(stockPrice, strike, dte, iv, 0.05, type);
    
    // Calculate option price
    const intrinsicValue = isCall ? 
        Math.max(0, stockPrice - strike) : 
        Math.max(0, strike - stockPrice);
    const timeValue = calculateTimeValue(stockPrice, strike, dte, iv);
    const optionPrice = intrinsicValue + timeValue;
    
    // Generate volume and open interest
    const volume = generateVolume(moneyness, dte, iv);
    const openInterest = Math.floor(volume * (2 + Math.random() * 3));
    
    // Calculate bid/ask spread
    const spread = optionPrice * 0.02; // 2% spread
    const bid = optionPrice - spread/2;
    const ask = optionPrice + spread/2;
    
    return {
        symbol,
        strike,
        type,
        expiration: expiration.date,
        expirationString: expiration.string,
        dte,
        bid: parseFloat(bid.toFixed(2)),
        ask: parseFloat(ask.toFixed(2)),
        last: optionPrice,
        iv: parseFloat((iv * 100).toFixed(1)),
        volume,
        openInterest,
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.theta,
        vega: greeks.vega,
        intrinsicValue,
        timeValue,
        moneyness: moneyness.toFixed(3)
    };
}

/**
 * Calculate Greeks using Black-Scholes model
 */
function calculateGreeks(S, K, t, sigma, r, type) {
    t = t / 365; // Convert days to years
    if (t <= 0) t = 0.001;
    
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);
    
    // Normal CDF approximation
    const N = (x) => {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - p : p;
    };
    
    const isCall = type === 'call';
    
    // Delta
    let delta = isCall ? N(d1) : N(d1) - 1;
    
    // Gamma (same for calls and puts)
    const gamma = Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * t));
    
    // Theta
    const theta1 = -(S * Math.exp(-d1 * d1 / 2) * sigma) / (2 * Math.sqrt(2 * Math.PI * t));
    const theta2 = isCall ? 
        -r * K * Math.exp(-r * t) * N(d2) :
        r * K * Math.exp(-r * t) * N(-d2);
    const theta = (theta1 + theta2) / 365; // Per day
    
    // Vega (same for calls and puts)
    const vega = S * Math.sqrt(t) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100; // Per 1% change
    
    return {
        delta: parseFloat(delta.toFixed(3)),
        gamma: parseFloat(gamma.toFixed(4)),
        theta: parseFloat(theta.toFixed(2)),
        vega: parseFloat(vega.toFixed(2))
    };
}

/**
 * Calculate time value of option
 */
function calculateTimeValue(S, K, dte, sigma) {
    const t = dte / 365;
    const d1 = (Math.log(S / K) + (0.05 + sigma * sigma / 2) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);
    
    const N = (x) => {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - p : p;
    };
    
    const timeValue = S * N(d1) * (1 - Math.exp(-0.05 * t)) * sigma * Math.sqrt(t);
    return Math.max(0, timeValue);
}

/**
 * Generate realistic volume based on option characteristics
 */
function generateVolume(moneyness, dte, iv) {
    let baseVolume = 100;
    
    // ATM options have higher volume
    if (moneyness > 0.95 && moneyness < 1.05) {
        baseVolume *= 5;
    } else if (moneyness > 0.90 && moneyness < 1.10) {
        baseVolume *= 3;
    }
    
    // Near-term expirations have higher volume
    if (dte < 7) {
        baseVolume *= 4;
    } else if (dte < 30) {
        baseVolume *= 2;
    }
    
    // High IV stocks have higher volume
    if (iv > 0.50) {
        baseVolume *= 2;
    }
    
    // Add randomness
    const volume = Math.floor(baseVolume * (0.5 + Math.random() * 2));
    
    // Occasionally create "unusual activity"
    if (Math.random() < 0.05) {
        return volume * (5 + Math.random() * 20); // 5-25x normal volume
    }
    
    return volume;
}

/**
 * Get option expiration dates
 */
function getExpirationDates() {
    const expirations = [];
    const today = new Date();
    
    // Weekly expirations (next 4 weeks)
    for (let i = 0; i < 4; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + (5 - date.getDay() + 7 * i)); // Next Friday
        expirations.push({
            date: date.getTime(),
            string: formatDate(date),
            type: 'weekly'
        });
    }
    
    // Monthly expirations (next 6 months)
    for (let i = 1; i <= 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        // Third Friday of month
        date.setDate(1);
        while (date.getDay() !== 5) {
            date.setDate(date.getDate() + 1);
        }
        date.setDate(date.getDate() + 14); // Third Friday
        
        expirations.push({
            date: date.getTime(),
            string: formatDate(date),
            type: 'monthly'
        });
    }
    
    return expirations.sort((a, b) => a.date - b.date);
}

/**
 * Format date as MM/DD/YYYY
 */
function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * Get strike increment based on stock price
 */
function getStrikeIncrement(price) {
    if (price < 10) return 0.5;
    if (price < 25) return 1;
    if (price < 100) return 2.5;
    if (price < 200) return 5;
    return 10;
}

/**
 * Generate simulated stock price
 */
function generateSimulatedPrice(symbol) {
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 50 + (hash % 450); // $50-$500
    const volatility = Math.sin(hash) * 5; // Daily movement
    return parseFloat((basePrice + volatility).toFixed(2));
}

/**
 * Get earnings calendar
 */
function getEarningsCalendar() {
    // In production, this would call an earnings API
    const today = new Date();
    const earningsStocks = [
        { symbol: 'AAPL', date: addDays(today, 3), time: 'AMC' },
        { symbol: 'TSLA', date: addDays(today, 5), time: 'AMC' },
        { symbol: 'NVDA', date: addDays(today, 7), time: 'AMC' },
        { symbol: 'AMZN', date: addDays(today, 10), time: 'AMC' },
        { symbol: 'GOOGL', date: addDays(today, 12), time: 'AMC' },
    ];
    
    return earningsStocks;
}

/**
 * Add days to date
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get market hours and status
 */
function getMarketStatus() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;
    
    // Weekend
    if (day === 0 || day === 6) {
        return { isOpen: false, status: 'Market Closed - Weekend' };
    }
    
    // Market hours: 9:30 AM - 4:00 PM ET
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    
    if (currentTime >= marketOpen && currentTime < marketClose) {
        return { isOpen: true, status: 'Market Open' };
    } else if (currentTime < marketOpen) {
        return { isOpen: false, status: 'Pre-Market' };
    } else {
        return { isOpen: false, status: 'After Hours' };
    }
}

/**
 * Calculate IV Rank (0-100)
 */
function calculateIVRank(currentIV, symbol) {
    // In production, would use 52-week IV high/low
    // For now, simulate based on typical ranges
    const ivLow = 15;
    const ivHigh = 80;
    const rank = ((currentIV - ivLow) / (ivHigh - ivLow)) * 100;
    return Math.max(0, Math.min(100, rank));
}

/**
 * Get VIX (volatility index) - market fear gauge
 */
async function getVIX() {
    try {
        // In production, fetch from API
        // For now, simulate (typically 10-30, spikes to 50+ during crashes)
        return 15 + Math.random() * 10;
    } catch (error) {
        return 20; // Average VIX
    }
}

/**
 * Export functions
 */
window.OptionsData = {
    ROBINHOOD_STOCKS,
    getStockPrice,
    generateOptionsChain,
    getExpirationDates,
    getEarningsCalendar,
    getMarketStatus,
    calculateIVRank,
    getVIX,
    dataCache
};
