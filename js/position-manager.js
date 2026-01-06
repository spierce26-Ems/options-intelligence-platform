/**
 * POSITION MANAGER
 * Track and manage active options positions
 * 
 * Features:
 * - Add/remove positions
 * - Calculate current P&L
 * - Track days held
 * - Check exit criteria
 * - Position sizing
 */

const PositionManager = {
    // Active positions stored in localStorage
    storageKey: 'optionsPositions',
    
    /**
     * Get all active positions
     */
    getPositions() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return [];
        
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error loading positions:', error);
            return [];
        }
    },
    
    /**
     * Save positions to localStorage
     */
    savePositions(positions) {
        localStorage.setItem(this.storageKey, JSON.stringify(positions));
    },
    
    /**
     * Add new position
     */
    addPosition(position) {
        const positions = this.getPositions();
        
        // Generate unique ID
        position.id = `${position.symbol}_${Date.now()}`;
        position.entryDate = position.entryDate || new Date().toISOString();
        position.status = 'OPEN';
        
        // Validate required fields
        if (!position.symbol || !position.action || !position.strategy) {
            throw new Error('Missing required fields: symbol, action, strategy');
        }
        
        positions.push(position);
        this.savePositions(positions);
        
        console.log(`✅ Added position: ${position.symbol} ${position.strategy}`);
        
        return position;
    },
    
    /**
     * Update existing position
     */
    updatePosition(id, updates) {
        const positions = this.getPositions();
        const index = positions.findIndex(p => p.id === id);
        
        if (index === -1) {
            throw new Error(`Position ${id} not found`);
        }
        
        positions[index] = { ...positions[index], ...updates };
        this.savePositions(positions);
        
        return positions[index];
    },
    
    /**
     * Close position
     */
    closePosition(id, exitPrice, exitReason = 'MANUAL') {
        const positions = this.getPositions();
        const index = positions.findIndex(p => p.id === id);
        
        if (index === -1) {
            throw new Error(`Position ${id} not found`);
        }
        
        const position = positions[index];
        position.status = 'CLOSED';
        position.exitDate = new Date().toISOString();
        position.exitPrice = exitPrice;
        position.exitReason = exitReason;
        
        // Calculate final P&L
        const daysHeld = this.getDaysHeld(position);
        position.daysHeld = daysHeld;
        position.finalPnL = this.calculatePnL(position, exitPrice, daysHeld);
        
        this.savePositions(positions);
        
        console.log(`✅ Closed position: ${position.symbol} - P&L: $${position.finalPnL.toFixed(2)}`);
        
        return position;
    },
    
    /**
     * Delete position (remove from history)
     */
    deletePosition(id) {
        let positions = this.getPositions();
        positions = positions.filter(p => p.id !== id);
        this.savePositions(positions);
        
        console.log(`✅ Deleted position: ${id}`);
    },
    
    /**
     * Get only open positions
     */
    getOpenPositions() {
        return this.getPositions().filter(p => p.status === 'OPEN');
    },
    
    /**
     * Get only closed positions
     */
    getClosedPositions() {
        return this.getPositions().filter(p => p.status === 'CLOSED');
    },
    
    /**
     * Calculate days held
     */
    getDaysHeld(position) {
        const entryDate = new Date(position.entryDate);
        const now = new Date();
        const diffTime = Math.abs(now - entryDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Calculate current P&L for position
     */
    calculatePnL(position, currentPrice, daysHeld) {
        const { action, capital, entryPrice, entryIV } = position;
        
        if (!capital) return 0;
        
        // Simplified P&L calculation (same as backtest engine)
        if (action === 'SELL') {
            // Selling premium (Iron Condor, Credit Spreads)
            const ivDecay = Math.max(0, entryIV - (entryIV * 0.8)); // Assume 20% IV compression
            const timeDecay = Math.min(daysHeld / 21, 1); // Max at 21 days
            
            const pnlPercent = (ivDecay * 0.02) + (timeDecay * 0.30);
            return capital * Math.min(0.50, pnlPercent); // Cap at 50% max profit
            
        } else {
            // Buying premium (Debit Spreads)
            const priceMove = (currentPrice - entryPrice) / entryPrice;
            const pnlPercent = priceMove * 0.5; // Delta exposure
            
            return capital * Math.min(1.0, Math.max(-1.0, pnlPercent));
        }
    },
    
    /**
     * Check if position should be closed
     */
    shouldClose(position, currentPrice) {
        const daysHeld = this.getDaysHeld(position);
        const currentPnL = this.calculatePnL(position, currentPrice, daysHeld);
        const targetProfit = position.targetProfit || 0.50;
        const maxHoldDays = position.maxHoldDays || 21;
        
        // Target profit reached
        if (currentPnL >= position.capital * targetProfit) {
            return {
                should: true,
                reason: 'TARGET_PROFIT',
                pnl: currentPnL
            };
        }
        
        // Max hold days reached
        if (daysHeld >= maxHoldDays) {
            return {
                should: true,
                reason: 'MAX_DAYS',
                pnl: currentPnL
            };
        }
        
        // Stop loss hit
        if (currentPnL <= -position.capital) {
            return {
                should: true,
                reason: 'STOP_LOSS',
                pnl: currentPnL
            };
        }
        
        return {
            should: false,
            pnl: currentPnL
        };
    },
    
    /**
     * Get portfolio statistics
     */
    getPortfolioStats() {
        const positions = this.getPositions();
        const openPositions = this.getOpenPositions();
        const closedPositions = this.getClosedPositions();
        
        // Calculate total P&L
        const totalPnL = closedPositions.reduce((sum, p) => sum + (p.finalPnL || 0), 0);
        
        // Calculate win rate
        const wins = closedPositions.filter(p => (p.finalPnL || 0) > 0).length;
        const losses = closedPositions.filter(p => (p.finalPnL || 0) < 0).length;
        const winRate = closedPositions.length > 0 ? 
            (wins / closedPositions.length) * 100 : 0;
        
        // Calculate average P&L
        const avgPnL = closedPositions.length > 0 ? 
            totalPnL / closedPositions.length : 0;
        
        return {
            totalPositions: positions.length,
            openPositions: openPositions.length,
            closedPositions: closedPositions.length,
            wins: wins,
            losses: losses,
            winRate: Math.round(winRate * 10) / 10,
            totalPnL: Math.round(totalPnL * 100) / 100,
            avgPnL: Math.round(avgPnL * 100) / 100
        };
    },
    
    /**
     * Clear all positions (use with caution!)
     */
    clearAll() {
        if (confirm('Are you sure you want to delete ALL positions? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            console.log('✅ All positions cleared');
            return true;
        }
        return false;
    },
    
    /**
     * Export positions as JSON
     */
    exportPositions() {
        const positions = this.getPositions();
        const json = JSON.stringify(positions, null, 2);
        
        // Create download link
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `positions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        console.log('✅ Positions exported');
    },
    
    /**
     * Import positions from JSON
     */
    importPositions(jsonString) {
        try {
            const positions = JSON.parse(jsonString);
            
            if (!Array.isArray(positions)) {
                throw new Error('Invalid format: expected array');
            }
            
            this.savePositions(positions);
            console.log(`✅ Imported ${positions.length} positions`);
            
            return positions.length;
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }
};

// Export
window.PositionManager = PositionManager;

console.log('✅ Position Manager loaded');
