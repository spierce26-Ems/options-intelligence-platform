/**
 * BACKTESTING ENGINE
 * Test IV Rank strategies on historical data
 * 
 * Core functionality:
 * 1. Run strategy on historical data
 * 2. Calculate performance metrics
 * 3. Generate detailed reports
 * 4. Validate edge before trading
 */

const BacktestEngine = {
    // Results cache
    cachedResults: {},
    
    /**
     * Run backtest for IV Rank strategy
     */
    async runBacktest(config = {}) {
        const {
            symbol = 'AAPL',
            startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), // 2 years ago
            endDate = new Date(),
            strategy = 'IV_RANK_MEAN_REVERSION',
            sellThreshold = 80,
            buyThreshold = 20,
            targetProfit = 0.50, // 50% of max profit
            maxHoldDays = 21,
            capitalPerTrade = 1000
        } = config;
        
        console.log(`📊 Running backtest: ${symbol} (${strategy})`);
        console.log(`   Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        console.log(`   Rules: SELL when IV Rank > ${sellThreshold}%, BUY when < ${buyThreshold}%`);
        
        const results = {
            symbol: symbol,
            strategy: strategy,
            config: config,
            trades: [],
            metrics: {},
            equity: [{ date: startDate, value: 10000 }], // Starting capital
            timestamp: new Date().toISOString()
        };
        
        try {
            // Generate historical IV data
            const historicalIV = await this.generateHistoricalData(symbol, startDate, endDate);
            
            // Run strategy through historical data
            let openPosition = null;
            let equity = 10000; // Starting capital
            
            for (let i = 0; i < historicalIV.length; i++) {
                const day = historicalIV[i];
                
                // Check if we have an open position
                if (openPosition) {
                    const daysHeld = i - openPosition.entryIndex;
                    const currentPnL = this.calculatePnL(openPosition, day, daysHeld);
                    
                    // Check exit criteria
                    const shouldExit = this.checkExitCriteria(
                        openPosition,
                        currentPnL,
                        daysHeld,
                        targetProfit,
                        maxHoldDays
                    );
                    
                    if (shouldExit.exit) {
                        // Close position
                        const trade = this.closePosition(
                            openPosition,
                            day,
                            currentPnL,
                            daysHeld,
                            shouldExit.reason
                        );
                        
                        results.trades.push(trade);
                        equity += trade.pnl;
                        results.equity.push({
                            date: day.date,
                            value: equity
                        });
                        
                        openPosition = null;
                    }
                }
                // Look for new entry if no open position
                else {
                    const signal = IVRankEngine.generateSignal(
                        symbol,
                        day.ivRank,
                        day.iv,
                        day.price
                    );
                    
                    // Open position if signal meets criteria
                    if (signal && signal.action !== 'WAIT' && signal.confidence >= 60) {
                        openPosition = {
                            symbol: symbol,
                            entryDate: day.date,
                            entryIndex: i,
                            entryIV: day.iv,
                            entryIVRank: day.ivRank,
                            entryPrice: day.price,
                            action: signal.action,
                            strategy: signal.strategy,
                            trade: signal.trade,
                            capital: capitalPerTrade,
                            confidence: signal.confidence
                        };
                        
                        console.log(`   📍 Entry: ${day.date} - ${signal.action} ${signal.strategy} @ IV Rank ${day.ivRank}%`);
                    }
                }
            }
            
            // Close any open position at end of backtest
            if (openPosition) {
                const lastDay = historicalIV[historicalIV.length - 1];
                const daysHeld = historicalIV.length - 1 - openPosition.entryIndex;
                const currentPnL = this.calculatePnL(openPosition, lastDay, daysHeld);
                
                const trade = this.closePosition(
                    openPosition,
                    lastDay,
                    currentPnL,
                    daysHeld,
                    'BACKTEST_END'
                );
                
                results.trades.push(trade);
                equity += trade.pnl;
            }
            
            // Calculate performance metrics
            results.metrics = this.calculateMetrics(results.trades, results.equity);
            
            // Cache results
            this.cachedResults[`${symbol}_${strategy}`] = results;
            
            console.log(`✅ Backtest complete: ${results.trades.length} trades, ${results.metrics.winRate.toFixed(1)}% win rate`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Backtest error:', error);
            return null;
        }
    },
    
    /**
     * Generate historical data for backtesting
     * Now uses REAL data from Massive.com API when available
     */
    async generateHistoricalData(symbol, startDate, endDate) {
        console.log(`   📥 Fetching historical data for ${symbol}...`);
        
        // Try to get REAL data from Massive.com first
        if (window.MassiveHistoricalData && MassiveHistoricalData.isConfigured()) {
            console.log(`   🌐 Attempting to fetch REAL data from Massive.com API...`);
            
            const realData = await MassiveHistoricalData.buildHistoricalDataset(symbol, startDate, endDate);
            
            if (realData && realData.length > 0) {
                console.log(`   ✅✅✅ SUCCESS: Got ${realData.length} days of REAL market data from Massive.com`);
                console.log(`   📊 DATA SOURCE: REAL MARKET DATA`);
                return realData;
            } else {
                console.warn(`   ❌ REAL DATA FAILED: Could not fetch from Massive.com API`);
                console.warn(`   ⚠️⚠️⚠️ FALLING BACK TO SIMULATED DATA - RESULTS WILL BE UNREALISTIC`);
            }
        } else {
            console.error(`   ❌ Massive.com API NOT CONFIGURED`);
            console.warn(`   ⚠️⚠️⚠️ USING SIMULATED DATA - RESULTS ARE NOT REAL`);
        }
        
        // Fallback to simulated data
        console.log(`   🎭 DATA SOURCE: SIMULATED (FAKE) DATA`);
        return this.generateSimulatedData(symbol, startDate, endDate);
    },
    
    /**
     * Generate simulated data (fallback when API not available)
     */
    async generateSimulatedData(symbol, startDate, endDate) {
        const data = [];
        const days = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000));
        
        console.log(`   📥 Generating ${days} days of SIMULATED data...`);
        
        // Get current price as anchor
        const currentPrice = await RealTimeData.getStockPrice(symbol);
        const basePrice = currentPrice ? currentPrice.price : 180;
        
        // Simulate realistic price and IV movement
        let price = basePrice * 0.8; // Start 20% lower
        let iv = 30; // Start at mean IV
        const meanIV = 30;
        const meanReversionSpeed = 0.05;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            
            // Simulate price (geometric Brownian motion)
            const priceReturn = (Math.random() - 0.48) * 0.02; // Slight upward drift
            price = price * (1 + priceReturn);
            
            // Simulate IV (mean-reverting with regime changes)
            const drift = (meanIV - iv) * meanReversionSpeed;
            const shock = (Math.random() - 0.5) * 4;
            
            // Occasional volatility spikes
            if (Math.random() < 0.05) {
                iv += Math.random() * 20; // Random spike
            }
            
            iv = Math.max(15, Math.min(85, iv + drift + shock));
            
            // Calculate IV Rank (simplified - using current data point)
            // In real backtest, this would use historical window
            const historicalWindow = data.slice(Math.max(0, i - 252), i);
            const ivRank = historicalWindow.length > 30 ?
                IVRankEngine.calculateIVRank(symbol, iv, historicalWindow) :
                50;
            
            data.push({
                date: date.toISOString().split('T')[0],
                price: Math.round(price * 100) / 100,
                iv: Math.round(iv * 10) / 10,
                ivRank: ivRank || 50
            });
        }
        
        console.log(`   ✅ Generated ${data.length} days of data`);
        return data;
    },
    
    /**
     * Calculate P&L for open position
     */
    calculatePnL(position, currentDay, daysHeld) {
        const { action, trade, capital } = position;
        
        // Simplified P&L calculation
        // In production, this would model actual option pricing
        
        if (action === 'SELL') {
            // Selling premium (Iron Condor)
            const ivDecay = Math.max(0, position.entryIV - currentDay.iv);
            const timeDecay = daysHeld / 21; // Normalize to 21 days
            
            // P&L = IV crush + time decay
            const pnlPercent = (ivDecay * 0.02) + (timeDecay * 0.30);
            return capital * Math.min(0.50, pnlPercent); // Cap at 50% max profit
        } else {
            // Buying premium (Debit Spread)
            const ivExpansion = Math.max(0, currentDay.iv - position.entryIV);
            const priceMove = (currentDay.price - position.entryPrice) / position.entryPrice;
            
            // P&L = IV expansion + favorable price move
            const pnlPercent = (ivExpansion * 0.03) + (priceMove * 0.5);
            return capital * Math.min(1.0, Math.max(-1.0, pnlPercent));
        }
    },
    
    /**
     * Check if position should be closed
     */
    checkExitCriteria(position, currentPnL, daysHeld, targetProfit, maxHoldDays) {
        // Exit at target profit (50% of max)
        if (currentPnL >= position.capital * targetProfit) {
            return { exit: true, reason: 'TARGET_PROFIT' };
        }
        
        // Exit at max hold days (21 days)
        if (daysHeld >= maxHoldDays) {
            return { exit: true, reason: 'MAX_DAYS' };
        }
        
        // Stop loss at -100% (max loss)
        if (currentPnL <= -position.capital) {
            return { exit: true, reason: 'STOP_LOSS' };
        }
        
        return { exit: false };
    },
    
    /**
     * Close position and record trade
     */
    closePosition(position, exitDay, pnl, daysHeld, exitReason) {
        const trade = {
            symbol: position.symbol,
            entryDate: position.entryDate,
            exitDate: exitDay.date,
            daysHeld: daysHeld,
            action: position.action,
            strategy: position.strategy,
            
            entryIV: position.entryIV,
            entryIVRank: position.entryIVRank,
            entryPrice: position.entryPrice,
            
            exitIV: exitDay.iv,
            exitIVRank: exitDay.ivRank,
            exitPrice: exitDay.price,
            
            capital: position.capital,
            pnl: Math.round(pnl * 100) / 100,
            pnlPercent: Math.round((pnl / position.capital) * 10000) / 100,
            
            exitReason: exitReason,
            confidence: position.confidence,
            
            result: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BREAKEVEN'
        };
        
        console.log(`   💰 Exit: ${exitDay.date} - ${trade.result} ${trade.pnlPercent}% (${daysHeld} days)`);
        
        return trade;
    },
    
    /**
     * Calculate comprehensive performance metrics
     */
    calculateMetrics(trades, equity) {
        if (trades.length === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                avgReturn: 0,
                sharpeRatio: 0,
                maxDrawdown: 0
            };
        }
        
        // Basic metrics
        const wins = trades.filter(t => t.result === 'WIN');
        const losses = trades.filter(t => t.result === 'LOSS');
        
        const winRate = (wins.length / trades.length) * 100;
        const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnlPercent, 0) / losses.length : 0;
        const avgReturn = trades.reduce((sum, t) => sum + t.pnlPercent, 0) / trades.length;
        
        // Expectancy = (Win% * AvgWin) + (Loss% * AvgLoss)
        const expectancy = (winRate / 100 * avgWin) + ((100 - winRate) / 100 * avgLoss);
        
        // Sharpe Ratio (simplified)
        const returns = trades.map(t => t.pnlPercent);
        const avgRet = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const stdDev = Math.sqrt(
            returns.reduce((sum, r) => sum + Math.pow(r - avgRet, 2), 0) / returns.length
        );
        const sharpeRatio = stdDev > 0 ? (avgRet / stdDev) * Math.sqrt(252 / trades.length) : 0;
        
        // Max Drawdown
        let peak = equity[0].value;
        let maxDD = 0;
        for (const point of equity) {
            if (point.value > peak) peak = point.value;
            const dd = ((peak - point.value) / peak) * 100;
            if (dd > maxDD) maxDD = dd;
        }
        
        // Profit Factor
        const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
        
        return {
            totalTrades: trades.length,
            wins: wins.length,
            losses: losses.length,
            winRate: Math.round(winRate * 10) / 10,
            
            avgReturn: Math.round(avgReturn * 100) / 100,
            avgWin: Math.round(avgWin * 100) / 100,
            avgLoss: Math.round(avgLoss * 100) / 100,
            
            expectancy: Math.round(expectancy * 100) / 100,
            profitFactor: Math.round(profitFactor * 100) / 100,
            sharpeRatio: Math.round(sharpeRatio * 100) / 100,
            
            maxDrawdown: Math.round(maxDD * 100) / 100,
            
            totalPnL: trades.reduce((sum, t) => sum + t.pnl, 0),
            finalEquity: equity[equity.length - 1].value,
            returnPercent: ((equity[equity.length - 1].value - equity[0].value) / equity[0].value) * 100,
            
            avgHoldDays: trades.reduce((sum, t) => sum + t.daysHeld, 0) / trades.length
        };
    },
    
    /**
     * Generate detailed backtest report
     */
    generateReport(results) {
        if (!results) return 'No backtest results available';
        
        const { symbol, trades, metrics, equity } = results;
        
        const report = `
╔════════════════════════════════════════════════════════════════╗
║  BACKTEST REPORT: ${symbol} - IV RANK MEAN REVERSION           
╚════════════════════════════════════════════════════════════════╝

STRATEGY PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Trades:        ${metrics.totalTrades}
Win Rate:            ${metrics.winRate}% (${metrics.wins}W / ${metrics.losses}L)
Average Return:      ${metrics.avgReturn}% per trade
Expectancy:          ${metrics.expectancy}% per trade

Wins:                +${metrics.avgWin}% average
Losses:              ${metrics.avgLoss}% average
Profit Factor:       ${metrics.profitFactor}

RISK METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sharpe Ratio:        ${metrics.sharpeRatio}
Max Drawdown:        -${metrics.maxDrawdown}%
Avg Hold Time:       ${Math.round(metrics.avgHoldDays)} days

PORTFOLIO PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Starting Capital:    $${equity[0].value.toLocaleString()}
Final Equity:        $${metrics.finalEquity.toLocaleString()}
Total P&L:           $${metrics.totalPnL.toFixed(2)}
Return:              ${metrics.returnPercent.toFixed(2)}%

VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.getVerdict(metrics)}

SAMPLE TRADES (Last 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${trades.slice(-5).map(t => `
${t.entryDate} → ${t.exitDate} (${t.daysHeld}d)
${t.action} ${t.strategy}
Entry: IV Rank ${t.entryIVRank}% | Exit: ${t.exitIVRank}%
Result: ${t.result} ${t.pnlPercent > 0 ? '+' : ''}${t.pnlPercent}%
`).join('\n')}
        `;
        
        return report;
    },
    
    /**
     * Get verdict on backtest results
     */
    getVerdict(metrics) {
        let verdict = '';
        
        // Check profitability
        if (metrics.expectancy > 2 && metrics.winRate > 65 && metrics.sharpeRatio > 1.5) {
            verdict = '✅ EXCELLENT - Strong edge with high probability';
        } else if (metrics.expectancy > 1 && metrics.winRate > 60 && metrics.sharpeRatio > 1.0) {
            verdict = '✅ GOOD - Profitable with reasonable risk';
        } else if (metrics.expectancy > 0 && metrics.winRate > 50) {
            verdict = '⚠️ MARGINAL - Slight edge, needs refinement';
        } else {
            verdict = '❌ UNPROFITABLE - No edge detected';
        }
        
        // Add warnings
        if (metrics.maxDrawdown > 20) {
            verdict += '\n⚠️ WARNING: High drawdown risk';
        }
        if (metrics.totalTrades < 30) {
            verdict += '\n⚠️ WARNING: Limited sample size';
        }
        
        return verdict;
    }
};

// Export
window.BacktestEngine = BacktestEngine;

console.log('✅ Backtest Engine loaded');
