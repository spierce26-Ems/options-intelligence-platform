/**
 * REAL-TIME DATA INTEGRATION MODULE
 * Connects to multiple options data APIs
 */

const RealTimeData = {
    // API Configuration
    apis: {
        tradier: {
            enabled: false,
            apiKey: '', // Set your API key here
            sandbox: true,
            baseUrl: 'https://sandbox.tradier.com/v1'
        },
        tdameritrade: {
            enabled: false,
            apiKey: '', // Set your API key here
            baseUrl: 'https://api.tdameritrade.com/v1'
        },
        polygon: {
            enabled: false,
            apiKey: '', // Set your API key here
            baseUrl: 'https://api.polygon.io/v3'
        },
        yahoo: {
            enabled: true, // Free, no key needed
            baseUrl: 'https://query1.finance.yahoo.com'
        }
    },
    
    /**
     * Fetch real-time stock price
     */
    async getStockPrice(symbol) {
        // Try Yahoo Finance first (free, no auth)
        try {
            const response = await fetch(
                `${this.apis.yahoo.baseUrl}/v8/finance/chart/${symbol}?interval=1d&range=1d`,
                { mode: 'cors' }
            );
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const meta = data.chart.result[0].meta;
                return {
                    price: meta.regularMarketPrice || meta.previousClose,
                    change: meta.regularMarketPrice - meta.previousClose,
                    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                    volume: meta.regularMarketVolume,
                    timestamp: Date.now(),
                    source: 'yahoo'
                };
            }
        } catch (error) {
            console.log('Yahoo Finance failed:', error);
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
                    return {
                        price: quote.last,
                        change: quote.change,
                        changePercent: quote.change_percentage,
                        volume: quote.volume,
                        timestamp: Date.now(),
                        source: 'tradier'
                    };
                }
            } catch (error) {
                console.log('Tradier failed:', error);
            }
        }
        
        // Fallback to simulated data
        return {
            price: generateSimulatedPrice(symbol),
            change: 0,
            changePercent: 0,
            volume: 0,
            timestamp: Date.now(),
            source: 'simulated',
            warning: '⚠️ Using simulated data. Configure API keys for real-time data.'
        };
    },
    
    /**
     * Fetch real options chain
     */
    async getOptionsChain(symbol) {
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
                
                return {
                    options: allOptions,
                    source: 'tradier',
                    timestamp: Date.now()
                };
                
            } catch (error) {
                console.log('Tradier options failed:', error);
            }
        }
        
        // Fallback to simulated data
        const stockPrice = await OptionsData.getStockPrice(symbol);
        return {
            options: OptionsData.generateOptionsChain(symbol, stockPrice),
            source: 'simulated',
            timestamp: Date.now(),
            warning: '⚠️ Using simulated data. Configure API keys for real-time options data.'
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
            const testSymbol = 'AAPL';
            const data = await this.getStockPrice(testSymbol);
            return {
                success: data.source !== 'simulated',
                source: data.source,
                message: data.source === 'simulated' ? 
                    'Using simulated data - configure API keys' : 
                    `Connected to ${data.source}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Make globally available
window.RealTimeData = RealTimeData;

/**
 * Helper function for simulated prices
 */
function generateSimulatedPrice(symbol) {
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 50 + (hash % 450);
    const volatility = Math.sin(hash) * 5;
    return parseFloat((basePrice + volatility).toFixed(2));
}
