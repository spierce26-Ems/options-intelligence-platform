/**
 * CROSS-ASSET CORRELATION INTELLIGENCE
 * Analyzes how stocks correlate with bonds, commodities, currencies, and crypto
 * Institutional-grade multi-asset analysis
 */

const CrossAssetIntelligence = {
    
    /**
     * Real-time asset tracking
     * In production, these would come from APIs
     */
    assetSymbols: {
        bonds: {
            'TLT': 'US 20Y Treasury',
            'IEF': 'US 7-10Y Treasury',
            'SHY': 'US 1-3Y Treasury',
            'HYG': 'High Yield Corp Bonds',
            'LQD': 'Investment Grade Corp Bonds'
        },
        commodities: {
            'GLD': 'Gold',
            'SLV': 'Silver',
            'USO': 'Oil',
            'UNG': 'Natural Gas',
            'DBA': 'Agriculture',
            'COPX': 'Copper'
        },
        currencies: {
            'UUP': 'US Dollar Index',
            'FXE': 'Euro',
            'FXY': 'Japanese Yen',
            'FXB': 'British Pound',
            'FXC': 'Canadian Dollar'
        },
        crypto: {
            'BTCUSD': 'Bitcoin',
            'ETHUSD': 'Ethereum'
        },
        volatility: {
            'VIX': 'VIX Fear Index',
            'VVIX': 'VIX of VIX'
        }
    },
    
    /**
     * Multi-asset correlation matrix
     * Based on historical data and institutional research
     */
    correlationMatrix: {
        // Stock sector correlations with other assets
        'tech': {
            'TLT': -0.65,     // Tech inverse to bonds (growth vs safety)
            'GLD': -0.40,     // Tech inverse to gold
            'UUP': -0.55,     // Strong dollar hurts tech (many are global)
            'VIX': -0.75,     // Tech loves low volatility
            'BTCUSD': 0.60,   // Crypto correlation (risk-on)
            'USO': -0.30      // Not oil dependent
        },
        'energy': {
            'TLT': -0.45,     // Energy inverse to bonds
            'GLD': 0.50,      // Energy follows gold (inflation)
            'UUP': -0.70,     // Weak dollar = higher oil prices
            'VIX': 0.40,      // Energy volatile
            'USO': 0.95,      // Direct oil correlation
            'COPX': 0.60      // Copper (economic activity)
        },
        'defense': {
            'TLT': 0.35,      // Defense = safety trade
            'GLD': 0.45,      // Defense follows gold (fear)
            'UUP': 0.30,      // Strong dollar OK
            'VIX': 0.65,      // Defense loves volatility
            'BTCUSD': -0.20   // No crypto correlation
        },
        'financials': {
            'TLT': -0.80,     // Banks hate low rates (long bonds)
            'GLD': -0.25,     // Inverse to gold
            'UUP': 0.60,      // Love strong dollar
            'VIX': -0.55,     // Hate volatility
            'IEF': -0.70      // Steepening yield curve = bullish banks
        },
        'consumer_discretionary': {
            'TLT': -0.50,     // Growth-oriented
            'GLD': -0.35,     // Inverse to gold
            'UUP': -0.45,     // Weak dollar helps (global sales)
            'VIX': -0.60,     // Need consumer confidence
            'HYG': 0.70       // Credit sensitive
        },
        'healthcare': {
            'TLT': 0.40,      // Defensive
            'GLD': 0.25,      // Slight gold correlation
            'UUP': -0.20,     // Global pharma
            'VIX': -0.35,     // Stable sector
            'LQD': 0.50       // Investment grade
        },
        'utilities': {
            'TLT': 0.75,      // Bond proxies
            'GLD': 0.30,      // Defensive
            'UUP': 0.15,      // Domestic
            'VIX': -0.45,     // Stable
            'IEF': 0.80       // Interest rate sensitive
        },
        'materials': {
            'TLT': -0.55,     // Cyclical
            'GLD': 0.60,      // Commodity sensitive
            'UUP': -0.65,     // Weak dollar = higher commodities
            'COPX': 0.85,     // Copper correlation
            'DBA': 0.50       // Ag correlation
        }
    },
    
    /**
     * Analyze cross-asset signals for a stock/sector
     */
    analyzeCrossAssetSignals(sector, stockTicker) {
        console.log(`🌐 Cross-Asset Analysis: ${stockTicker} (${sector})`);
        
        const correlations = this.correlationMatrix[sector] || {};
        const signals = [];
        let totalScore = 0;
        let reasoning = [];
        
        // Analyze each correlated asset
        for (const [assetSymbol, correlation] of Object.entries(correlations)) {
            const assetName = this.getAssetName(assetSymbol);
            const assetTrend = this.getAssetTrend(assetSymbol);
            
            // Calculate signal strength
            const signalStrength = correlation * assetTrend;
            const signalScore = signalStrength * 10; // Scale to 0-10
            
            totalScore += signalScore;
            
            // Generate reasoning
            if (Math.abs(signalScore) > 3) {
                const direction = signalScore > 0 ? '📈 Bullish' : '📉 Bearish';
                const strength = Math.abs(signalScore) > 7 ? 'STRONG' : 'MODERATE';
                
                reasoning.push({
                    asset: assetName,
                    symbol: assetSymbol,
                    correlation: correlation,
                    assetTrend: assetTrend > 0 ? 'rising' : 'falling',
                    signalScore: signalScore,
                    direction: direction,
                    strength: strength,
                    explanation: this.generateExplanation(sector, assetSymbol, assetTrend, correlation)
                });
            }
        }
        
        // Normalize total score to 0-25 range
        const normalizedScore = Math.max(0, Math.min(25, totalScore + 12.5));
        
        // Sort reasoning by absolute signal strength
        reasoning.sort((a, b) => Math.abs(b.signalScore) - Math.abs(a.signalScore));
        
        return {
            score: normalizedScore,
            signals: reasoning.slice(0, 5), // Top 5 signals
            overallSignal: normalizedScore > 17 ? 'STRONG_BULLISH' :
                          normalizedScore > 13 ? 'BULLISH' :
                          normalizedScore < 8 ? 'BEARISH' :
                          normalizedScore < 4 ? 'STRONG_BEARISH' : 'NEUTRAL'
        };
    },
    
    /**
     * Get asset name from symbol
     */
    getAssetName(symbol) {
        for (const [category, assets] of Object.entries(this.assetSymbols)) {
            if (assets[symbol]) {
                return assets[symbol];
            }
        }
        return symbol;
    },
    
    /**
     * Get simulated asset trend
     * In production, fetch real price data
     */
    getAssetTrend(symbol) {
        // Simulated trends based on current market conditions
        const trends = {
            // Bonds (rising = falling yields = risk-off)
            'TLT': -0.2,      // Yields rising
            'IEF': -0.15,
            'SHY': 0.1,
            'HYG': 0.3,       // Credit spreads tightening
            'LQD': 0.2,
            
            // Commodities
            'GLD': 0.4,       // Gold rising (fear)
            'SLV': 0.3,
            'USO': 0.7,       // Oil surging (Venezuela event)
            'UNG': 0.5,
            'COPX': 0.6,      // Copper rising (growth)
            'DBA': 0.2,
            
            // Currencies
            'UUP': 0.3,       // Dollar strengthening
            'FXE': -0.2,      // Euro weakening
            'FXY': 0.1,       // Yen stable
            
            // Crypto
            'BTCUSD': 0.5,    // Bitcoin rising (risk-on)
            'ETHUSD': 0.6,
            
            // Volatility
            'VIX': 0.8,       // Fear spiking (Venezuela)
            'VVIX': 0.9
        };
        
        return trends[symbol] || 0;
    },
    
    /**
     * Generate human-readable explanation
     */
    generateExplanation(sector, assetSymbol, assetTrend, correlation) {
        const assetName = this.getAssetName(assetSymbol);
        const trendWord = assetTrend > 0 ? 'rising' : 'falling';
        const corrWord = correlation > 0 ? 'positive' : 'inverse';
        const impact = (assetTrend * correlation) > 0 ? 'bullish' : 'bearish';
        
        const templates = {
            'TLT': `${assetName} ${trendWord} → ${impact} for ${sector} (${corrWord} correlation)`,
            'GLD': `Gold ${trendWord} → ${impact} signal for ${sector} (${corrWord} correlation)`,
            'USO': `Oil prices ${trendWord} → ${impact} for ${sector} stocks`,
            'UUP': `Dollar ${trendWord} → ${impact} for ${sector} (${corrWord} correlation)`,
            'VIX': `Volatility ${trendWord} → ${impact} for ${sector} (${corrWord} correlation)`,
            'BTCUSD': `Bitcoin ${trendWord} → ${impact} risk sentiment for ${sector}`,
            'HYG': `Credit spreads ${trendWord === 'rising' ? 'tightening' : 'widening'} → ${impact} for ${sector}`,
            'COPX': `Copper ${trendWord} → ${impact} economic growth signal for ${sector}`
        };
        
        return templates[assetSymbol] || `${assetName} ${trendWord} → ${impact} for ${sector}`;
    },
    
    /**
     * Detect regime changes across asset classes
     */
    detectMarketRegime() {
        // Analyze correlation patterns to identify market regime
        const vixTrend = this.getAssetTrend('VIX');
        const goldTrend = this.getAssetTrend('GLD');
        const bondTrend = this.getAssetTrend('TLT');
        const dollarTrend = this.getAssetTrend('UUP');
        
        let regime = 'NORMAL';
        let characteristics = [];
        
        // RISK-OFF: VIX up, Gold up, Bonds up
        if (vixTrend > 0.5 && goldTrend > 0.3 && bondTrend > 0.2) {
            regime = 'RISK_OFF';
            characteristics = [
                'Flight to safety underway',
                'Favor defensive sectors: Utilities, Consumer Staples, Healthcare',
                'Avoid cyclicals: Tech, Consumer Discretionary, Industrials',
                'Buy puts on high-beta stocks',
                'Buy calls on TLT, GLD, VIX'
            ];
        }
        
        // RISK-ON: VIX down, Stocks up, Junk bonds up
        else if (vixTrend < -0.3 && this.getAssetTrend('HYG') > 0.3) {
            regime = 'RISK_ON';
            characteristics = [
                'Risk appetite strong',
                'Favor growth sectors: Tech, Consumer Discretionary',
                'Buy calls on high-beta stocks',
                'Sell volatility',
                'Crypto likely rising'
            ];
        }
        
        // INFLATION: Commodities up, Bonds down, Gold up
        else if (goldTrend > 0.3 && this.getAssetTrend('USO') > 0.5 && bondTrend < -0.2) {
            regime = 'INFLATION';
            characteristics = [
                'Inflation concerns rising',
                'Favor: Energy, Materials, Commodities',
                'Avoid: Long-duration bonds, Growth stocks',
                'Buy calls on energy and materials',
                'Buy puts on TLT'
            ];
        }
        
        // STAGFLATION: Commodities up, Stocks down, VIX up
        else if (this.getAssetTrend('USO') > 0.5 && vixTrend > 0.5 && goldTrend > 0.3) {
            regime = 'STAGFLATION';
            characteristics = [
                '⚠️ Stagflation risk: High inflation + slowing growth',
                'Extremely challenging environment',
                'Favor: Commodities, Gold, Cash',
                'Avoid: Most stocks, especially growth',
                'Defensive options strategies'
            ];
        }
        
        return {
            regime: regime,
            characteristics: characteristics,
            confidence: this.calculateRegimeConfidence(vixTrend, goldTrend, bondTrend, dollarTrend)
        };
    },
    
    /**
     * Calculate confidence in regime detection
     */
    calculateRegimeConfidence(vixTrend, goldTrend, bondTrend, dollarTrend) {
        // Higher absolute values = stronger signals = higher confidence
        const strength = Math.abs(vixTrend) + Math.abs(goldTrend) + Math.abs(bondTrend) + Math.abs(dollarTrend);
        return Math.min(0.95, strength / 4);
    }
};

// Export
window.CrossAssetIntelligence = CrossAssetIntelligence;
