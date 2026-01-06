/**
 * IV RANK ENGINE
 * Core edge: IV Rank mean reversion
 * 
 * Strategy:
 * - IV Rank > 80 = SELL premium (Iron Condors)
 * - IV Rank < 20 = BUY premium (Debit Spreads)
 * - Target: 30-45 DTE, exit at 50% profit or 21 days
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
        
        // HIGH IV RANK = SELL PREMIUM
        if (ivRank >= 80) {
            signal.action = 'SELL';
            signal.confidence = Math.min(95, 60 + (ivRank - 80) * 1.5);
            signal.strategy = 'Iron Condor';
            signal.reasoning = `IV Rank ${ivRank}% is extremely high. Volatility likely to mean revert. Sell premium.`;
            
            // Calculate suggested Iron Condor strikes
            signal.trade = this.generateIronCondor(stockPrice, currentIV);
        }
        // MODERATE-HIGH IV RANK = CONSIDER SELLING
        else if (ivRank >= 70) {
            signal.action = 'SELL';
            signal.confidence = Math.min(75, 50 + (ivRank - 70));
            signal.strategy = 'Iron Condor';
            signal.reasoning = `IV Rank ${ivRank}% is elevated. Good opportunity to sell premium.`;
            signal.trade = this.generateIronCondor(stockPrice, currentIV);
        }
        // LOW IV RANK = BUY PREMIUM
        else if (ivRank <= 20) {
            signal.action = 'BUY';
            signal.confidence = Math.min(85, 50 + (20 - ivRank) * 1.5);
            signal.strategy = 'Debit Spread';
            signal.reasoning = `IV Rank ${ivRank}% is extremely low. Volatility likely to expand. Buy premium.`;
            signal.trade = this.generateDebitSpread(stockPrice, currentIV);
        }
        // MODERATE IV RANK = WAIT
        else {
            signal.action = 'WAIT';
            signal.confidence = 0;
            signal.reasoning = `IV Rank ${ivRank}% is neutral. Wait for extremes (>70 or <30).`;
        }
        
        return signal;
    },
    
    /**
     * Generate Iron Condor trade specifications
     */
    generateIronCondor(stockPrice, currentIV) {
        // Target: 1 standard deviation out on both sides
        // Standard deviation = Stock Price * IV * sqrt(DTE/365)
        const dte = 35; // Target 35 DTE
        const stdDev = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365);
        
        // Round to nearest strike (assume $5 increments for now)
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        const shortPutStrike = roundToStrike(stockPrice - stdDev);
        const longPutStrike = roundToStrike(stockPrice - stdDev * 1.2);
        const shortCallStrike = roundToStrike(stockPrice + stdDev);
        const longCallStrike = roundToStrike(stockPrice + stdDev * 1.2);
        
        // Calculate width and premium (rough estimate)
        const putWidth = shortPutStrike - longPutStrike;
        const callWidth = longCallStrike - shortCallStrike;
        const avgWidth = (putWidth + callWidth) / 2;
        
        // Premium is typically 20-40% of width for 1 SD iron condors
        const estimatedPremium = avgWidth * 0.30;
        
        return {
            type: 'Iron Condor',
            dte: dte,
            strikes: {
                longPut: longPutStrike,
                shortPut: shortPutStrike,
                shortCall: shortCallStrike,
                longCall: longCallStrike
            },
            width: avgWidth,
            estimatedCredit: Math.round(estimatedPremium * 100), // Convert to dollars
            maxProfit: Math.round(estimatedPremium * 100),
            maxLoss: Math.round((avgWidth - estimatedPremium) * 100),
            breakevens: {
                lower: shortPutStrike - estimatedPremium,
                upper: shortCallStrike + estimatedPremium
            },
            pop: 68, // Approximate - 1 SD = ~68% probability
            targetProfit: '50%',
            targetDays: 21
        };
    },
    
    /**
     * Generate Debit Spread trade specifications
     */
    generateDebitSpread(stockPrice, currentIV) {
        const dte = 45; // Longer DTE for volatility expansion plays
        const stdDev = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365);
        
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Bullish debit spread (can adjust for bearish)
        const longCallStrike = roundToStrike(stockPrice * 1.02); // Slightly OTM
        const shortCallStrike = roundToStrike(stockPrice * 1.08); // Further OTM
        
        const width = shortCallStrike - longCallStrike;
        const estimatedDebit = width * 0.35; // Typically pay 30-40% of width
        
        return {
            type: 'Call Debit Spread',
            dte: dte,
            strikes: {
                long: longCallStrike,
                short: shortCallStrike
            },
            width: width,
            estimatedDebit: Math.round(estimatedDebit * 100),
            maxProfit: Math.round((width - estimatedDebit) * 100),
            maxLoss: Math.round(estimatedDebit * 100),
            breakeven: longCallStrike + estimatedDebit,
            targetProfit: '100%', // Double your money or IV expansion
            targetDays: 30
        };
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

console.log('✅ IV Rank Engine loaded');
