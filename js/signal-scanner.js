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
    watchlist: [
        'SPY', 'QQQ', 'IWM',           // Index ETFs
        'AAPL', 'MSFT', 'GOOGL',       // Tech mega-caps
        'TSLA', 'NVDA', 'AMD',         // High volatility tech
        'JPM', 'BAC', 'GS',            // Financials
        'XLE', 'XLF', 'XLK',           // Sector ETFs
        'CSX', 'UNP', 'NSC',           // Industrials
        'DIS', 'NFLX', 'META'          // Media/Social
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
    
    /**
     * Scan all watchlist stocks for opportunities
     */
    async scanAll() {
        console.log('🔍 Starting signal scan...');
        console.log(`   Scanning ${this.watchlist.length} stocks`);
        
        const signals = [];
        const timestamp = new Date();
        
        for (const symbol of this.watchlist) {
            try {
                const signal = await this.scanSymbol(symbol);
                if (signal) {
                    signals.push(signal);
                }
                
                // Rate limiting - wait 200ms between calls
                await this.sleep(200);
                
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
     * Scan a single symbol for opportunities
     */
    async scanSymbol(symbol) {
        // Get current stock price and IV
        const stockData = await RealTimeData.getStockPrice(symbol);
        if (!stockData) {
            console.log(`   ⚠️ ${symbol}: No price data`);
            return null;
        }
        
        // Get options chain to calculate IV Rank
        const optionsData = await RealTimeData.getOptionsChain(symbol);
        if (!optionsData || optionsData.length === 0) {
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
    },
    
    /**
     * Calculate current IV from options chain
     */
    calculateCurrentIV(optionsChain, stockPrice) {
        // Find ATM options (within 5% of stock price)
        const atmOptions = optionsChain.filter(opt => {
            return Math.abs(opt.strike - stockPrice) < stockPrice * 0.05;
        });
        
        if (atmOptions.length === 0) return null;
        
        // Average IV of ATM options
        const avgIV = atmOptions.reduce((sum, opt) => {
            return sum + (opt.iv || opt.impliedVolatility || 0.30);
        }, 0) / atmOptions.length;
        
        return Math.round(avgIV * 1000) / 10; // Return as percentage
    },
    
    /**
     * Calculate IV Rank (needs historical IV data)
     */
    async calculateIVRank(symbol, currentIV) {
        // Try to get historical IV from Massive.com
        if (window.MassiveHistoricalData && MassiveHistoricalData.isConfigured()) {
            try {
                const endDate = new Date();
                const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
                
                const historicalData = await MassiveHistoricalData.buildHistoricalDataset(
                    symbol, 
                    startDate, 
                    endDate
                );
                
                if (historicalData && historicalData.length > 30) {
                    // Calculate IV Rank from historical data
                    return IVRankEngine.calculateIVRank(symbol, currentIV, historicalData);
                }
            } catch (error) {
                console.warn(`   ⚠️ ${symbol}: Could not get historical IV, using estimate`);
            }
        }
        
        // Fallback: Estimate IV Rank based on current IV
        // Typical IV ranges: 15-25 (low), 25-40 (medium), 40+ (high)
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
