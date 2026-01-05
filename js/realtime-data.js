/**
 * REAL-TIME DATA INTEGRATION MODULE - FIXED VERSION
 * Prioritizes Yahoo Finance (free, no auth) with Polygon fallback
 */

const RealTimeData = {
    // API Configuration
    apis: {
        yahoo: {
            enabled: true, // FREE - No API key needed
            baseUrl: 'https://query1.finance.yahoo.com'
        },
        polygon: {
            enabled: true,
            apiKey: 'ff_73grG5wCUkN1IaYC0jv94GTf_36fq',
            baseUrl: 'https://api.polygon.io'
        },
        tradier: {
            enabled: false,
            apiKey: '',
            sandbox: true,
            baseUrl: 'https://sandbox.tradier.com/v1'
        }
    },
    
    // AGGRESSIVE CACHING - Cache data for 60 seconds (avoid rate limits)
    cache: {},
    cacheTimeout: 60 * 1000, // 1 minute for stock prices
    
    // RATE LIMITING
    rateLimiter: {
        calls: [],
        maxCallsPerMinute: 5,
        lastWarning: 0
    },
    
    /**
     * Check if we're hitting rate limits
     */
    checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        this.rateLimiter.calls = this.rateLimiter.calls.filter(time => time > oneMinuteAgo);
        
        if (this.rateLimiter.calls.length >= this.rateLimiter.maxCallsPerMinute) {
            if (now - this.rateLimiter.lastWarning > 60000) {
                console.warn('⚠️ API Rate limit reached. Using cached data for next 60 seconds.');
                this.rateLimiter.lastWarning = now;
            }
            return false;
        }
        
        return true;
    },
    
    /**
     * Record an API call
     */
    recordAPICall() {
        this.rateLimiter.calls.push(Date.now());
    },
    
    /**
     * Get cached data if available and fresh
     */
    getCached(key) {
        const cached = this.cache[key];
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log(`📦 Using cached data for ${key} (${Math.round((Date.now() - cached.timestamp) / 1000)}s old)`);
            return cached.data;
        }
        return null;
    },
    
    /**
     * Store data in cache
     */
    setCache(key, data) {
        this.cache[key] = {
            data: data,
            timestamp: Date.now()
        };
    },
    
    /**
     * Fetch real-time stock price - Yahoo Finance First (FREE)
     */
    async getStockPrice(symbol) {
        const cacheKey = `price_${symbol}`;
        
        // 1. Try cache first
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        
        // 2. Try Yahoo Finance FIRST (free, no rate limit)
        if (this.apis.yahoo.enabled) {
            try {
                const response = await fetch(
                    `${this.apis.yahoo.baseUrl}/v8/finance/chart/${symbol}?interval=1d&range=1d`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.chart && data.chart.result && data.chart.result[0]) {
                        const result = data.chart.result[0];
                        const meta = result.meta;
                        const quote = result.indicators.quote[0];
                        
                        const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1];
                        const previousClose = meta.previousClose || meta.chartPreviousClose;
                        
                        const priceData = {
                            price: currentPrice,
                            open: quote.open[0] || meta.regularMarketPrice,
                            high: quote.high[0] || currentPrice,
                            low: quote.low[0] || currentPrice,
                            close: currentPrice,
                            change: currentPrice - previousClose,
                            changePercent: ((currentPrice - previousClose) / previousClose) * 100,
                            volume: meta.regularMarketVolume || 0,
                            timestamp: Date.now(),
                            source: 'yahoo'
                        };
                        
                        this.setCache(cacheKey, priceData);
                        console.log(`Yahoo: Got ${symbol} price: $${currentPrice.toFixed(2)} (source: yahoo)`);
                        return priceData;
                    }
                }
            } catch (error) {
                console.log(`Yahoo Finance failed for ${symbol}:`, error.message);
            }
        }
        
        // 3. Try Polygon as fallback (if rate limit allows)
        if (this.apis.polygon.enabled && this.checkRateLimit()) {
            try {
                this.recordAPICall();
                const response = await fetch(
                    `${this.apis.polygon.baseUrl}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${this.apis.polygon.apiKey}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.results && data.results[0]) {
                        const result = data.results[0];
                        const priceData = {
                            price: result.c,
                            open: result.o,
                            high: result.h,
                            low: result.l,
                            close: result.c,
                            change: result.c - result.o,
                            changePercent: ((result.c - result.o) / result.o) * 100,
                            volume: result.v,
                            timestamp: Date.now(),
                            source: 'polygon'
                        };
                        this.setCache(cacheKey, priceData);
                        console.log(`Polygon: Got ${symbol} price: $${result.c.toFixed(2)} (source: polygon)`);
                        return priceData;
                    }
                }
            } catch (error) {
                console.log(`Polygon failed for ${symbol}:`, error.message);
            }
        }
        
        // 4. Fallback to simulated data
        console.warn(`⚠️ Using simulated data for ${symbol}`);
        return this.generateSimulatedPrice(symbol);
    },
    
    /**
     * Fetch real options chain (simulated for now)
     */
    async getOptionsChain(symbol) {
        const cacheKey = `options_${symbol}`;
        
        // Try cache first
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        
        // For now, return simulated options chain
        // (Polygon and Tradier options require paid tiers)
        const stockPrice = await this.getStockPrice(symbol);
        const optionsData = {
            options: OptionsData.generateOptionsChain(symbol, stockPrice.price),
            source: 'simulated',
            timestamp: Date.now(),
            warning: '⚠️ Options chain data is simulated. Upgrade to paid API tier for real options data.'
        };
        
        this.setCache(cacheKey, optionsData);
        return optionsData;
    },
    
    /**
     * Generate simulated price data
     */
    generateSimulatedPrice(symbol) {
        const basePrice = {
            'AAPL': 180,
            'TSLA': 250,
            'NVDA': 500,
            'SPY': 450,
            'QQQ': 380,
            'MSFT': 380,
            'AMZN': 150,
            'META': 350,
            'GOOGL': 140
        }[symbol] || 100;
        
        const randomChange = (Math.random() - 0.5) * 10;
        const price = basePrice + randomChange;
        
        return {
            price: price,
            open: price - 2,
            high: price + 3,
            low: price - 3,
            close: price,
            change: randomChange,
            changePercent: (randomChange / basePrice) * 100,
            volume: Math.floor(Math.random() * 10000000),
            timestamp: Date.now(),
            source: 'simulated',
            warning: '⚠️ Using simulated data. Configure API keys for real data.'
        };
    },
    
    /**
     * Configure API
     */
    configureAPI(apiName, apiKey, options = {}) {
        if (this.apis[apiName]) {
            this.apis[apiName].apiKey = apiKey;
            this.apis[apiName].enabled = true;
            Object.assign(this.apis[apiName], options);
            console.log(`✅ ${apiName} API configured`);
            return true;
        }
        return false;
    },
    
    /**
     * Test API connection
     */
    async testConnection(apiName) {
        try {
            const testResult = await this.getStockPrice('AAPL');
            if (testResult.source === apiName) {
                console.log(`✅ ${apiName} connection successful!`, testResult);
                return true;
            } else {
                console.log(`⚠️ ${apiName} not used. Data from ${testResult.source}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ ${apiName} connection failed:`, error);
            return false;
        }
    },
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache = {};
        console.log('🗑️ Cache cleared');
    },
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const keys = Object.keys(this.cache);
        const stats = {
            totalItems: keys.length,
            items: keys.map(key => ({
                key,
                age: Math.round((Date.now() - this.cache[key].timestamp) / 1000) + 's'
            })),
            rateLimitCalls: this.rateLimiter.calls.length,
            rateLimitRemaining: this.rateLimiter.maxCallsPerMinute - this.rateLimiter.calls.length
        };
        if (stats.items.length > 0) {
            console.table(stats.items);
        }
        console.log(`Rate Limit: ${stats.rateLimitCalls}/${this.rateLimiter.maxCallsPerMinute} calls used, ${stats.rateLimitRemaining} remaining`);
        return stats;
    }
};

// Auto-test on load
console.log('🚀 RealTime Data Module Loaded');
console.log('✅ Yahoo Finance: ENABLED (free, no API key needed)');
if (RealTimeData.apis.polygon.enabled) {
    console.log('✅ Polygon API: ENABLED (fallback)');
}
console.log('📊 Cache timeout:', RealTimeData.cacheTimeout / 1000, 'seconds');
console.log('⏱️ Rate limit:', RealTimeData.rateLimiter.maxCallsPerMinute, 'calls/minute');

// Test connection automatically
RealTimeData.getStockPrice('AAPL').then(data => {
    if (data.source === 'yahoo' || data.source === 'polygon') {
        console.log(`✅ Real-time data is working! Source: ${data.source}`);
        console.log(`📈 AAPL: $${data.price.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`);
    } else {
        console.warn('⚠️ Using simulated data - real APIs unavailable');
    }
});

// Export
window.RealTimeData = RealTimeData;
