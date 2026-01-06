/**
 * REAL-TIME DATA INTEGRATION MODULE
 * Connects to multiple options data APIs with aggressive caching and rate limiting
 */

const RealTimeData = {
    // API Configuration
    apis: {
        polygon: {
            enabled: true, // Enable Massive.com API
            apiKey: 'i4uMiWTkCkQqeUwrFpUJpCwbOXfh5k4b', // Your Massive.com API key
            baseUrl: 'https://api.polygon.io'
        },
        tradier: {
            enabled: false,
            apiKey: '',
            sandbox: true,
            baseUrl: 'https://sandbox.tradier.com/v1'
        },
        tdameritrade: {
            enabled: false,
            apiKey: '',
            baseUrl: 'https://api.tdameritrade.com/v1'
        },
        yahoo: {
            enabled: true, // Free and working!
            baseUrl: 'https://query1.finance.yahoo.com'
        }
    },
    
    // AGGRESSIVE CACHING - Cache data for 5 minutes
    cache: {},
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    
    // RATE LIMITING - Track API calls to prevent exhaustion
    rateLimiter: {
        calls: [],
        maxCallsPerMinute: 5, // Free tier limit
        lastWarning: 0
    },
    
    /**
     * Check if we're hitting rate limits
     */
    checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove calls older than 1 minute
        this.rateLimiter.calls = this.rateLimiter.calls.filter(time => time > oneMinuteAgo);
        
        // Check if we're near the limit
        if (this.rateLimiter.calls.length >= this.rateLimiter.maxCallsPerMinute) {
            // Only show warning once per minute
            if (now - this.rateLimiter.lastWarning > 60000) {
                console.warn('⚠️ API Rate limit reached. Using cached data for next 60 seconds.');
                this.rateLimiter.lastWarning = now;
            }
            return false; // Don't allow more calls
        }
        
        return true; // OK to make call
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
     * Fetch real-time stock price (with caching and rate limiting)
     */
    async getStockPrice(symbol) {
        const cacheKey = `price_${symbol}`;
        
        // 1. Try cache first
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        
        // 2. Check rate limit
        if (!this.checkRateLimit()) {
            const cached = this.cache[cacheKey];
            if (cached) {
                return { ...cached.data, fromCache: true };
            }
            // No cache available, return simulated data
            return this.generateSimulatedPrice(symbol);
        }
        
        // 3. Try Polygon.io first (if enabled)
        if (this.apis.polygon.enabled) {
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
                            price: result.c, // close price
                            change: result.c - result.o, // close - open
                            changePercent: ((result.c - result.o) / result.o) * 100,
                            volume: result.v,
                            timestamp: Date.now(),
                            source: 'polygon'
                        };
                        this.setCache(cacheKey, priceData);
                        return priceData;
                    }
                }
            } catch (error) {
                console.log('Polygon failed:', error.message);
            }
        }
        
        // 4. Try Yahoo Finance (free, no limit)
        try {
            const response = await fetch(
                `${this.apis.yahoo.baseUrl}/v8/finance/chart/${symbol}?interval=1d&range=1d`,
                { mode: 'cors' }
            );
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const meta = data.chart.result[0].meta;
                const priceData = {
                    price: meta.regularMarketPrice || meta.previousClose,
                    change: meta.regularMarketPrice - meta.previousClose,
                    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                    volume: meta.regularMarketVolume,
                    timestamp: Date.now(),
                    source: 'yahoo'
                };
                this.setCache(cacheKey, priceData);
                return priceData;
            }
        } catch (error) {
            console.log('Yahoo Finance failed:', error.message);
        }
        
        // 5. Try Tradier if configured
        if (this.apis.tradier.enabled) {
            try {
                this.recordAPICall();
                const url = `${this.apis.tradier.baseUrl}/markets/quotes?symbols=${symbol}`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.apis.tradier.apiKey}`,
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                
                if (data.quotes && data.quotes.quote) {
                    const quote = data.quotes.quote;
                    const priceData = {
                        price: quote.last,
                        change: quote.change,
                        changePercent: quote.change_percentage,
                        volume: quote.volume,
                        timestamp: Date.now(),
                        source: 'tradier'
                    };
                    this.setCache(cacheKey, priceData);
                    return priceData;
                }
            } catch (error) {
                console.log('Tradier failed:', error.message);
            }
        }
        
        // 6. Fallback to simulated data
        return this.generateSimulatedPrice(symbol);
    },
    
    /**
     * Fetch real options chain (with caching)
     */
    async getOptionsChain(symbol) {
        const cacheKey = `options_${symbol}`;
        
        // Try cache first (options data cached for 5 minutes)
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        
        // Check rate limit
        if (!this.checkRateLimit()) {
            const cached = this.cache[cacheKey];
            if (cached) {
                return { ...cached.data, fromCache: true };
            }
        }
        
        // Try Tradier if configured
        if (this.apis.tradier.enabled) {
            try {
                this.recordAPICall();
                // Get expiration dates
                const expUrl = `${this.apis.tradier.baseUrl}/markets/options/expirations?symbol=${symbol}`;
                const expResponse = await fetch(expUrl, {
                    headers: {
                        'Authorization': `Bearer ${this.apis.tradier.apiKey}`,
                        'Accept': 'application/json'
                    }
                });
                const expData = await expResponse.json();
                
                if (!expData.expirations || !expData.expirations.date) {
                    throw new Error('No expirations found');
                }
                
                const expirations = expData.expirations.date.slice(0, 6); // First 6 expirations
                const allOptions = [];
                
                // Fetch chain for each expiration
                for (const expiration of expirations) {
                    this.recordAPICall();
                    const chainUrl = `${this.apis.tradier.baseUrl}/markets/options/chains?symbol=${symbol}&expiration=${expiration}`;
                    const chainResponse = await fetch(chainUrl, {
                        headers: {
                            'Authorization': `Bearer ${this.apis.tradier.apiKey}`,
                            'Accept': 'application/json'
                        }
                    });
                    const chainData = await chainResponse.json();
                    
                    if (chainData.options && chainData.options.option) {
                        const options = Array.isArray(chainData.options.option) ? 
                            chainData.options.option : [chainData.options.option];
                        
                        for (const opt of options) {
                            allOptions.push({
                                symbol: opt.symbol,
                                underlying: opt.underlying,
                                strike: opt.strike,
                                type: opt.option_type,
                                expiration: new Date(opt.expiration_date).getTime(),
                                expirationString: opt.expiration_date,
                                dte: Math.floor((new Date(opt.expiration_date) - Date.now()) / (1000 * 60 * 60 * 24)),
                                bid: opt.bid,
                                ask: opt.ask,
                                last: opt.last,
                                volume: opt.volume,
                                openInterest: opt.open_interest,
                                iv: opt.greeks ? opt.greeks.mid_iv * 100 : 0,
                                delta: opt.greeks ? opt.greeks.delta : 0,
                                gamma: opt.greeks ? opt.greeks.gamma : 0,
                                theta: opt.greeks ? opt.greeks.theta : 0,
                                vega: opt.greeks ? opt.greeks.vega : 0
                            });
                        }
                    }
                }
                
                const optionsData = {
                    options: allOptions,
                    source: 'tradier',
                    timestamp: Date.now()
                };
                
                this.setCache(cacheKey, optionsData);
                return optionsData;
                
            } catch (error) {
                console.log('Tradier options failed:', error.message);
            }
        }
        
        // Fallback to simulated data
        const stockPrice = await this.getStockPrice(symbol);
        const optionsData = {
            options: OptionsData.generateOptionsChain(symbol, stockPrice.price),
            source: 'simulated',
            timestamp: Date.now(),
            warning: '⚠️ Using simulated data. Configure API keys for real-time options data.'
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
            change: randomChange,
            changePercent: (randomChange / basePrice) * 100,
            volume: Math.floor(Math.random() * 10000000),
            timestamp: Date.now(),
            source: 'simulated',
            warning: '⚠️ Using simulated data. Real APIs configured but rate limited or unavailable.'
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
        console.table(stats.items);
        console.log(`Rate Limit: ${stats.rateLimitCalls}/${this.rateLimiter.maxCallsPerMinute} calls used, ${stats.rateLimitRemaining} remaining`);
        return stats;
    }
};

// Auto-test on load
if (RealTimeData.apis.polygon.enabled) {
    console.log('🚀 Polygon API is enabled');
    console.log('📊 Cache timeout:', RealTimeData.cacheTimeout / 1000, 'seconds');
    console.log('⏱️ Rate limit:', RealTimeData.rateLimiter.maxCallsPerMinute, 'calls/minute');
}
