/**
 * PORTFOLIO TRACKER
 * Track options positions and calculate P&L
 */

const Portfolio = {
    positions: [],
    closedTrades: [],
    
    /**
     * Initialize portfolio from localStorage
     */
    init() {
        const saved = localStorage.getItem('optionsPortfolio');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.positions = data.positions || [];
                this.closedTrades = data.closedTrades || [];
            } catch (error) {
                console.error('Error loading portfolio:', error);
                this.positions = [];
                this.closedTrades = [];
            }
        }
        this.save();
    },
    
    /**
     * Save portfolio to localStorage
     */
    save() {
        const data = {
            positions: this.positions,
            closedTrades: this.closedTrades,
            lastUpdated: Date.now()
        };
        localStorage.setItem('optionsPortfolio', JSON.stringify(data));
    },
    
    /**
     * Add new position
     */
    addPosition(position) {
        const newPosition = {
            id: Date.now(),
            symbol: position.symbol.toUpperCase(),
            type: position.type,
            strike: parseFloat(position.strike),
            expiration: position.expiration,
            quantity: parseInt(position.quantity),
            premium: parseFloat(position.premium),
            entryDate: new Date().toISOString(),
            status: 'open'
        };
        
        this.positions.push(newPosition);
        this.save();
        return newPosition;
    },
    
    /**
     * Close position
     */
    closePosition(id, exitPremium) {
        const position = this.positions.find(p => p.id === id);
        if (!position) return null;
        
        position.status = 'closed';
        position.exitDate = new Date().toISOString();
        position.exitPremium = parseFloat(exitPremium);
        
        // Calculate P&L
        const pl = (position.exitPremium - position.premium) * position.quantity * 100;
        position.pl = pl;
        position.plPercent = ((position.exitPremium - position.premium) / position.premium * 100);
        
        // Move to closed trades
        this.closedTrades.push(position);
        this.positions = this.positions.filter(p => p.id !== id);
        
        this.save();
        return position;
    },
    
    /**
     * Get current option price
     */
    async getCurrentPrice(symbol, type, strike, expiration) {
        try {
            const stockPrice = await OptionsData.getStockPrice(symbol);
            const optionsChain = OptionsData.generateOptionsChain(symbol, stockPrice);
            
            const option = optionsChain.find(opt => 
                opt.type === type &&
                opt.strike === strike &&
                new Date(opt.expiration).toDateString() === new Date(expiration).toDateString()
            );
            
            return option ? option.last : null;
        } catch (error) {
            console.error('Error getting current price:', error);
            return null;
        }
    },
    
    /**
     * Update all positions with current prices
     */
    async updatePositions() {
        for (const position of this.positions) {
            const currentPrice = await this.getCurrentPrice(
                position.symbol,
                position.type,
                position.strike,
                position.expiration
            );
            
            if (currentPrice !== null) {
                position.currentPrice = currentPrice;
                position.unrealizedPL = (currentPrice - position.premium) * position.quantity * 100;
                position.unrealizedPLPercent = ((currentPrice - position.premium) / position.premium * 100);
            }
        }
        
        this.save();
    },
    
    /**
     * Calculate portfolio statistics
     */
    getStatistics() {
        // Total P&L (realized + unrealized)
        const realizedPL = this.closedTrades.reduce((sum, trade) => sum + (trade.pl || 0), 0);
        const unrealizedPL = this.positions.reduce((sum, pos) => sum + (pos.unrealizedPL || 0), 0);
        const totalPL = realizedPL + unrealizedPL;
        
        // Calculate total capital invested
        const currentCapital = this.positions.reduce((sum, pos) => 
            sum + (pos.premium * pos.quantity * 100), 0
        );
        const totalCapital = currentCapital + Math.abs(realizedPL);
        const plPercent = totalCapital > 0 ? (totalPL / totalCapital * 100) : 0;
        
        // Win rate
        const winners = this.closedTrades.filter(t => (t.pl || 0) > 0).length;
        const losers = this.closedTrades.filter(t => (t.pl || 0) <= 0).length;
        const winRate = (winners + losers) > 0 ? (winners / (winners + losers) * 100) : 0;
        
        // Total risk (max loss on open positions)
        const totalRisk = this.positions.reduce((sum, pos) => {
            // For long options, max loss is premium paid
            return sum + (pos.premium * pos.quantity * 100);
        }, 0);
        
        // Best and worst trade
        const sortedTrades = [...this.closedTrades].sort((a, b) => (b.pl || 0) - (a.pl || 0));
        const bestTrade = sortedTrades[0] || null;
        const worstTrade = sortedTrades[sortedTrades.length - 1] || null;
        
        // Average win/loss
        const avgWin = winners > 0 ? 
            this.closedTrades.filter(t => (t.pl || 0) > 0).reduce((sum, t) => sum + t.pl, 0) / winners : 0;
        const avgLoss = losers > 0 ? 
            this.closedTrades.filter(t => (t.pl || 0) <= 0).reduce((sum, t) => sum + Math.abs(t.pl), 0) / losers : 0;
        
        return {
            totalPL,
            realizedPL,
            unrealizedPL,
            plPercent,
            openPositions: this.positions.length,
            closedTrades: this.closedTrades.length,
            winRate,
            totalRisk,
            bestTrade,
            worstTrade,
            avgWin,
            avgLoss,
            profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0
        };
    },
    
    /**
     * Get portfolio Greeks
     */
    async getPortfolioGreeks() {
        const greeksData = [];
        
        for (const position of this.positions) {
            try {
                const stockPrice = await OptionsData.getStockPrice(position.symbol);
                const optionsChain = OptionsData.generateOptionsChain(position.symbol, stockPrice);
                
                const option = optionsChain.find(opt => 
                    opt.type === position.type &&
                    opt.strike === position.strike
                );
                
                if (option) {
                    greeksData.push({
                        symbol: position.symbol,
                        quantity: position.quantity,
                        delta: option.delta,
                        gamma: option.gamma,
                        theta: option.theta,
                        vega: option.vega
                    });
                }
            } catch (error) {
                console.error(`Error getting Greeks for ${position.symbol}:`, error);
            }
        }
        
        return OptionsCalculations.calculatePortfolioGreeks(greeksData);
    },
    
    /**
     * Get risk metrics
     */
    getRiskMetrics() {
        const stats = this.getStatistics();
        
        // Calculate beta-adjusted exposure (simplified)
        const totalDelta = this.positions.reduce((sum, pos) => {
            const multiplier = pos.quantity * 100;
            return sum + (pos.currentPrice || pos.premium) * multiplier;
        }, 0);
        
        // Concentration risk
        const symbolExposure = {};
        for (const pos of this.positions) {
            const exposure = pos.premium * pos.quantity * 100;
            symbolExposure[pos.symbol] = (symbolExposure[pos.symbol] || 0) + exposure;
        }
        
        const totalExposure = Object.values(symbolExposure).reduce((a, b) => a + b, 0);
        const maxConcentration = Math.max(...Object.values(symbolExposure)) / totalExposure * 100;
        
        // Days to expiration analysis
        const avgDTE = this.positions.reduce((sum, pos) => {
            const dte = Math.floor((new Date(pos.expiration) - new Date()) / (1000 * 60 * 60 * 24));
            return sum + dte;
        }, 0) / (this.positions.length || 1);
        
        return {
            totalRisk: stats.totalRisk,
            maxConcentration,
            avgDTE,
            openPositions: this.positions.length,
            diversification: Object.keys(symbolExposure).length,
            riskLevel: maxConcentration > 50 ? 'HIGH' : maxConcentration > 30 ? 'MEDIUM' : 'LOW'
        };
    },
    
    /**
     * Get trade history for charting
     */
    getTradeHistory() {
        return [...this.closedTrades].sort((a, b) => 
            new Date(a.exitDate) - new Date(b.exitDate)
        );
    },
    
    /**
     * Export portfolio to CSV
     */
    exportToCSV() {
        const rows = [
            ['Symbol', 'Type', 'Strike', 'Expiration', 'Quantity', 'Entry Price', 'Current Price', 'P&L', 'P&L %', 'Status']
        ];
        
        for (const pos of this.positions) {
            rows.push([
                pos.symbol,
                pos.type,
                pos.strike,
                pos.expiration,
                pos.quantity,
                pos.premium,
                pos.currentPrice || 'N/A',
                pos.unrealizedPL?.toFixed(2) || 'N/A',
                pos.unrealizedPLPercent?.toFixed(2) + '%' || 'N/A',
                'Open'
            ]);
        }
        
        for (const trade of this.closedTrades) {
            rows.push([
                trade.symbol,
                trade.type,
                trade.strike,
                trade.expiration,
                trade.quantity,
                trade.premium,
                trade.exitPremium,
                trade.pl.toFixed(2),
                trade.plPercent.toFixed(2) + '%',
                'Closed'
            ]);
        }
        
        const csv = rows.map(row => row.join(',')).join('\n');
        return csv;
    },
    
    /**
     * Delete position
     */
    deletePosition(id) {
        this.positions = this.positions.filter(p => p.id !== id);
        this.save();
    },
    
    /**
     * Clear all data
     */
    clearAll() {
        if (confirm('Are you sure you want to clear all portfolio data? This cannot be undone.')) {
            this.positions = [];
            this.closedTrades = [];
            this.save();
            return true;
        }
        return false;
    }
};

/**
 * Initialize portfolio on load
 */
Portfolio.init();

/**
 * Export portfolio
 */
window.Portfolio = Portfolio;
