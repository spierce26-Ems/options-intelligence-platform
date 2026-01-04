/**
 * REAL-TIME DATA INTEGRATION MODULE
 * Connects to multiple options data APIs
 */

const RealTimeData = {
    // API Configuration
    apis: {
        polygon: {
            enabled: true,
            apiKey: 'ff_73grG5wCUkN1IaYC0jv94GTf_36fq',
            baseUrl: 'https://api.polygon.io'
        },
        tradier: {
            enabled: false,
            apiKey: '', // Set your API key here when you get it
            sandbox: true,
            baseUrl: 'https://sandbox.tradier.com/v1'
        },
        tdameritrade: {
            enabled: false,
            apiKey: '', // Set your API key here
            baseUrl: 'https://api.tdameritrade.com/v1'
        },
        yahoo: {
            enabled: true, // Keep as fallback
            baseUrl: 'https://query1.finance.yahoo.com'
        }
    },
    
    // Simple cache for API responses
    cache: {},
    
    /**
     * Fetch real-time stock price
     */
    async getStockPrice(symbol) {
        // Check cache first (60 second cache)
        const cacheKey = `price_${symbol}`;
        const cached = this.cache[cacheKey];
        if (cached && Date.now() - cached.time < 60000) {
            return cached.data;
        }
        
        // Try Polygon first
        if (this.apis.polygon.enabled) {
            try {
                const url = `${this.apis.polygon.baseUrl}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${this.apis.polygon.apiKey}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.results && data.results[0]) {
                    const result = data.results[0];
                    const priceData = {
                        price: result.c, // close price
                        open: result.o,
                        high: result.h,
                        low: result.l,
                        change: result.c - result.o,
                        changePercent: ((result.c - result.o) / result.o) * 100,
                        volume: result.v,
                        timestamp: Date.now(),
                        source: 'polygon'
                    };
                    
                    // Cache it
                    this.cache[cacheKey] = {
                        data: priceData,
                        time: Date.now()
                    };
                    
                    console.log(`✅ Polygon: Got ${symbol} price: $${result.c}`);
                    return priceData;
                }
            } catch (error) {
                console.log('Polygon failed, trying Yahoo:', error.message);
            }
        }
        
        // Try Yahoo Finance as fallback
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
                
                // Cache it
                this.cache[cacheKey] = {
                    data: priceData,
                    time: Date.now()
                };
                
                console.log(`✅ Yahoo: Got ${symbol} price: $${priceData.price}`);
                return priceData;
            }
        } catch (error) {
            console.log('Yahoo Finance failed:', error.message);
        }
        
        // Try Tradier if configured
        if (this.apis.tradier.enabled) {
            try {
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
                    
                    // Cache it
                    this.cache[cacheKey] = {
                        data: priceData,
                        time: Date.now()
                    };
                    
                    return priceData;
                }
            } catch (error) {
                console.log('Tradier failed:', error.message);
            }
        }
        
        // Fallback to simulated data
        console.log(`⚠️ Using simulated data for ${symbol}`);
        return {
            price: generateSimulatedPrice(symbol),
            change: 0,
            changePercent: 0,
            volume: 0,
            timestamp: Date.now(),
            source: 'simulated',
            warning: '⚠️ Using simulated data. Real API failed.'
        };
    },
    
    /**
     * Fetch real options chain
     */
    async getOptionsChain(symbol) {
        // Check cache first (5 minute cache for options)
        const cacheKey = `options_${symbol}`;
        const cached = this.cache[cacheKey];
        if (cached && Date.now() - cached.time < 300000) {
            return cached.data;
        }
        
        // Try Tradier if configured
        if (this.apis.tradier.enabled) {
            try {
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
                
                const chainData = {
                    options: allOptions,
                    source: 'tradier',
                    timestamp: Date.now()
                };
                
                // Cache it
                this.cache[cacheKey] = {
                    data: chainData,
                    time: Date.now()
                };
                
                return chainData;
                
            } catch (error) {
                console.log('Tradier options failed:', error.message);
            }
        }
        
        // Fallback to simulated data
        console.log(`⚠️ Using simulated options data for ${symbol}`);
        const stockPrice = await this.getStockPrice(symbol);
        const chainData = {
            options: OptionsData.generateOptionsChain(symbol, stockPrice.price),
            source: 'simulated',
            timestamp: Date.now(),
            warning: '⚠️ Using simulated data. Real API not available.'
        };
        
        // Cache it
        this.cache[cacheKey] = {
            data: chainData,
            time: Date.now()
        };
        
        return chainData;
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
        console.log(`❌ Unknown API: ${apiName}`);
        return false;
    },
    
    /**
     * Test API connection
     */
    async testConnection(apiName) {
        console.log(`Testing ${apiName} connection...`);
        
        if (apiName === 'polygon') {
            try {
                const result = await this.getStockPrice('AAPL');
                if (result.source === 'polygon') {
                    console.log('✅ Polygon connection successful!');
                    console.log('AAPL Price:', result.price);
                    return true;
                }
            } catch (error) {
                console.log('❌ Polygon connection failed:', error.message);
                return false;
            }
        }
        
        if (apiName === 'tradier') {
            try {
                const result = await this.getStockPrice('AAPL');
                if (result.source === 'tradier') {
                    console.log('✅ Tradier connection successful!');
                    return true;
                }
            } catch (error) {
                console.log('❌ Tradier connection failed:', error.message);
                return false;
            }
        }
        
        console.log('❌ API not configured or test failed');
        return false;
    },
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache = {};
        console.log('✅ Cache cleared');
    },
    
    /**
     * Get cache stats
     */
    getCacheStats() {
        const keys = Object.keys(this.cache);
        console.log(`Cache contains ${keys.length} items:`);
        keys.forEach(key => {
            const age = Date.now() - this.cache[key].time;
            console.log(`  ${key}: ${Math.floor(age/1000)}s old`);
        });
    }
};

/**
 * Helper function to generate simulated price
 */
function generateSimulatedPrice(symbol) {
    // Generate a consistent price based on symbol
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 50 + (hash % 450); // Price between $50 and $500
    return basePrice;
}

// Auto-test connection on load
if (RealTimeData.apis.polygon.enabled) {
    console.log('🚀 Polygon API is enabled');
    console.log('Testing connection...');
    RealTimeData.testConnection('polygon').then(success => {
        if (success) {
            console.log('✅ Ready to fetch real-time data!');
        } else {
            console.log('⚠️ Will use fallback data sources');
        }
    });
} else {
    console.log('⚠️ No real-time API configured. Using simulated data.');
}
