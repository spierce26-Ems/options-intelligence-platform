/**
 * SCANNER MODULE
 * Options chain scanner and screener functionality
 */

const Scanner = {
    scanResults: [],
    isScanning: false,
    
    /**
     * Scan options chains based on filters
     */
    async scan(filters = {}) {
        if (this.isScanning) {
            console.log('Scan already in progress...');
            return;
        }
        
        this.isScanning = true;
        this.scanResults = [];
        
        const stocks = OptionsData.ROBINHOOD_STOCKS.slice(0, 50); // Limit for performance
        let scanned = 0;
        
        for (const symbol of stocks) {
            try {
                const stockPrice = await OptionsData.getStockPrice(symbol);
                if (!stockPrice) continue;
                
                const optionsChain = OptionsData.generateOptionsChain(symbol, stockPrice);
                
                // Apply filters and score options
                for (const option of optionsChain) {
                    if (this.matchesFilters(option, filters, stockPrice)) {
                        const score = OptionsCalculations.calculatePositionScore(
                            option, 
                            SignalsEngine.signals.filter(s => s.symbol === symbol)
                        );
                        
                        this.scanResults.push({
                            ...option,
                            stockPrice,
                            score,
                            signal: this.getTopSignal(symbol, option)
                        });
                    }
                }
                
                scanned++;
                
                // Update progress
                if (scanned % 5 === 0) {
                    console.log(`Scanned ${scanned}/${stocks.length} stocks...`);
                    updateScanProgress(scanned, stocks.length);
                }
                
            } catch (error) {
                console.log(`Error scanning ${symbol}:`, error);
            }
        }
        
        // Sort by score
        this.scanResults.sort((a, b) => b.score - a.score);
        
        this.isScanning = false;
        return this.scanResults;
    },
    
    /**
     * Check if option matches filters
     */
    matchesFilters(option, filters, stockPrice) {
        // Volume filter
        if (filters.minVolume && option.volume < filters.minVolume) {
            return false;
        }
        
        // Open Interest filter
        if (filters.minOI && option.openInterest < filters.minOI) {
            return false;
        }
        
        // IV Rank filter
        if (filters.ivRank && filters.ivRank !== 'all') {
            const ivRank = OptionsData.calculateIVRank(option.iv / 100, option.symbol);
            if (filters.ivRank === 'high' && ivRank < 75) return false;
            if (filters.ivRank === 'medium' && (ivRank < 50 || ivRank >= 75)) return false;
            if (filters.ivRank === 'low' && ivRank >= 50) return false;
        }
        
        // DTE filter
        if (filters.dteFilter && filters.dteFilter !== 'all') {
            if (filters.dteFilter === '0-7' && (option.dte < 0 || option.dte > 7)) return false;
            if (filters.dteFilter === '8-30' && (option.dte < 8 || option.dte > 30)) return false;
            if (filters.dteFilter === '31-60' && (option.dte < 31 || option.dte > 60)) return false;
            if (filters.dteFilter === '60+' && option.dte < 60) return false;
        }
        
        // Option type filter
        if (filters.optionType && filters.optionType !== 'all') {
            if (filters.optionType === 'calls' && option.type !== 'call') return false;
            if (filters.optionType === 'puts' && option.type !== 'put') return false;
        }
        
        return true;
    },
    
    /**
     * Get top signal for a symbol/option
     */
    getTopSignal(symbol, option) {
        const signals = SignalsEngine.signals.filter(s => 
            s.symbol === symbol &&
            (s.details.option?.strike === option.strike || !s.details.option)
        );
        
        if (signals.length === 0) return 'None';
        
        return signals[0].subtype.replace(/-/g, ' ').toUpperCase();
    },
    
    /**
     * Find best strategies for each stock
     */
    async findBestStrategies(strategyType) {
        const strategies = [];
        const stocks = OptionsData.ROBINHOOD_STOCKS.slice(0, 30);
        
        for (const symbol of stocks) {
            try {
                const stockPrice = await OptionsData.getStockPrice(symbol);
                if (!stockPrice) continue;
                
                const optionsChain = OptionsData.generateOptionsChain(symbol, stockPrice);
                
                // Find optimal strategies based on type
                const strategyOpportunity = this.findStrategyOpportunity(
                    strategyType, 
                    optionsChain, 
                    stockPrice, 
                    symbol
                );
                
                if (strategyOpportunity) {
                    strategies.push(strategyOpportunity);
                }
                
            } catch (error) {
                console.log(`Error finding strategy for ${symbol}:`, error);
            }
        }
        
        // Sort by score
        strategies.sort((a, b) => b.score - a.score);
        
        return strategies;
    },
    
    /**
     * Find optimal strategy setup for a symbol
     */
    findStrategyOpportunity(strategyType, optionsChain, stockPrice, symbol) {
        switch (strategyType) {
            case 'credit-spread':
                return this.findCreditSpread(optionsChain, stockPrice, symbol);
            case 'iron-condor':
                return this.findIronCondor(optionsChain, stockPrice, symbol);
            case 'straddle':
                return this.findStraddle(optionsChain, stockPrice, symbol);
            case 'calendar-spread':
                return this.findCalendarSpread(optionsChain, stockPrice, symbol);
            case 'debit-spread':
                return this.findDebitSpread(optionsChain, stockPrice, symbol);
            case 'butterfly':
                return this.findButterfly(optionsChain, stockPrice, symbol);
            default:
                return null;
        }
    },
    
    /**
     * Find optimal credit spread
     */
    findCreditSpread(optionsChain, stockPrice, symbol) {
        // Look for 30-45 DTE options
        const options = optionsChain.filter(opt => opt.dte >= 30 && opt.dte <= 45);
        
        // Find puts around 0.30 delta (70% probability)
        const shortPuts = options.filter(opt => 
            opt.type === 'put' && 
            Math.abs(opt.delta) >= 0.25 && 
            Math.abs(opt.delta) <= 0.35
        );
        
        if (shortPuts.length === 0) return null;
        
        const shortPut = shortPuts[0];
        
        // Find long put 5-10 points lower
        const strikeWidth = stockPrice < 50 ? 2.5 : stockPrice < 100 ? 5 : 10;
        const longPut = options.find(opt => 
            opt.type === 'put' && 
            opt.strike === shortPut.strike - strikeWidth &&
            opt.expiration === shortPut.expiration
        );
        
        if (!longPut) return null;
        
        const credit = shortPut.bid - longPut.ask;
        const maxLoss = strikeWidth - credit;
        const pop = OptionsCalculations.calculatePOP('short-put', stockPrice, shortPut.strike, credit, 'put', shortPut.dte);
        
        return {
            symbol,
            strategy: 'Bull Put Spread',
            strikes: `${shortPut.strike}/${longPut.strike}`,
            maxProfit: credit * 100,
            maxLoss: maxLoss * 100,
            pop,
            dte: shortPut.dte,
            score: pop * 0.7 + (credit / strikeWidth) * 30
        };
    },
    
    /**
     * Find optimal iron condor
     */
    findIronCondor(optionsChain, stockPrice, symbol) {
        const options = optionsChain.filter(opt => opt.dte >= 30 && opt.dte <= 45);
        
        // Find puts and calls around 0.20-0.30 delta
        const shortPuts = options.filter(opt => 
            opt.type === 'put' && 
            Math.abs(opt.delta) >= 0.20 && 
            Math.abs(opt.delta) <= 0.30
        );
        
        const shortCalls = options.filter(opt => 
            opt.type === 'call' && 
            opt.delta >= 0.20 && 
            opt.delta <= 0.30
        );
        
        if (shortPuts.length === 0 || shortCalls.length === 0) return null;
        
        const shortPut = shortPuts[0];
        const shortCall = shortCalls[0];
        
        const strikeWidth = stockPrice < 50 ? 2.5 : 5;
        
        const longPut = options.find(opt => 
            opt.type === 'put' && 
            opt.strike === shortPut.strike - strikeWidth &&
            opt.expiration === shortPut.expiration
        );
        
        const longCall = options.find(opt => 
            opt.type === 'call' && 
            opt.strike === shortCall.strike + strikeWidth &&
            opt.expiration === shortCall.expiration
        );
        
        if (!longPut || !longCall) return null;
        
        const credit = (shortPut.bid + shortCall.bid) - (longPut.ask + longCall.ask);
        const maxLoss = strikeWidth - credit;
        const pop = 65 + (credit / strikeWidth) * 20; // Approximate
        
        return {
            symbol,
            strategy: 'Iron Condor',
            strikes: `${longPut.strike}/${shortPut.strike}/${shortCall.strike}/${longCall.strike}`,
            maxProfit: credit * 100,
            maxLoss: maxLoss * 100,
            pop,
            dte: shortPut.dte,
            score: pop * 0.6 + (credit / strikeWidth) * 40
        };
    },
    
    /**
     * Find optimal straddle
     */
    findStraddle(optionsChain, stockPrice, symbol) {
        // Look for earnings or high IV
        const avgIV = optionsChain.reduce((sum, opt) => sum + opt.iv, 0) / optionsChain.length;
        
        if (avgIV < 40) return null; // Need high IV for straddles
        
        // Find ATM options
        const atmOptions = optionsChain.filter(opt => 
            Math.abs(opt.strike - stockPrice) < stockPrice * 0.02 &&
            opt.dte >= 7 && opt.dte <= 30
        );
        
        const call = atmOptions.find(opt => opt.type === 'call');
        const put = atmOptions.find(opt => opt.type === 'put');
        
        if (!call || !put) return null;
        
        const cost = call.ask + put.ask;
        const expectedMove = OptionsCalculations.calculateExpectedMove(call.last, put.last, stockPrice);
        const pop = expectedMove.percent > 8 ? 70 : 45; // Higher POP if big move expected
        
        return {
            symbol,
            strategy: 'Long Straddle',
            strikes: `${call.strike}`,
            maxProfit: 'Unlimited',
            maxLoss: cost * 100,
            pop,
            dte: call.dte,
            score: avgIV * 0.5 + expectedMove.percent * 3
        };
    },
    
    /**
     * Find optimal calendar spread
     */
    findCalendarSpread(optionsChain, stockPrice, symbol) {
        // Find ATM strikes
        const atmStrike = Math.round(stockPrice / 5) * 5;
        
        // Short-term (7-14 DTE) and long-term (30-45 DTE)
        const shortTerm = optionsChain.find(opt => 
            opt.strike === atmStrike && 
            opt.type === 'call' && 
            opt.dte >= 7 && opt.dte <= 14
        );
        
        const longTerm = optionsChain.find(opt => 
            opt.strike === atmStrike && 
            opt.type === 'call' && 
            opt.dte >= 30 && opt.dte <= 45
        );
        
        if (!shortTerm || !longTerm) return null;
        
        const cost = longTerm.ask - shortTerm.bid;
        const maxProfit = shortTerm.last * 0.5; // Approximate
        
        return {
            symbol,
            strategy: 'Calendar Spread',
            strikes: `${atmStrike} (${shortTerm.dte}d/${longTerm.dte}d)`,
            maxProfit: maxProfit * 100,
            maxLoss: cost * 100,
            pop: 60,
            dte: shortTerm.dte,
            score: 60 + (maxProfit / cost) * 20
        };
    },
    
    /**
     * Find optimal debit spread
     */
    findDebitSpread(optionsChain, stockPrice, symbol) {
        const options = optionsChain.filter(opt => opt.dte >= 30 && opt.dte <= 60);
        
        // Find calls with 0.60-0.70 delta (bullish)
        const longCalls = options.filter(opt => 
            opt.type === 'call' && 
            opt.delta >= 0.60 && 
            opt.delta <= 0.70
        );
        
        if (longCalls.length === 0) return null;
        
        const longCall = longCalls[0];
        const strikeWidth = stockPrice < 50 ? 5 : 10;
        
        const shortCall = options.find(opt => 
            opt.type === 'call' && 
            opt.strike === longCall.strike + strikeWidth &&
            opt.expiration === longCall.expiration
        );
        
        if (!shortCall) return null;
        
        const cost = longCall.ask - shortCall.bid;
        const maxProfit = strikeWidth - cost;
        const pop = OptionsCalculations.calculatePOP('long-call', stockPrice, longCall.strike, cost, 'call', longCall.dte);
        
        return {
            symbol,
            strategy: 'Bull Call Spread',
            strikes: `${longCall.strike}/${shortCall.strike}`,
            maxProfit: maxProfit * 100,
            maxLoss: cost * 100,
            pop,
            dte: longCall.dte,
            score: pop * 0.7 + (maxProfit / cost) * 30
        };
    },
    
    /**
     * Find optimal butterfly
     */
    findButterfly(optionsChain, stockPrice, symbol) {
        const atmStrike = Math.round(stockPrice / 5) * 5;
        const strikeWidth = stockPrice < 50 ? 5 : 10;
        
        const options = optionsChain.filter(opt => 
            opt.dte >= 30 && opt.dte <= 45 && opt.type === 'call'
        );
        
        const lower = options.find(opt => opt.strike === atmStrike - strikeWidth);
        const middle = options.find(opt => opt.strike === atmStrike);
        const upper = options.find(opt => opt.strike === atmStrike + strikeWidth);
        
        if (!lower || !middle || !upper) return null;
        
        // Buy 1 lower, sell 2 middle, buy 1 upper
        const cost = lower.ask - (2 * middle.bid) + upper.ask;
        const maxProfit = strikeWidth - cost;
        
        return {
            symbol,
            strategy: 'Butterfly',
            strikes: `${lower.strike}/${middle.strike}/${upper.strike}`,
            maxProfit: maxProfit * 100,
            maxLoss: cost * 100,
            pop: 50,
            dte: middle.dte,
            score: 50 + (maxProfit / cost) * 25
        };
    }
};

/**
 * Helper function to update scan progress
 */
function updateScanProgress(current, total) {
    const percent = (current / total * 100).toFixed(0);
    console.log(`Scan progress: ${percent}%`);
    // Update UI if needed
}

/**
 * Export scanner
 */
window.Scanner = Scanner;
