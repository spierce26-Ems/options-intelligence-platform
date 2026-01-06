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
        if (ivRank >= 90) {
            signal.action = 'SELL';
            signal.confidence = Math.min(95, 70 + (ivRank - 90));
            signal.strategy = 'Iron Condor';
            signal.reasoning = `IV Rank ${ivRank}% is extremely high. Maximum premium selling opportunity.`;
            signal.trade = this.generateIronCondor(stockPrice, currentIV);
        }
        else if (ivRank >= 80) {
            signal.action = 'SELL';
            signal.confidence = Math.min(90, 65 + (ivRank - 80) * 1.5);
            signal.strategy = 'Credit Spread';
            signal.reasoning = `IV Rank ${ivRank}% is very high. Sell directional credit spread.`;
            signal.trade = this.generateCreditSpread(stockPrice, currentIV);
        }
        // MODERATE-HIGH IV RANK = CONSIDER SELLING
        else if (ivRank >= 70) {
            signal.action = 'SELL';
            signal.confidence = Math.min(80, 55 + (ivRank - 70));
            signal.strategy = 'Short Strangle';
            signal.reasoning = `IV Rank ${ivRank}% is elevated. Sell premium with wider strikes.`;
            signal.trade = this.generateShortStrangle(stockPrice, currentIV);
        }
        else if (ivRank >= 60) {
            signal.action = 'SELL';
            signal.confidence = Math.min(70, 50 + (ivRank - 60));
            signal.strategy = 'Covered Call / Cash-Secured Put';
            signal.reasoning = `IV Rank ${ivRank}% is moderately high. Consider income strategies.`;
            signal.trade = this.generateIncomeStrategy(stockPrice, currentIV);
        }
        // LOW IV RANK = BUY PREMIUM
        else if (ivRank <= 10) {
            signal.action = 'BUY';
            signal.confidence = Math.min(90, 60 + (10 - ivRank) * 2);
            signal.strategy = 'Long Straddle';
            signal.reasoning = `IV Rank ${ivRank}% is extremely low. Expect volatility expansion.`;
            signal.trade = this.generateLongStraddle(stockPrice, currentIV);
        }
        else if (ivRank <= 20) {
            signal.action = 'BUY';
            signal.confidence = Math.min(85, 50 + (20 - ivRank) * 1.5);
            signal.strategy = 'Debit Spread';
            signal.reasoning = `IV Rank ${ivRank}% is very low. Buy premium for directional play.`;
            signal.trade = this.generateDebitSpread(stockPrice, currentIV);
        }
        else if (ivRank <= 30) {
            signal.action = 'BUY';
            signal.confidence = Math.min(75, 45 + (30 - ivRank));
            signal.strategy = 'Calendar Spread';
            signal.reasoning = `IV Rank ${ivRank}% is low. Benefit from time decay and potential IV rise.`;
            signal.trade = this.generateCalendarSpread(stockPrice, currentIV);
        }
        // MODERATE IV RANK = WAIT OR NEUTRAL
        else if (ivRank >= 40 && ivRank <= 50) {
            signal.action = 'NEUTRAL';
            signal.confidence = 50;
            signal.strategy = 'Butterfly Spread';
            signal.reasoning = `IV Rank ${ivRank}% is neutral. Consider neutral strategies.`;
            signal.trade = this.generateButterflySpread(stockPrice, currentIV);
        }
        else {
            signal.action = 'WAIT';
            signal.confidence = 0;
            signal.reasoning = `IV Rank ${ivRank}% is neutral (30-60). Wait for extremes (>60 or <30).`;
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
     * Generate Credit Spread trade specifications
     */
    generateCreditSpread(stockPrice, currentIV) {
        const dte = 35;
        const stdDev = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365);
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Bearish credit spread (put credit spread)
        const shortPutStrike = roundToStrike(stockPrice - stdDev * 0.8);
        const longPutStrike = roundToStrike(stockPrice - stdDev * 1.1);
        
        const width = shortPutStrike - longPutStrike;
        const estimatedCredit = width * 0.35;
        
        return {
            type: 'Put Credit Spread',
            dte: dte,
            strikes: {
                short: shortPutStrike,
                long: longPutStrike
            },
            width: width,
            estimatedCredit: Math.round(estimatedCredit * 100),
            maxProfit: Math.round(estimatedCredit * 100),
            maxLoss: Math.round((width - estimatedCredit) * 100),
            breakeven: shortPutStrike - estimatedCredit,
            pop: 70,
            targetProfit: '50%',
            targetDays: 21
        };
    },
    
    /**
     * Generate Short Strangle trade specifications
     */
    generateShortStrangle(stockPrice, currentIV) {
        const dte = 35;
        const stdDev = stockPrice * (currentIV / 100) * Math.sqrt(dte / 365);
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Wider strikes than iron condor
        const shortPutStrike = roundToStrike(stockPrice - stdDev * 1.2);
        const shortCallStrike = roundToStrike(stockPrice + stdDev * 1.2);
        
        const estimatedCredit = (stockPrice * currentIV / 100) * 0.15;
        
        return {
            type: 'Short Strangle',
            dte: dte,
            strikes: {
                shortPut: shortPutStrike,
                shortCall: shortCallStrike
            },
            estimatedCredit: Math.round(estimatedCredit * 100),
            maxProfit: Math.round(estimatedCredit * 100),
            maxLoss: Infinity, // Undefined risk
            breakevens: {
                lower: shortPutStrike - estimatedCredit,
                upper: shortCallStrike + estimatedCredit
            },
            pop: 65,
            targetProfit: '50%',
            targetDays: 21,
            note: 'Undefined risk - consider adding protective wings'
        };
    },
    
    /**
     * Generate Income Strategy (Covered Call or Cash-Secured Put)
     */
    generateIncomeStrategy(stockPrice, currentIV) {
        const dte = 30;
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        // Covered call at slightly OTM
        const callStrike = roundToStrike(stockPrice * 1.05);
        const estimatedPremium = (stockPrice * currentIV / 100) * 0.08;
        
        return {
            type: 'Covered Call',
            dte: dte,
            strikes: {
                call: callStrike
            },
            estimatedPremium: Math.round(estimatedPremium * 100),
            maxProfit: Math.round((callStrike - stockPrice + estimatedPremium) * 100),
            maxLoss: 'Stock ownership risk',
            breakeven: stockPrice - estimatedPremium,
            annualizedReturn: Math.round((estimatedPremium / stockPrice) * (365 / dte) * 100),
            targetProfit: '100%',
            targetDays: dte,
            note: 'Requires 100 shares of stock'
        };
    },
    
    /**
     * Generate Long Straddle trade specifications
     */
    generateLongStraddle(stockPrice, currentIV) {
        const dte = 45;
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        const strike = roundToStrike(stockPrice); // ATM
        const estimatedDebit = (stockPrice * currentIV / 100) * 0.20;
        
        return {
            type: 'Long Straddle',
            dte: dte,
            strikes: {
                call: strike,
                put: strike
            },
            estimatedDebit: Math.round(estimatedDebit * 100),
            maxProfit: Infinity,
            maxLoss: Math.round(estimatedDebit * 100),
            breakevens: {
                lower: strike - estimatedDebit,
                upper: strike + estimatedDebit
            },
            targetProfit: '100%+',
            targetDays: 30,
            note: 'Benefits from volatility expansion or large move'
        };
    },
    
    /**
     * Generate Calendar Spread trade specifications
     */
    generateCalendarSpread(stockPrice, currentIV) {
        const shortDte = 30;
        const longDte = 60;
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        const strike = roundToStrike(stockPrice); // ATM
        const shortPremium = (stockPrice * currentIV / 100) * 0.06;
        const longPremium = (stockPrice * currentIV / 100) * 0.10;
        const estimatedDebit = longPremium - shortPremium;
        
        return {
            type: 'Calendar Spread',
            dte: {
                short: shortDte,
                long: longDte
            },
            strikes: {
                both: strike
            },
            estimatedDebit: Math.round(estimatedDebit * 100),
            maxProfit: Math.round((shortPremium * 1.5) * 100),
            maxLoss: Math.round(estimatedDebit * 100),
            targetProfit: '50%',
            targetDays: shortDte,
            note: 'Benefits from time decay and rising IV'
        };
    },
    
    /**
     * Generate Butterfly Spread trade specifications
     */
    generateButterflySpread(stockPrice, currentIV) {
        const dte = 35;
        const roundToStrike = (price) => Math.round(price / 5) * 5;
        
        const atmStrike = roundToStrike(stockPrice);
        const wing = roundToStrike(stockPrice * 0.05); // 5% wings
        
        const lowerStrike = atmStrike - wing;
        const upperStrike = atmStrike + wing;
        
        const estimatedDebit = wing * 0.25;
        
        return {
            type: 'Iron Butterfly',
            dte: dte,
            strikes: {
                lowerWing: lowerStrike,
                body: atmStrike,
                upperWing: upperStrike
            },
            width: wing,
            estimatedDebit: Math.round(estimatedDebit * 100),
            maxProfit: Math.round((wing - estimatedDebit) * 100),
            maxLoss: Math.round(estimatedDebit * 100),
            breakevens: {
                lower: atmStrike - (wing - estimatedDebit),
                upper: atmStrike + (wing - estimatedDebit)
            },
            pop: 60,
            targetProfit: '50%',
            targetDays: 21,
            note: 'Neutral strategy - benefits from low movement'
        };
    },
    
    /**
     * Generate Debit Spread trade specifications (already exists, keeping here for completeness)
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
