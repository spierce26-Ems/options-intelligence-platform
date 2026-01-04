/**
 * CUSTOM TICKER ANALYZER
 * Deep-dive analysis for any specific ticker
 */

const TickerAnalyzer = {
    currentTicker: null,
    analysisData: null,
    
    /**
     * Analyze a specific ticker
     */
    async analyzeTicker(symbol) {
        console.log(`🔍 Analyzing ${symbol}...`);
        this.currentTicker = symbol.toUpperCase();
        
        try {
            // Show loading
            this.showLoading();
            
            // Fetch data
            const stockData = await RealTimeData.getStockPrice(this.currentTicker);
            const optionsData = await RealTimeData.getOptionsChain(this.currentTicker);
            
            // Generate comprehensive analysis
            this.analysisData = {
                symbol: this.currentTicker,
                stock: stockData,
                options: optionsData.options,
                dataSource: optionsData.source,
                timestamp: Date.now(),
                analysis: await this.generateAnalysis(stockData, optionsData.options)
            };
            
            // Display results
            this.displayAnalysis();
            
            return this.analysisData;
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(error.message);
            return null;
        }
    },
    
    /**
     * Generate comprehensive analysis
     */
    async generateAnalysis(stockData, options) {
        const analysis = {
            overview: this.analyzeOverview(stockData, options),
            bestOptions: this.findBestOptions(options, stockData.price),
            greeksAnalysis: this.analyzeGreeks(options),
            volatilityAnalysis: this.analyzeVolatility(options),
            flowAnalysis: this.analyzeFlow(options),
            strategies: this.suggestStrategies(options, stockData.price),
            riskMetrics: this.calculateRiskMetrics(options, stockData.price),
            recommendations: []
        };
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        return analysis;
    },
    
    /**
     * Analyze overview metrics
     */
    analyzeOverview(stockData, options) {
        const totalVolume = options.reduce((sum, opt) => sum + opt.volume, 0);
        const totalOI = options.reduce((sum, opt) => sum + opt.openInterest, 0);
        const avgIV = options.reduce((sum, opt) => sum + opt.iv, 0) / options.length;
        
        const calls = options.filter(opt => opt.type === 'call');
        const puts = options.filter(opt => opt.type === 'put');
        
        const callVolume = calls.reduce((sum, opt) => sum + opt.volume, 0);
        const putVolume = puts.reduce((sum, opt) => sum + opt.volume, 0);
        
        return {
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
            totalOptionsVolume: totalVolume,
            totalOpenInterest: totalOI,
            avgImpliedVolatility: avgIV,
            putCallRatio: putVolume / callVolume,
            sentiment: putVolume > callVolume ? 'Bearish' : 'Bullish',
            optionsCount: options.length,
            dataSource: stockData.source
        };
    },
    
    /**
     * Find best options across all criteria
     */
    findBestOptions(options, stockPrice) {
        const scored = options.map(opt => ({
            ...opt,
            score: this.scoreOption(opt, stockPrice)
        }));
        
        // Sort by score
        scored.sort((a, b) => b.score - a.score);
        
        return {
            topOverall: scored.slice(0, 10),
            topCalls: scored.filter(opt => opt.type === 'call').slice(0, 5),
            topPuts: scored.filter(opt => opt.type === 'put').slice(0, 5),
            cheapest: scored.filter(opt => opt.last < 5).slice(0, 5),
            mostLiquid: scored.sort((a, b) => b.volume - a.volume).slice(0, 5),
            highestIV: scored.sort((a, b) => b.iv - a.iv).slice(0, 5)
        };
    },
    
    /**
     * Score an option (similar to Hot Picks)
     */
    scoreOption(option, stockPrice) {
        let score = 0;
        
        // Liquidity
        if (option.volume > 1000) score += 15;
        else if (option.volume > 500) score += 10;
        else if (option.volume > 100) score += 5;
        
        // IV
        if (option.iv >= 40 && option.iv <= 80) score += 15;
        else if (option.iv >= 30) score += 10;
        
        // Delta
        const absDelta = Math.abs(option.delta);
        if (absDelta >= 0.4 && absDelta <= 0.6) score += 15;
        else if (absDelta >= 0.25) score += 10;
        
        // Greeks
        if (option.gamma > 0.02) score += 10;
        if (option.vega > 0.1) score += 10;
        
        // Moneyness
        const moneyness = option.type === 'call' ? 
            stockPrice / option.strike : 
            option.strike / stockPrice;
        if (moneyness >= 0.95 && moneyness <= 1.05) score += 15;
        
        // Cost
        if (option.last < 5) score += 10;
        else if (option.last < 10) score += 5;
        
        return score;
    },
    
    /**
     * Analyze Greeks
     */
    analyzeGreeks(options) {
        const highDelta = options.filter(opt => Math.abs(opt.delta) > 0.6);
        const highGamma = options.filter(opt => opt.gamma > 0.03);
        const highTheta = options.filter(opt => Math.abs(opt.theta) > 0.15);
        const highVega = options.filter(opt => opt.vega > 0.2);
        
        return {
            deltaOpportunities: highDelta.length,
            gammaPlays: highGamma.length,
            thetaDecay: highTheta.length,
            vegaPlays: highVega.length,
            topDelta: highDelta.slice(0, 5),
            topGamma: highGamma.slice(0, 5),
            topTheta: highTheta.slice(0, 5),
            topVega: highVega.slice(0, 5)
        };
    },
    
    /**
     * Analyze volatility
     */
    analyzeVolatility(options) {
        const ivs = options.map(opt => opt.iv);
        const avgIV = ivs.reduce((a, b) => a + b, 0) / ivs.length;
        const maxIV = Math.max(...ivs);
        const minIV = Math.min(...ivs);
        
        const ivRank = ((avgIV - minIV) / (maxIV - minIV)) * 100;
        
        return {
            averageIV: avgIV,
            maxIV: maxIV,
            minIV: minIV,
            ivRank: ivRank,
            ivSkew: this.calculateIVSkew(options),
            recommendation: avgIV > 60 ? 'Sell Premium' : avgIV < 30 ? 'Buy Premium' : 'Neutral'
        };
    },
    
    /**
     * Calculate IV skew
     */
    calculateIVSkew(options) {
        const calls = options.filter(opt => opt.type === 'call');
        const puts = options.filter(opt => opt.type === 'put');
        
        const avgCallIV = calls.reduce((sum, opt) => sum + opt.iv, 0) / calls.length;
        const avgPutIV = puts.reduce((sum, opt) => sum + opt.iv, 0) / puts.length;
        
        const skew = avgPutIV - avgCallIV;
        
        return {
            skew: skew,
            interpretation: skew > 5 ? 'Put Skew (Fear)' : skew < -5 ? 'Call Skew (Greed)' : 'Neutral'
        };
    },
    
    /**
     * Analyze flow
     */
    analyzeFlow(options) {
        const unusualVolume = options.filter(opt => opt.volume > opt.openInterest * 2);
        const whales = options.filter(opt => opt.last * opt.volume * 100 > 100000);
        
        const callVolume = options.filter(opt => opt.type === 'call')
            .reduce((sum, opt) => sum + opt.volume, 0);
        const putVolume = options.filter(opt => opt.type === 'put')
            .reduce((sum, opt) => sum + opt.volume, 0);
        
        return {
            unusualActivity: unusualVolume.length,
            whaleTrades: whales.length,
            callVolume: callVolume,
            putVolume: putVolume,
            putCallRatio: putVolume / callVolume,
            topUnusual: unusualVolume.slice(0, 10),
            topWhales: whales.slice(0, 10)
        };
    },
    
    /**
     * Suggest strategies
     */
    suggestStrategies(options, stockPrice) {
        const strategies = [];
        
        // Find good credit spread opportunities
        const creditSpread = this.findCreditSpread(options, stockPrice);
        if (creditSpread) strategies.push(creditSpread);
        
        // Find iron condor opportunities
        const ironCondor = this.findIronCondor(options, stockPrice);
        if (ironCondor) strategies.push(ironCondor);
        
        // Find straddle opportunities
        const straddle = this.findStraddle(options, stockPrice);
        if (straddle) strategies.push(straddle);
        
        return strategies;
    },
    
    /**
     * Find credit spread
     */
    findCreditSpread(options, stockPrice) {
        const puts = options.filter(opt => 
            opt.type === 'put' && 
            opt.dte >= 30 && opt.dte <= 45 &&
            Math.abs(opt.delta) >= 0.25 && Math.abs(opt.delta) <= 0.35
        );
        
        if (puts.length < 2) return null;
        
        const shortPut = puts[0];
        const longPut = puts.find(opt => opt.strike < shortPut.strike);
        
        if (!longPut) return null;
        
        const credit = shortPut.bid - longPut.ask;
        const maxLoss = (shortPut.strike - longPut.strike) - credit;
        
        return {
            type: 'Bull Put Spread',
            strikes: `${shortPut.strike}/${longPut.strike}`,
            credit: credit * 100,
            maxLoss: maxLoss * 100,
            pop: 70,
            dte: shortPut.dte
        };
    },
    
    /**
     * Find iron condor
     */
    findIronCondor(options, stockPrice) {
        // Implementation similar to findCreditSpread
        return null; // Placeholder
    },
    
    /**
     * Find straddle
     */
    findStraddle(options, stockPrice) {
        const atmOptions = options.filter(opt => 
            Math.abs(opt.strike - stockPrice) < stockPrice * 0.02 &&
            opt.dte >= 7 && opt.dte <= 30
        );
        
        const call = atmOptions.find(opt => opt.type === 'call');
        const put = atmOptions.find(opt => opt.type === 'put');
        
        if (!call || !put) return null;
        
        const cost = (call.ask + put.ask) * 100;
        const expectedMove = ((call.last + put.last) / stockPrice) * 100;
        
        return {
            type: 'Long Straddle',
            strike: call.strike,
            cost: cost,
            expectedMove: expectedMove,
            pop: expectedMove > 8 ? 65 : 45,
            dte: call.dte
        };
    },
    
    /**
     * Calculate risk metrics
     */
    calculateRiskMetrics(options, stockPrice) {
        const maxPain = this.calculateMaxPain(options);
        const gammaExposure = this.calculateGammaExposure(options, stockPrice);
        
        return {
            maxPain: maxPain,
            distanceFromMaxPain: ((stockPrice - maxPain) / stockPrice) * 100,
            gammaExposure: gammaExposure,
            gammaSq ueeze: gammaExposure > 1000 ? 'HIGH' : 'LOW'
        };
    },
    
    /**
     * Calculate max pain
     */
    calculateMaxPain(options) {
        const strikes = [...new Set(options.map(opt => opt.strike))].sort((a, b) => a - b);
        
        let maxPainStrike = strikes[Math.floor(strikes.length / 2)];
        let minPain = Infinity;
        
        for (const strike of strikes) {
            let pain = 0;
            
            for (const option of options) {
                if (option.type === 'call' && strike > option.strike) {
                    pain += (strike - option.strike) * option.openInterest;
                } else if (option.type === 'put' && strike < option.strike) {
                    pain += (option.strike - strike) * option.openInterest;
                }
            }
            
            if (pain < minPain) {
                minPain = pain;
                maxPainStrike = strike;
            }
        }
        
        return maxPainStrike;
    },
    
    /**
     * Calculate gamma exposure
     */
    calculateGammaExposure(options, stockPrice) {
        const nearOptions = options.filter(opt => 
            Math.abs(opt.strike - stockPrice) / stockPrice < 0.05
        );
        
        return nearOptions.reduce((sum, opt) => 
            sum + opt.gamma * opt.openInterest, 0
        );
    },
    
    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recs = [];
        
        // Based on IV
        if (analysis.volatilityAnalysis.averageIV > 60) {
            recs.push({
                type: 'SELL',
                reason: 'High IV - Sell premium strategies recommended',
                confidence: 'HIGH'
            });
        } else if (analysis.volatilityAnalysis.averageIV < 30) {
            recs.push({
                type: 'BUY',
                reason: 'Low IV - Buy premium strategies recommended',
                confidence: 'MEDIUM'
            });
        }
        
        // Based on flow
        if (analysis.flowAnalysis.putCallRatio > 1.5) {
            recs.push({
                type: 'BULLISH',
                reason: 'Heavy put buying may indicate fear or hedging',
                confidence: 'MEDIUM'
            });
        } else if (analysis.flowAnalysis.putCallRatio < 0.7) {
            recs.push({
                type: 'BEARISH',
                reason: 'Heavy call buying may indicate euphoria',
                confidence: 'MEDIUM'
            });
        }
        
        // Based on gamma
        if (analysis.riskMetrics.gammaExposure > 1000) {
            recs.push({
                type: 'VOLATILITY',
                reason: 'High gamma exposure - expect volatile moves',
                confidence: 'HIGH'
            });
        }
        
        return recs;
    },
    
    /**
     * Display analysis
     */
    displayAnalysis() {
        const container = document.getElementById('tickerAnalysisResults');
        if (!container) return;
        
        const data = this.analysisData;
        
        container.innerHTML = `
            <div class="analysis-complete">
                <h2>${data.symbol} Complete Analysis</h2>
                <p class="data-source">Data Source: ${data.dataSource} ${data.stock.warning ? '⚠️' : '✅'}</p>
                
                <!-- Overview -->
                <div class="analysis-section">
                    <h3>📊 Overview</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <span class="label">Current Price</span>
                            <span class="value">${data.stock.price.toFixed(2)}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Change</span>
                            <span class="value ${data.stock.change >= 0 ? 'positive' : 'negative'}">
                                ${data.stock.change >= 0 ? '+' : ''}${data.stock.changePercent?.toFixed(2) || 0}%
                            </span>
                        </div>
                        <div class="metric">
                            <span class="label">Avg IV</span>
                            <span class="value">${data.analysis.overview.avgImpliedVolatility.toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="label">P/C Ratio</span>
                            <span class="value">${data.analysis.overview.putCallRatio.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Best Options -->
                <div class="analysis-section">
                    <h3>🔥 Top 10 Options</h3>
                    <div class="options-table">
                        ${this.renderOptionsTable(data.analysis.bestOptions.topOverall)}
                    </div>
                </div>
                
                <!-- Recommendations -->
                <div class="analysis-section">
                    <h3>💡 Recommendations</h3>
                    ${data.analysis.recommendations.map(rec => `
                        <div class="recommendation ${rec.type.toLowerCase()}">
                            <strong>${rec.type}:</strong> ${rec.reason}
                            <span class="confidence">${rec.confidence}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Render options table
     */
    renderOptionsTable(options) {
        return `
            <table>
                <thead>
                    <tr>
                        <th>Strike</th>
                        <th>Type</th>
                        <th>Exp</th>
                        <th>Price</th>
                        <th>IV</th>
                        <th>Volume</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${options.map(opt => `
                        <tr>
                            <td>$${opt.strike}</td>
                            <td><span class="badge ${opt.type}">${opt.type.toUpperCase()}</span></td>
                            <td>${opt.dte}d</td>
                            <td>$${opt.last.toFixed(2)}</td>
                            <td>${opt.iv.toFixed(1)}%</td>
                            <td>${opt.volume.toLocaleString()}</td>
                            <td><strong>${opt.score}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * Show loading
     */
    showLoading() {
        const container = document.getElementById('tickerAnalysisResults');
        if (container) {
            container.innerHTML = `
                <div class="loading-ios">
                    <div class="spinner-ios"></div>
                    <p>Analyzing ${this.currentTicker}...</p>
                </div>
            `;
        }
    },
    
    /**
     * Show error
     */
    showError(message) {
        const container = document.getElementById('tickerAnalysisResults');
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
};

// Make globally available
window.TickerAnalyzer = TickerAnalyzer;

/**
 * Search ticker function
 */
async function searchTicker() {
    const input = document.getElementById('tickerSearchInput');
    const symbol = input.value.trim().toUpperCase();
    
    if (!symbol) {
        alert('Please enter a ticker symbol');
        return;
    }
    
    await TickerAnalyzer.analyzeTicker(symbol);
}

// Make globally available
window.searchTicker = searchTicker;
