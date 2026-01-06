/**
 * SIGNALS MODULE
 * Institutional-grade trading signals and algorithms
 */

const SignalsEngine = {
    signals: [],
    signalHistory: [],
    
    /**
     * Generate all trading signals
     */
    async generateAllSignals(stocks = OptionsData.ROBINHOOD_STOCKS) {
        console.log('🔄 Starting signals generation for', stocks.length, 'stocks...');
        this.signals = [];
        
        let processedCount = 0;
        let errorCount = 0;
        
        for (const symbol of stocks.slice(0, 50)) { // Limit to first 50 for performance
            try {
                const stockPrice = await OptionsData.getStockPrice(symbol);
                if (!stockPrice) {
                    console.log(`⚠️ No price for ${symbol}, skipping`);
                    continue;
                }
                
                const optionsChain = OptionsData.generateOptionsChain(symbol, stockPrice);
                if (!optionsChain || optionsChain.length === 0) {
                    console.log(`⚠️ No options chain for ${symbol}, skipping`);
                    continue;
                }
                
                // Run all signal detectors
                this.detectUnusualActivity(symbol, optionsChain, stockPrice);
                this.detectVolatilitySignals(symbol, optionsChain, stockPrice);
                this.detectEarningsPlays(symbol, optionsChain, stockPrice);
                this.detectTechnicalSignals(symbol, optionsChain, stockPrice);
                this.detectFlowSignals(symbol, optionsChain, stockPrice);
                this.detectGreekOpportunities(symbol, optionsChain, stockPrice);
                this.detectArbitrageOpportunities(symbol, optionsChain, stockPrice);
                
                processedCount++;
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Error generating signals for ${symbol}:`, error);
            }
        }
        
        // Sort signals by strength
        this.signals.sort((a, b) => b.strength - a.strength);
        
        console.log(`✅ Signals generation complete:`);
        console.log(`   - Processed: ${processedCount} stocks`);
        console.log(`   - Errors: ${errorCount}`);
        console.log(`   - Total signals: ${this.signals.length}`);
        console.log(`   - Unusual: ${this.getSignalsByType('unusual').length}`);
        console.log(`   - Volatility: ${this.getSignalsByType('volatility').length}`);
        console.log(`   - Earnings: ${this.getSignalsByType('earnings').length}`);
        console.log(`   - Technical: ${this.getSignalsByType('technical').length}`);
        
        return this.signals;
    },
    
    /**
     * 1. UNUSUAL OPTIONS ACTIVITY DETECTION
     */
    detectUnusualActivity(symbol, optionsChain, stockPrice) {
        for (const option of optionsChain) {
            const volOIRatio = option.volume / option.openInterest;
            
            // Whale Trade Detection (>$100K premium)
            const premium = option.last * option.volume * 100;
            if (premium > 100000) {
                this.addSignal({
                    type: 'unusual',
                    subtype: 'whale-trade',
                    symbol,
                    description: `🐋 Whale Trade: ${option.volume} contracts at $${option.strike}`,
                    strength: 0.9,
                    details: {
                        option,
                        premium,
                        action: option.type === 'call' ? 'Bullish' : 'Bearish'
                    }
                });
            }
            
            // Unusual Volume (>10x normal)
            if (volOIRatio > 10 && option.volume > 500) {
                this.addSignal({
                    type: 'unusual',
                    subtype: 'volume-spike',
                    symbol,
                    description: `📊 Unusual Volume: ${option.volume} vs ${option.openInterest} OI`,
                    strength: 0.75,
                    details: {
                        option,
                        ratio: volOIRatio.toFixed(2),
                        action: option.delta > 0 ? 'Bullish' : 'Bearish'
                    }
                });
            }
            
            // Sweep Order Detection (high volume, near bid/ask)
            const spread = (option.ask - option.bid) / option.last;
            if (option.volume > 1000 && spread < 0.05) {
                this.addSignal({
                    type: 'unusual',
                    subtype: 'sweep-order',
                    symbol,
                    description: `⚡ Sweep Order: Aggressive ${option.type} buying`,
                    strength: 0.85,
                    details: {
                        option,
                        action: option.type === 'call' ? 'Bullish' : 'Bearish'
                    }
                });
            }
        }
    },
    
    /**
     * 2. VOLATILITY SIGNALS
     */
    detectVolatilitySignals(symbol, optionsChain, stockPrice) {
        // Calculate average IV
        const avgIV = optionsChain.reduce((sum, opt) => sum + opt.iv, 0) / optionsChain.length;
        const ivRank = OptionsData.calculateIVRank(avgIV / 100, symbol);
        
        // IV Expansion Signal
        if (ivRank > 75) {
            this.addSignal({
                type: 'volatility',
                subtype: 'iv-expansion',
                symbol,
                description: `🔥 High IV Rank: ${ivRank.toFixed(0)}% - Premium Selling Opportunity`,
                strength: 0.7,
                details: {
                    ivRank,
                    avgIV,
                    action: 'Sell Premium (Credit Spreads, Iron Condors)'
                }
            });
        }
        
        // IV Crush Setup (before earnings)
        const earningsStocks = OptionsData.getEarningsCalendar();
        const hasEarnings = earningsStocks.some(e => e.symbol === symbol);
        
        if (hasEarnings && avgIV > 40) {
            this.addSignal({
                type: 'volatility',
                subtype: 'iv-crush-setup',
                symbol,
                description: `📅 Pre-Earnings IV: ${avgIV.toFixed(1)}% - Crush Expected`,
                strength: 0.65,
                details: {
                    avgIV,
                    action: 'Sell premium before earnings, buy after'
                }
            });
        }
        
        // Volatility Skew
        const skew = OptionsCalculations.calculateVolatilitySkew(optionsChain, optionsChain[0].expiration);
        if (skew && Math.abs(skew.skew) > 5) {
            this.addSignal({
                type: 'volatility',
                subtype: 'skew',
                symbol,
                description: `📐 Volatility Skew: ${skew.interpretation}`,
                strength: 0.6,
                details: {
                    skew: skew.skew,
                    action: skew.skew > 0 ? 'Market Fear - Consider Bullish Plays' : 'Market Greed - Consider Bearish Plays'
                }
            });
        }
    },
    
    /**
     * 3. EARNINGS PLAYS
     */
    detectEarningsPlays(symbol, optionsChain, stockPrice) {
        const earningsStocks = OptionsData.getEarningsCalendar();
        const earnings = earningsStocks.find(e => e.symbol === symbol);
        
        if (!earnings) return;
        
        const daysToEarnings = Math.floor((earnings.date - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysToEarnings <= 7 && daysToEarnings >= 0) {
            // Find ATM straddle
            const atmOptions = optionsChain.filter(opt => 
                Math.abs(opt.strike - stockPrice) < stockPrice * 0.02
            );
            
            const atmCall = atmOptions.find(opt => opt.type === 'call');
            const atmPut = atmOptions.find(opt => opt.type === 'put');
            
            if (atmCall && atmPut) {
                const expectedMove = OptionsCalculations.calculateExpectedMove(
                    atmCall.last, atmPut.last, stockPrice
                );
                
                this.addSignal({
                    type: 'earnings',
                    subtype: 'straddle-play',
                    symbol,
                    description: `📊 Earnings in ${daysToEarnings}d - Expected Move: ${expectedMove.percent.toFixed(1)}%`,
                    strength: 0.75,
                    details: {
                        daysToEarnings,
                        expectedMove,
                        action: 'Long Straddle if expecting >10% move, Iron Condor if expecting <5% move'
                    }
                });
            }
        }
    },
    
    /**
     * 4. TECHNICAL SIGNALS
     */
    detectTechnicalSignals(symbol, optionsChain, stockPrice) {
        // Breakout Detection (simulated - in production use real technical analysis)
        const breakoutLevel = Math.round(stockPrice * 1.05);
        const resistanceOptions = optionsChain.filter(opt => 
            opt.strike === breakoutLevel && opt.type === 'call' && opt.dte <= 30
        );
        
        if (resistanceOptions.length > 0 && resistanceOptions[0].volume > 1000) {
            this.addSignal({
                type: 'technical',
                subtype: 'breakout-setup',
                symbol,
                description: `🚀 Breakout Setup: $${breakoutLevel} Resistance Level`,
                strength: 0.65,
                details: {
                    level: breakoutLevel,
                    action: `Buy ${breakoutLevel} calls if price breaks above`
                }
            });
        }
        
        // Support Level Play
        const supportLevel = Math.round(stockPrice * 0.95);
        const supportOptions = optionsChain.filter(opt => 
            opt.strike === supportLevel && opt.type === 'put' && opt.dte <= 30
        );
        
        if (supportOptions.length > 0 && supportOptions[0].volume > 1000) {
            this.addSignal({
                type: 'technical',
                subtype: 'support-level',
                symbol,
                description: `🛡️ Support Level: $${supportLevel} - Sell Puts Here`,
                strength: 0.6,
                details: {
                    level: supportLevel,
                    action: `Sell ${supportLevel} puts for premium collection`
                }
            });
        }
    },
    
    /**
     * 5. FLOW ANALYSIS SIGNALS
     */
    detectFlowSignals(symbol, optionsChain, stockPrice) {
        const putCallRatio = OptionsCalculations.calculatePutCallRatio(optionsChain);
        
        // Extreme bullish flow
        if (putCallRatio.volumeRatio < 0.5) {
            this.addSignal({
                type: 'flow',
                subtype: 'bullish-flow',
                symbol,
                description: `📈 Bullish Flow: P/C Ratio ${putCallRatio.volumeRatio.toFixed(2)}`,
                strength: 0.7,
                details: {
                    ratio: putCallRatio.volumeRatio,
                    action: 'Strong call buying - Consider bullish positions'
                }
            });
        }
        
        // Extreme bearish flow
        if (putCallRatio.volumeRatio > 2.0) {
            this.addSignal({
                type: 'flow',
                subtype: 'bearish-flow',
                symbol,
                description: `📉 Bearish Flow: P/C Ratio ${putCallRatio.volumeRatio.toFixed(2)}`,
                strength: 0.7,
                details: {
                    ratio: putCallRatio.volumeRatio,
                    action: 'Strong put buying - Consider bearish positions'
                }
            });
        }
        
        // Max Pain Analysis
        const maxPain = OptionsCalculations.calculateMaxPain(optionsChain, optionsChain[0].expiration);
        if (maxPain && Math.abs(maxPain - stockPrice) / stockPrice > 0.05) {
            this.addSignal({
                type: 'flow',
                subtype: 'max-pain',
                symbol,
                description: `🎯 Max Pain: $${maxPain} (Current: $${stockPrice.toFixed(2)})`,
                strength: 0.55,
                details: {
                    maxPain,
                    currentPrice: stockPrice,
                    action: `Expect price drift toward $${maxPain} by expiration`
                }
            });
        }
    },
    
    /**
     * 6. GREEK-BASED OPPORTUNITIES
     */
    detectGreekOpportunities(symbol, optionsChain, stockPrice) {
        // High Gamma Opportunities
        const highGamma = optionsChain.filter(opt => 
            opt.gamma > 0.05 && opt.dte <= 7 && Math.abs(opt.strike - stockPrice) / stockPrice < 0.03
        );
        
        if (highGamma.length > 3) {
            this.addSignal({
                type: 'greeks',
                subtype: 'high-gamma',
                symbol,
                description: `🚀 High Gamma Zone: Quick price moves expected`,
                strength: 0.65,
                details: {
                    strikeCount: highGamma.length,
                    action: 'Buy options for leverage, watch for gamma squeeze'
                }
            });
        }
        
        // Theta Decay Plays
        const highTheta = optionsChain.filter(opt => 
            Math.abs(opt.theta) > 0.15 && opt.dte >= 7 && opt.dte <= 30
        );
        
        if (highTheta.length > 5) {
            this.addSignal({
                type: 'greeks',
                subtype: 'theta-decay',
                symbol,
                description: `⏰ High Theta Decay: Premium selling opportunity`,
                strength: 0.6,
                details: {
                    options: highTheta.length,
                    action: 'Sell credit spreads to collect theta'
                }
            });
        }
        
        // Gamma Squeeze Detection
        const gammaSqueeze = OptionsCalculations.detectGammaSqueeze(optionsChain, stockPrice);
        if (gammaSqueeze.risk === 'HIGH') {
            this.addSignal({
                type: 'greeks',
                subtype: 'gamma-squeeze',
                symbol,
                description: `💥 Gamma Squeeze Risk: HIGH - Explosive moves possible`,
                strength: 0.8,
                details: {
                    exposure: gammaSqueeze.exposure,
                    action: 'Buy ATM calls/puts for potential squeeze'
                }
            });
        }
    },
    
    /**
     * 7. ARBITRAGE OPPORTUNITIES
     */
    detectArbitrageOpportunities(symbol, optionsChain, stockPrice) {
        // Put-Call Parity Violations
        for (let i = 0; i < optionsChain.length; i++) {
            const option = optionsChain[i];
            if (option.type !== 'call') continue;
            
            const matchingPut = optionsChain.find(opt => 
                opt.type === 'put' && 
                opt.strike === option.strike && 
                opt.expiration === option.expiration
            );
            
            if (matchingPut) {
                // Put-Call Parity: C - P = S - K*e^(-rt)
                const t = option.dte / 365;
                const r = 0.05;
                const theoreticalDiff = stockPrice - option.strike * Math.exp(-r * t);
                const actualDiff = option.last - matchingPut.last;
                const discrepancy = Math.abs(actualDiff - theoreticalDiff);
                
                if (discrepancy > stockPrice * 0.02) { // >2% discrepancy
                    this.addSignal({
                        type: 'arbitrage',
                        subtype: 'put-call-parity',
                        symbol,
                        description: `💰 Arbitrage: Put-Call parity violation at $${option.strike}`,
                        strength: 0.7,
                        details: {
                            strike: option.strike,
                            discrepancy,
                            action: 'Synthetic position opportunity'
                        }
                    });
                }
            }
        }
    },
    
    /**
     * Add signal to the list
     */
    addSignal(signal) {
        signal.timestamp = Date.now();
        signal.id = `${signal.symbol}-${signal.type}-${Date.now()}`;
        this.signals.push(signal);
        this.signalHistory.push(signal);
    },
    
    /**
     * Get signals by type
     */
    getSignalsByType(type) {
        return this.signals.filter(s => s.type === type);
    },
    
    /**
     * Get top signals
     */
    getTopSignals(count = 10) {
        return this.signals.slice(0, count);
    },
    
    /**
     * Filter signals
     */
    filterSignals(filters) {
        let filtered = [...this.signals];
        
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(s => s.type === filters.type);
        }
        
        if (filters.minStrength) {
            filtered = filtered.filter(s => s.strength >= filters.minStrength);
        }
        
        if (filters.symbol) {
            filtered = filtered.filter(s => 
                s.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
            );
        }
        
        return filtered;
    }
};

/**
 * Export signals engine
 */
window.SignalsEngine = SignalsEngine;
