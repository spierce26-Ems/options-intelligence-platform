/**
 * IV RANK ENGINE - SIMPLE STRATEGIES ONLY
 * Core edge: IV Rank mean reversion
 * 
 * Strategy (SIMPLIFIED):
 * - IV Rank > 70% = SELL premium (Short Call/Put)
 * - IV Rank < 30% = BUY premium (Long Call/Put)
 * - IV Rank 30-70% = WAIT (no signal)
 * 
 * Only 4 strategies:
 * 1. Long Call - Buy when IV is LOW
 * 2. Long Put - Buy when IV is LOW
 * 3. Short Call - Sell when IV is HIGH
 * 4. Short Put - Sell when IV is HIGH
 */

const IVRankEngine = {
    // Historical IV storage (will be populated from API)
    historicalIV: {},
    
    /**
     * Calculate IV Rank
     * Formula: (Current IV - Min IV over 252 days) / (Max IV - Min IV) * 100
     */
    calculateIVRank(symbol, currentIV, historicalData) {
        if (!historicalData || historicalData.length < 30) {
            console.warn(`⚠️ Insufficient data for ${symbol} IV Rank`);
            return null;
        }
        
        const ivValues = historicalData.map(d => d.iv);
        const minIV = Math.min(...ivValues);
        const maxIV = Math.max(...ivValues);
        
        if (maxIV === minIV) return 50; // No volatility range
        
        const ivRank = ((currentIV - minIV) / (maxIV - minIV)) * 100;
        
        return Math.round(ivRank * 10) / 10; // Round to 1 decimal
    },
    
    /**
     * Calculate IV Percentile
     * Percentage of days where IV was lower than current
     */
    calculateIVPercentile(symbol, currentIV, historicalData) {
        if (!historicalData || historicalData.length < 30) return null;
        
        const ivValues = historicalData.map(d => d.iv);
        const lowerCount = ivValues.filter(iv => iv < currentIV).length;
        
        return Math.round((lowerCount / ivValues.length) * 100);
    },
    
    /**
     * Get historical IV data (252 trading days = 1 year)
     */
    async getHistoricalIV(symbol, days = 252) {
        const cacheKey = `iv_hist_${symbol}_${days}`;
        
        // Check cache (24 hour TTL)
        if (this.historicalIV[cacheKey]) {
            const age = Date.now() - this.historicalIV[cacheKey].timestamp;
            if (age < 24 * 60 * 60 * 1000) {
                return this.historicalIV[cacheKey].data;
            }
        }
        
        try {
            // For now, we'll calculate from options chain
            // In production, this should use historical API endpoint
            const data = await this.calculateHistoricalIVFromChain(symbol);
            
            this.historicalIV[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
            
            return data;
        } catch (error) {
            console.error(`❌ Error fetching historical IV for ${symbol}:`, error);
            return null;
        }
    },
    
    /**
     * Calculate historical IV from options chain
     * This is a simplified version - in production use historical API
     */
    async calculateHistoricalIVFromChain(symbol) {
        // Get current ATM options IV as proxy
        const stockPrice = await RealTimeData.getStockPrice(symbol);
        if (!stockPrice) return null;
        
        const optionsData = await RealTimeData.getOptionsChain(symbol);
        if (!optionsData || !optionsData.options) return null;
        
        // Find ATM options (closest to stock price)
        const atmOptions = optionsData.options
            .filter(opt => Math.abs(opt.strike - stockPrice.price) < stockPrice.price * 0.05)
            .filter(opt => opt.dte > 20 && opt.dte < 60); // 30-45 DTE
        
        if (atmOptions.length === 0) return null;
        
        // Average IV of ATM options
        const avgIV = atmOptions.reduce((sum, opt) => sum + opt.iv, 0) / atmOptions.length;
        
        // For backtesting, we'll need actual historical data
        // This is placeholder that shows current IV
        return [{
            date: new Date().toISOString().split('T')[0],
            iv: avgIV,
            price: stockPrice.price
        }];
    },
    
    /**
     * Generate trading signal based on IV Rank
     * SIMPLE STRATEGIES ONLY - 4 options total
     */
    generateSignal(symbol, ivRank, currentIV, stockPrice) {
        if (ivRank === null) return null;
        
        let signal = {
            symbol: symbol,
            ivRank: ivRank,
            currentIV: currentIV,
            stockPrice: stockPrice,
            timestamp: new Date().toISOString(),
            action: 'WAIT',
            confidence: 0,
            strategy: null,
            reasoning: ''
        };
        
        // ========================================
        // HIGH IV RANK (70-100%) = SELL PREMIUM
        // ========================================
        
        if (ivRank >= 90) {
            // EXTREMELY HIGH IV - Sell Call or Put (50/50 split)
            const isCall = Math.random() > 0.5;
            
            if (isCall) {
                signal.action = 'SELL';
                signal.confidence = Math.min(95, 75 + (ivRank - 90));
                signal.strategy = 'Short Call';
                signal.reasoning = `IV Rank ${ivRank}% is extremely high. Sell call option to collect maximum premium.`;
                signal.trade = this.generateShortCall(stockPrice, currentIV);
            } else {
                signal.action = 'SELL';
                signal.confidence = Math.min(95, 75 + (ivRank - 90));
                signal.strategy = 'Short Put';
                signal.reasoning = `IV Rank ${ivRank}% is extremely high. Sell put option to collect maximum premium.`;
                signal.trade = this.generateShortPut(stockPrice, currentIV);
            }
        }
        else if (ivRank >= 70) {
            // VERY HIGH IV - Sell Call or Put
            const isCall = Math.random() > 0.5;
            
            if (isCall) {
                signal.action = 'SELL';
                signal.confidence = Math.min(85, 60 + (ivRank - 70));
                signal.strategy = 'Short Call';
                signal.reasoning = `IV Rank ${ivRank}% is very high. Sell call option for premium income.`;
                signal.trade = this.generateShortCall(stockPrice, currentIV);
            } else {
                signal.action = 'SELL';
                signal.confidence = Math.min(85, 60 + (ivRank - 70));
                signal.strategy = 'Short Put';
                signal.reasoning = `IV Rank ${ivRank}% is very high. Sell put option for premium income.`;
                signal.trade = this.generateShortPut(stockPrice, currentIV);
            }
        }
        
        // ========================================
        // LOW IV RANK (0-30%) = BUY PREMIUM
        // ========================================
        
        else if (ivRank <= 10) {
            // EXTREMELY LOW IV - Buy Call or Put
            const isCall = Math.random() > 0.5;
            
            if (isCall) {
                signal.action = 'BUY';
                signal.confidence = Math.min(90, 70 + (10 - ivRank) * 2);
                signal.strategy = 'Long Call';
                signal.reasoning = `IV Rank ${ivRank}% is extremely low. Buy call option cheap, expect volatility expansion.`;
                signal.trade = this.generateLongCall(stockPrice, currentIV);
            } else {
                signal.action = 'BUY';
                signal.confidence = Math.min(90, 70 + (10 - ivRank) * 2);
                signal.strategy = 'Long Put';
                signal.reasoning = `IV Rank ${ivRank}% is extremely low. Buy put option cheap, expect volatility expansion.`;
                signal.trade = this.generateLongPut(stockPrice, currentIV);
            }
        }
        else if (ivRank <= 30) {
            // LOW IV - Buy Call or Put
            const isCall = Math.random() > 0.5;
            
            if (isCall) {
                signal.action = 'BUY';
                signal.confidence = Math.min(80, 55 + (30 - ivRank));
                signal.strategy = 'Long Call';
                signal.reasoning = `IV Rank ${ivRank}% is low. Buy call option at discount.`;
                signal.trade = this.generateLongCall(stockPrice, currentIV);
            } else {
                signal.action = 'BUY';
                signal.confidence = Math.min(80, 55 + (30 - ivRank));
                signal.strategy = 'Long Put';
                signal.reasoning = `IV Rank ${ivRank}% is low. Buy put option at discount.`;
                signal.trade = this.generateLongPut(stockPrice, currentIV);
            }
        }
        
        // ========================================
        // NEUTRAL IV RANK (30-70%) = WAIT
        // ========================================
        
        else {
            signal.action = 'WAIT';
            signal.confidence = 0;
            signal.reasoning = `IV Rank ${ivRank}% is neutral (30-70%). Wait for extremes (>70% or <30%) for better opportunities.`;
        }
        
        return signal;
    },
    
    /**
     * Generate Long Call trade specifications
     * Buy call when IV is LOW
     */
    generateLongCall(stockPrice, currentIV) {
        const dte = 45; // 45 days to expiration
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Buy slightly OTM call (5% above current price)
        const strike = roundToStrike(stockPrice * 1.05);
        
        // Estimate premium: Stock Price * IV * sqrt(DTE/365) * 0.4
        const estimatedPremium = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365) * 0.4;
        
        return {
            type: 'Long Call',
            action: 'BUY',
            dte: dte,
            strike: strike,
            estimatedPremium: Math.round(estimatedPremium * 100) / 100, // Per share in dollars
            costPer1Contract: Math.round(estimatedPremium * 100), // 100 shares per contract
            maxProfit: 'Unlimited',
            maxLoss: Math.round(estimatedPremium * 100), // Cost of premium
            breakeven: strike + estimatedPremium,
            targetProfit: '50-100%',
            targetDays: 30,
            expirationDate: this.getExpirationDate(dte),
            entryDetails: {
                action: 'BUY TO OPEN',
                contracts: 1,
                optionType: 'CALL',
                strike: strike,
                expiration: this.getExpirationDate(dte),
                estimatedCost: Math.round(estimatedPremium * 100)
            }
        };
    },
    
    /**
     * Generate Long Put trade specifications
     * Buy put when IV is LOW
     */
    generateLongPut(stockPrice, currentIV) {
        const dte = 45; // 45 days to expiration
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Buy slightly OTM put (5% below current price)
        const strike = roundToStrike(stockPrice * 0.95);
        
        // Estimate premium: Stock Price * IV * sqrt(DTE/365) * 0.4
        const estimatedPremium = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365) * 0.4;
        
        return {
            type: 'Long Put',
            action: 'BUY',
            dte: dte,
            strike: strike,
            estimatedPremium: Math.round(estimatedPremium * 100) / 100, // Per share in dollars
            costPer1Contract: Math.round(estimatedPremium * 100), // 100 shares per contract
            maxProfit: Math.round((strike - estimatedPremium) * 100), // Max profit if stock goes to $0
            maxLoss: Math.round(estimatedPremium * 100), // Cost of premium
            breakeven: strike - estimatedPremium,
            targetProfit: '50-100%',
            targetDays: 30,
            expirationDate: this.getExpirationDate(dte),
            entryDetails: {
                action: 'BUY TO OPEN',
                contracts: 1,
                optionType: 'PUT',
                strike: strike,
                expiration: this.getExpirationDate(dte),
                estimatedCost: Math.round(estimatedPremium * 100)
            }
        };
    },
    
    /**
     * Generate Short Call trade specifications
     * Sell call when IV is HIGH
     */
    generateShortCall(stockPrice, currentIV) {
        const dte = 30; // 30 days to expiration
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Sell OTM call (10% above current price)
        const strike = roundToStrike(stockPrice * 1.10);
        
        // Estimate premium: Stock Price * IV * sqrt(DTE/365) * 0.35
        const estimatedPremium = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365) * 0.35;
        
        return {
            type: 'Short Call',
            action: 'SELL',
            dte: dte,
            strike: strike,
            estimatedPremium: Math.round(estimatedPremium * 100) / 100, // Per share in dollars
            creditPer1Contract: Math.round(estimatedPremium * 100), // 100 shares per contract
            maxProfit: Math.round(estimatedPremium * 100), // Premium collected
            maxLoss: 'Unlimited (if stock rises above strike)',
            breakeven: strike + estimatedPremium,
            targetProfit: '50%',
            targetDays: 21,
            expirationDate: this.getExpirationDate(dte),
            note: 'Consider covered call (own 100 shares) to reduce risk',
            entryDetails: {
                action: 'SELL TO OPEN',
                contracts: 1,
                optionType: 'CALL',
                strike: strike,
                expiration: this.getExpirationDate(dte),
                estimatedCredit: Math.round(estimatedPremium * 100)
            }
        };
    },
    
    /**
     * Generate Short Put trade specifications
     * Sell put when IV is HIGH
     */
    generateShortPut(stockPrice, currentIV) {
        const dte = 30; // 30 days to expiration
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Sell OTM put (10% below current price)
        const strike = roundToStrike(stockPrice * 0.90);
        
        // Estimate premium: Stock Price * IV * sqrt(DTE/365) * 0.35
        const estimatedPremium = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365) * 0.35;
        
        return {
            type: 'Short Put',
            action: 'SELL',
            dte: dte,
            strike: strike,
            estimatedPremium: Math.round(estimatedPremium * 100) / 100, // Per share in dollars
            creditPer1Contract: Math.round(estimatedPremium * 100), // 100 shares per contract
            maxProfit: Math.round(estimatedPremium * 100), // Premium collected
            maxLoss: Math.round((strike - estimatedPremium) * 100), // If stock drops to $0
            breakeven: strike - estimatedPremium,
            targetProfit: '50%',
            targetDays: 21,
            expirationDate: this.getExpirationDate(dte),
            note: 'Ensure cash-secured (have cash to buy 100 shares)',
            entryDetails: {
                action: 'SELL TO OPEN',
                contracts: 1,
                optionType: 'PUT',
                strike: strike,
                expiration: this.getExpirationDate(dte),
                estimatedCredit: Math.round(estimatedPremium * 100)
            }
        };
    },
    
    /**
     * Calculate expiration date (DTE days from today)
     */
    getExpirationDate(dte) {
        const date = new Date();
        date.setDate(date.getDate() + dte);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    },
    
    /**
     * Scan multiple stocks for opportunities
     */
    async scanForOpportunities(symbols) {
        console.log(`🔍 Scanning ${symbols.length} symbols for IV Rank opportunities...`);
        
        const opportunities = [];
        
        for (const symbol of symbols) {
            try {
                // Get current data
                const stockPrice = await RealTimeData.getStockPrice(symbol);
                if (!stockPrice) continue;
                
                // Get options data
                const optionsData = await RealTimeData.getOptionsChain(symbol);
                if (!optionsData || !optionsData.options) continue;
                
                // Calculate current IV (ATM options)
                const atmOptions = optionsData.options
                    .filter(opt => Math.abs(opt.strike - stockPrice.price) < stockPrice.price * 0.05)
                    .filter(opt => opt.dte > 20 && opt.dte < 60);
                
                if (atmOptions.length === 0) continue;
                
                const currentIV = atmOptions.reduce((sum, opt) => sum + opt.iv, 0) / atmOptions.length;
                
                // For now, use simulated historical data
                // In production, fetch real historical IV
                const historicalIV = this.simulateHistoricalIV(currentIV);
                
                // Calculate IV Rank
                const ivRank = this.calculateIVRank(symbol, currentIV, historicalIV);
                if (ivRank === null) continue;
                
                // Generate signal
                const signal = this.generateSignal(symbol, ivRank, currentIV, stockPrice.price);
                
                if (signal && signal.action !== 'WAIT') {
                    opportunities.push(signal);
                }
                
            } catch (error) {
                console.error(`Error scanning ${symbol}:`, error.message);
            }
        }
        
        // Sort by confidence
        opportunities.sort((a, b) => b.confidence - a.confidence);
        
        console.log(`✅ Found ${opportunities.length} opportunities`);
        return opportunities;
    },
    
    /**
     * Simulate historical IV for backtesting
     * TODO: Replace with real historical data from API
     */
    simulateHistoricalIV(currentIV) {
        const data = [];
        const days = 252; // 1 year
        
        // Simulate mean-reverting IV with random walk
        let iv = currentIV;
        const meanIV = 30; // Long-term mean around 30%
        const meanReversionSpeed = 0.1;
        const volatility = 3;
        
        for (let i = days; i >= 0; i--) {
            // Mean reversion + random walk
            const drift = (meanIV - iv) * meanReversionSpeed;
            const shock = (Math.random() - 0.5) * volatility;
            iv = Math.max(10, Math.min(100, iv + drift + shock));
            
            data.push({
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                iv: iv
            });
        }
        
        return data;
    }
};

// Export
window.IVRankEngine = IVRankEngine;

console.log('✅ IV Rank Engine loaded (SIMPLE STRATEGIES ONLY - v2.0)');
