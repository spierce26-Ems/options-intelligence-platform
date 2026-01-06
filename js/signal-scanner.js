/**
 * SIGNAL SCANNER
 * Real-time IV Rank monitoring and signal generation
 * 
 * Features:
 * - Scans watchlist for IV Rank opportunities
 * - Generates trade specifications
 * - Confidence scoring
 * - Backtest-based recommendations
 */

const SignalScanner = {
    // Default watchlist (can be customized)
    // EXPANDED for Starter Plan users with higher API limits
    watchlist: [
        // Major Index ETFs (5)
        'SPY', 'QQQ', 'IWM', 'DIA', 'VTI',
        
        // Tech Mega-Caps (10) - High liquidity
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
        'NVDA', 'TSLA', 'AMD', 'NFLX', 'CRM',
        
        // High Volatility Tech (8) - More opportunities
        'COIN', 'SHOP', 'SQ', 'PYPL', 'ROKU',
        'SNAP', 'UBER', 'LYFT',
        
        // Financials (6)
        'JPM', 'BAC', 'GS', 'C', 'WFC', 'MS',
        
        // Healthcare (5)
        'UNH', 'JNJ', 'PFE', 'ABBV', 'LLY',
        
        // Consumer (5)
        'WMT', 'HD', 'NKE', 'SBUX', 'MCD',
        
        // Energy (5)
        'XOM', 'CVX', 'XLE', 'OXY', 'SLB',
        
        // Industrials (5) - Validated CSX
        'CSX', 'UNP', 'NSC', 'CAT', 'BA',
        
        // Sector ETFs (6)
        'XLF', 'XLK', 'XLV', 'XLY', 'XLP', 'XLI',
        
        // Semiconductors (5)
        'INTC', 'MU', 'AVGO', 'QCOM', 'TSM',
        
        // Communication (4)
        'DIS', 'CMCSA', 'VZ', 'T',
        
        // Emerging/High Vol (6)
        'RIVN', 'LCID', 'PLTR', 'SOFI', 'AFRM', 'HOOD'
    ],
    
    // Backtest results (from validation)
    backtestResults: {
        'CSX': { winRate: 88.9, trades: 9, sharpe: 2.1 },
        'SPY': { winRate: 87.5, trades: 8, sharpe: 1.9 },
        'AAPL': { winRate: 88.9, trades: 9, sharpe: 2.2 },
        'TSLA': { winRate: 88.9, trades: 9, sharpe: 2.0 },
        'NVDA': { winRate: 100, trades: 8, sharpe: 2.8 }
    },
    
    // Cache for scanner results
    cache: {
        lastScan: null,
        signals: [],
        timestamp: null
    },
    
    // API call tracking for rate limiting
    apiCallTracker: {
        calls: [],
        maxCallsPerMinute: 1000, // UNLIMITED PLAN - High limit for safety
        retryDelay: 5000, // 5 seconds for 429 errors
        consecutiveErrors: 0, // Track consecutive 429s
        maxConsecutiveErrors: 3 // Abort after 3 consecutive 429s
    },
    
    // Data cache to reduce API calls
    dataCache: {
        prices: new Map(),
        options: new Map(),
        historical: new Map(),
        ttl: 60000 // 1 minute TTL
    },
    
    /**
     * Scan all watchlist stocks for opportunities
     */
    async scanAll() {
        console.log('🔍 Starting signal scan...');
        console.log(`   Scanning ${this.watchlist.length} stocks`);
        console.log(`   ⏱️  Estimated duration: ~${Math.round(this.watchlist.length * 1.5 / 60)} minutes`);
        
        // Reset consecutive error counter
        this.apiCallTracker.consecutiveErrors = 0;
        
        const signals = [];
        const timestamp = new Date();
        
        for (const symbol of this.watchlist) {
            try {
                const signal = await this.scanSymbol(symbol);
                if (signal) {
                    signals.push(signal);
                    // Reset error counter on successful scan
                    this.apiCallTracker.consecutiveErrors = 0;
                }
                
                // Rate limiting - UNLIMITED PLAN (Options Starter $29/mo)
                // But respecting BURST limits to avoid temporary throttling
                // Increased to 1000ms (1 second) to completely avoid 429 errors
                // This is conservative but ensures 100% reliability
                await this.sleep(1000);
                
                // Light rate limit check (mainly for safety)
                await this.checkRateLimit();
                
            } catch (error) {
                console.error(`   ❌ Error scanning ${symbol}:`, error.message);
            }
        }
        
        // Sort by confidence score (highest first)
        signals.sort((a, b) => b.confidence - a.confidence);
        
        // Cache results
        this.cache = {
            lastScan: timestamp,
            signals: signals,
            timestamp: timestamp.toISOString()
        };
        
        console.log(`✅ Scan complete: ${signals.length} opportunities found`);
        
        return signals;
    },
    
    /**
     * Check rate limit and throttle if needed
     */
    async checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove calls older than 1 minute
        this.apiCallTracker.calls = this.apiCallTracker.calls.filter(time => time > oneMinuteAgo);
        
        // If approaching limit, wait
        if (this.apiCallTracker.calls.length >= this.apiCallTracker.maxCallsPerMinute) {
            const oldestCall = this.apiCallTracker.calls[0];
            const waitTime = 60000 - (now - oldestCall) + 1000; // Wait until oldest call is >1 min old
            console.log(`   ⏳ Rate limit approaching, waiting ${Math.round(waitTime/1000)}s...`);
            await this.sleep(waitTime);
        }
    },
    
    /**
     * Track API call for rate limiting
     */
    trackApiCall() {
        this.apiCallTracker.calls.push(Date.now());
    },
    
    /**
     * Get cached data or fetch fresh
     */
    async getCachedData(key, fetchFn, cacheMap) {
        const cached = cacheMap.get(key);
        const now = Date.now();
        
        // Return cached if still valid
        if (cached && (now - cached.timestamp) < this.dataCache.ttl) {
            console.log(`   💾 Using cached data for ${key}`);
            return cached.data;
        }
        
        // Fetch fresh data
        this.trackApiCall();
        const data = await fetchFn();
        
        // Cache the result
        cacheMap.set(key, { data, timestamp: now });
        
        return data;
    },
    
    /**
     * Scan a single symbol for opportunities
     */
    async scanSymbol(symbol) {
        try {
            // Get current stock price (with caching)
            const stockData = await this.getCachedData(
                `price_${symbol}`,
                () => RealTimeData.getStockPrice(symbol),
                this.dataCache.prices
            );
            if (!stockData || !stockData.price) {
                console.log(`   ⚠️ ${symbol}: No price data`);
                return null;
            }
            
            // Get options chain to calculate IV Rank (with caching)
            const optionsData = await this.getCachedData(
                `options_${symbol}`,
                () => RealTimeData.getOptionsChain(symbol),
                this.dataCache.options
            );
            if (!optionsData) {
                console.log(`   ⚠️ ${symbol}: No options data`);
                return null;
            }
            
            // Calculate current IV (average of ATM options)
            const currentIV = this.calculateCurrentIV(optionsData, stockData.price);
            if (!currentIV) {
                console.log(`   ⚠️ ${symbol}: Could not calculate IV`);
                return null;
            }
            
            // Calculate IV Rank (using historical data if available)
            const ivRank = await this.calculateIVRank(symbol, currentIV);
            
            // Generate signal if IV Rank is extreme
            if (ivRank > 80 || ivRank < 20) {
                const signal = IVRankEngine.generateSignal(
                    symbol,
                    ivRank,
                    currentIV,
                    stockData.price
                );
                
                if (signal && signal.action !== 'WAIT') {
                    // Enhance signal with backtest data
                    const backtestData = this.backtestResults[symbol] || { winRate: 70, trades: 0, sharpe: 1.5 };
                    
                    signal.backtest = backtestData;
                    signal.timestamp = new Date().toISOString();
                    signal.currentPrice = stockData.price;
                    signal.currentIV = currentIV;
                    
                    console.log(`   🎯 ${symbol}: ${signal.action} signal @ IV Rank ${ivRank}%`);
                    
                    return signal;
                }
            }
            
            return null;
            
        } catch (error) {
            // Handle 429 rate limit errors with exponential backoff
            if (error.message && error.message.includes('429')) {
                this.apiCallTracker.consecutiveErrors++;
                const waitTime = this.apiCallTracker.retryDelay * this.apiCallTracker.consecutiveErrors;
                console.warn(`   🚨 ${symbol}: Rate limit hit (${this.apiCallTracker.consecutiveErrors}/${this.apiCallTracker.maxConsecutiveErrors}), waiting ${waitTime/1000}s...`);
                
                // If too many consecutive errors, abort scan
                if (this.apiCallTracker.consecutiveErrors >= this.apiCallTracker.maxConsecutiveErrors) {
                    console.error('   ⛔ Too many rate limit errors. Aborting scan.');
                    console.error('   💡 Try again in 2-3 minutes when rate limit resets.');
                    throw new Error('Rate limit exceeded - scan aborted');
                }
                
                await this.sleep(waitTime);
            } else {
                console.error(`   ❌ ${symbol}: Error scanning -`, error.message);
            }
            return null;
        }
    },
    
    /**
     * Calculate current IV from options chain
     */
    calculateCurrentIV(optionsChain, stockPrice) {
        // Handle different data formats
        let optionsArray = optionsChain;
        
        // If optionsChain is an object with a results/data array, extract it
        if (!Array.isArray(optionsChain)) {
            if (optionsChain.results && Array.isArray(optionsChain.results)) {
                optionsArray = optionsChain.results;
            } else if (optionsChain.data && Array.isArray(optionsChain.data)) {
                optionsArray = optionsChain.data;
            } else if (optionsChain.options && Array.isArray(optionsChain.options)) {
                optionsArray = optionsChain.options;
            } else {
                console.warn('   ⚠️ Options data is not an array:', typeof optionsChain);
                return null;
            }
        }
        
        if (!optionsArray || optionsArray.length === 0) {
            console.warn('   ⚠️ No options in array');
            return null;
        }
        
        // Find ATM options (within 5% of stock price)
        const atmOptions = optionsArray.filter(opt => {
            const strike = opt.strike || opt.strikePrice || opt.strike_price || 0;
            return Math.abs(strike - stockPrice) < stockPrice * 0.05;
        });
        
        if (atmOptions.length === 0) {
            console.warn('   ⚠️ No ATM options found');
            return null;
        }
        
        // Average IV of ATM options
        const avgIV = atmOptions.reduce((sum, opt) => {
            const iv = opt.iv || opt.impliedVolatility || opt.implied_volatility || 0.30;
            return sum + iv;
        }, 0) / atmOptions.length;
        
        return Math.round(avgIV * 1000) / 10; // Return as percentage
    },
    
    /**
     * Calculate IV Rank (needs historical IV data)
     * ENHANCED for Starter Plan with full historical data access
     */
    async calculateIVRank(symbol, currentIV) {
        // Try to get historical IV from Massive.com (with caching)
        if (window.MassiveHistoricalData && MassiveHistoricalData.isConfigured()) {
            try {
                const endDate = new Date();
                const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
                
                const historicalData = await this.getCachedData(
                    `historical_${symbol}`,
                    () => MassiveHistoricalData.buildHistoricalDataset(symbol, startDate, endDate),
                    this.dataCache.historical
                );
                
                if (historicalData && historicalData.length > 30) {
                    // Calculate IV Rank from historical data
                    const rank = IVRankEngine.calculateIVRank(symbol, currentIV, historicalData);
                    console.log(`   ${symbol}: IV Rank ${rank}% (calculated from ${historicalData.length} days)`);
                    return rank;
                }
            } catch (error) {
                console.warn(`   ⚠️ ${symbol}: Could not get historical IV:`, error.message);
            }
        }
        
        // Fallback: Estimate IV Rank based on current IV
        // This is less accurate but works when API limits hit
        console.warn(`   ⚠️ ${symbol}: Using estimated IV Rank (no historical data)`);
        if (currentIV < 20) return 10;
        if (currentIV < 25) return 30;
        if (currentIV < 35) return 50;
        if (currentIV < 45) return 70;
        return 85;
    },
    
    /**
     * Get top opportunities (highest confidence)
     */
    getTopOpportunities(count = 5) {
        if (!this.cache.signals || this.cache.signals.length === 0) {
            return [];
        }
        
        return this.cache.signals.slice(0, count);
    },
    
    /**
     * Filter signals by action
     */
    getSignalsByAction(action) {
        if (!this.cache.signals) return [];
        
        return this.cache.signals.filter(s => s.action === action);
    },
    
    /**
     * Check if cache is stale (older than 5 minutes)
     */
    isCacheStale() {
        if (!this.cache.lastScan) return true;
        
        const age = Date.now() - this.cache.lastScan.getTime();
        return age > 5 * 60 * 1000; // 5 minutes
    },
    
    /**
     * Sleep helper for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Add custom stock to watchlist
     */
    addToWatchlist(symbol) {
        symbol = symbol.toUpperCase();
        if (!this.watchlist.includes(symbol)) {
            this.watchlist.push(symbol);
            console.log(`✅ Added ${symbol} to watchlist`);
            return true;
        }
        return false;
    },
    
    /**
     * Remove stock from watchlist
     */
    removeFromWatchlist(symbol) {
        symbol = symbol.toUpperCase();
        const index = this.watchlist.indexOf(symbol);
        if (index > -1) {
            this.watchlist.splice(index, 1);
            console.log(`✅ Removed ${symbol} from watchlist`);
            return true;
        }
        return false;
    }
};

// Export
window.SignalScanner = SignalScanner;

console.log('✅ Signal Scanner loaded');
