/**
 * SUPPLY CHAIN & CORRELATION INTELLIGENCE
 * Maps how one stock's movement affects connected companies
 */

const SupplyChainIntelligence = {
    
    /**
     * Supply chain relationships and correlation strengths
     */
    supplyChainNetwork: {
        // Oil & Energy cascades
        'XOM': {
            upstreamSuppliers: [
                { ticker: 'SLB', lag: 0, correlation: 0.85, type: 'oil_services' },
                { ticker: 'HAL', lag: 0, correlation: 0.82, type: 'oil_services' },
                { ticker: 'BKR', lag: 1, correlation: 0.78, type: 'oil_services' }
            ],
            downstreamCustomers: [
                { ticker: 'MPC', lag: 0, correlation: 0.72, type: 'refiners' },
                { ticker: 'VLO', lag: 0, correlation: 0.70, type: 'refiners' },
                { ticker: 'PSX', lag: 1, correlation: 0.68, type: 'refiners' }
            ],
            competitors: [
                { ticker: 'CVX', lag: 0, correlation: 0.92, type: 'oil_major' },
                { ticker: 'COP', lag: 0, correlation: 0.88, type: 'oil_major' },
                { ticker: 'OXY', lag: 0, correlation: 0.75, type: 'oil_major' }
            ],
            inverseRelationships: [
                { ticker: 'DAL', lag: 0, correlation: -0.65, type: 'airlines' },
                { ticker: 'UAL', lag: 0, correlation: -0.62, type: 'airlines' },
                { ticker: 'TSLA', lag: 2, correlation: -0.45, type: 'ev_makers' }
            ]
        },
        
        // Tech supply chains
        'NVDA': {
            upstreamSuppliers: [
                { ticker: 'TSM', lag: 1, correlation: 0.88, type: 'foundry' },
                { ticker: 'ASML', lag: 2, correlation: 0.75, type: 'equipment' },
                { ticker: 'KLAC', lag: 2, correlation: 0.70, type: 'equipment' }
            ],
            downstreamCustomers: [
                { ticker: 'MSFT', lag: 1, correlation: 0.82, type: 'cloud' },
                { ticker: 'AMZN', lag: 1, correlation: 0.78, type: 'cloud' },
                { ticker: 'GOOGL', lag: 1, correlation: 0.80, type: 'cloud' },
                { ticker: 'META', lag: 1, correlation: 0.75, type: 'ai_datacenter' }
            ],
            competitors: [
                { ticker: 'AMD', lag: 0, correlation: 0.85, type: 'gpu_maker' },
                { ticker: 'INTC', lag: 0, correlation: 0.65, type: 'chip_maker' }
            ]
        },
        
        // Defense contractors
        'LMT': {
            competitors: [
                { ticker: 'RTX', lag: 0, correlation: 0.90, type: 'defense' },
                { ticker: 'NOC', lag: 0, correlation: 0.88, type: 'defense' },
                { ticker: 'GD', lag: 0, correlation: 0.85, type: 'defense' },
                { ticker: 'BA', lag: 0, correlation: 0.75, type: 'aerospace_defense' }
            ],
            upstreamSuppliers: [
                { ticker: 'HII', lag: 1, correlation: 0.72, type: 'shipbuilding' },
                { ticker: 'TXT', lag: 1, correlation: 0.68, type: 'aerospace_parts' }
            ]
        },
        
        // Airlines (oil sensitive)
        'DAL': {
            competitors: [
                { ticker: 'UAL', lag: 0, correlation: 0.95, type: 'airline' },
                { ticker: 'AAL', lag: 0, correlation: 0.92, type: 'airline' },
                { ticker: 'LUV', lag: 0, correlation: 0.88, type: 'airline' }
            ],
            inverseRelationships: [
                { ticker: 'XOM', lag: 0, correlation: -0.65, type: 'oil' },
                { ticker: 'USO', lag: 0, correlation: -0.72, type: 'oil_etf' }
            ],
            upstreamSuppliers: [
                { ticker: 'BA', lag: 2, correlation: 0.55, type: 'aircraft' }
            ]
        }
    },
    
    /**
     * Sector-level correlation matrix
     */
    sectorCorrelations: {
        'energy': {
            'energy': 1.00,
            'materials': 0.75,
            'industrials': 0.60,
            'financials': 0.45,
            'consumer_discretionary': -0.50,
            'tech': -0.30,
            'utilities': 0.35,
            'real_estate': -0.40
        },
        'defense': {
            'defense': 1.00,
            'aerospace': 0.85,
            'industrials': 0.65,
            'materials': 0.50,
            'tech': 0.40,
            'consumer_discretionary': -0.30
        },
        'tech': {
            'tech': 1.00,
            'semiconductors': 0.90,
            'cloud': 0.85,
            'software': 0.80,
            'financials': 0.45,
            'consumer_discretionary': 0.60,
            'energy': -0.30
        }
    },
    
    /**
     * Calculate cascade effect when a stock moves
     */
    calculateCascadeEffect(ticker, priceChange, timeHorizon = 'short') {
        const network = this.supplyChainNetwork[ticker];
        if (!network) return [];
        
        const cascadeEffects = [];
        
        // Time horizon multipliers
        const horizonMultipliers = {
            'immediate': { lag0: 1.0, lag1: 0.3, lag2: 0.1 },
            'short': { lag0: 1.0, lag1: 0.7, lag2: 0.4 },
            'medium': { lag0: 1.0, lag1: 0.9, lag2: 0.8 },
            'long': { lag0: 1.0, lag1: 1.0, lag2: 1.0 }
        };
        
        const multiplier = horizonMultipliers[timeHorizon] || horizonMultipliers['short'];
        
        // Process all relationship types
        const allRelationships = [
            ...(network.upstreamSuppliers || []),
            ...(network.downstreamCustomers || []),
            ...(network.competitors || []),
            ...(network.inverseRelationships || [])
        ];
        
        for (const relationship of allRelationships) {
            // Calculate expected impact
            const lagMultiplier = multiplier[`lag${relationship.lag}`] || 0;
            const expectedImpact = priceChange * relationship.correlation * lagMultiplier;
            
            // Calculate confidence based on correlation strength
            const confidence = Math.abs(relationship.correlation) * lagMultiplier;
            
            cascadeEffects.push({
                ticker: relationship.ticker,
                type: relationship.type,
                expectedImpact: expectedImpact,
                confidence: confidence,
                lag: relationship.lag,
                correlation: relationship.correlation,
                reasoning: this.generateReasoning(ticker, relationship, priceChange)
            });
        }
        
        // Sort by expected absolute impact
        return cascadeEffects.sort((a, b) => 
            Math.abs(b.expectedImpact * b.confidence) - Math.abs(a.expectedImpact * a.confidence)
        );
    },
    
    /**
     * Generate human-readable reasoning
     */
    generateReasoning(sourceTicker, relationship, priceChange) {
        const direction = priceChange > 0 ? 'up' : 'down';
        const impactDirection = (priceChange * relationship.correlation) > 0 ? 'boost' : 'pressure';
        
        const templates = {
            'oil_services': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (oil services provider)`,
            'refiners': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (refiner margins)`,
            'airlines': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (fuel costs)`,
            'oil_major': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (peer oil major)`,
            'cloud': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (customer demand)`,
            'defense': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (sector peer)`,
            'foundry': `${sourceTicker} ${direction} → ${impactDirection} on ${relationship.ticker} (supply chain)`
        };
        
        return templates[relationship.type] || `Correlated move: ${relationship.correlation.toFixed(2)}`;
    },
    
    /**
     * Find sector-wide opportunities
     */
    findSectorOpportunities(eventType, affectedSectors) {
        const opportunities = [];
        
        for (const sector of affectedSectors) {
            const correlation = this.sectorCorrelations[sector];
            if (!correlation) continue;
            
            for (const [targetSector, corr] of Object.entries(correlation)) {
                if (targetSector === sector) continue;
                
                opportunities.push({
                    sourceSector: sector,
                    targetSector: targetSector,
                    correlation: corr,
                    strength: Math.abs(corr),
                    direction: corr > 0 ? 'positive' : 'negative'
                });
            }
        }
        
        return opportunities.sort((a, b) => b.strength - a.strength);
    },
    
    /**
     * Build dynamic correlation map from real price data
     */
    async calculateDynamicCorrelation(ticker1, ticker2, lookbackDays = 30) {
        // This would use real historical price data
        // For now, return static correlation from network
        
        const network = this.supplyChainNetwork[ticker1];
        if (!network) return 0;
        
        const allRelations = [
            ...(network.upstreamSuppliers || []),
            ...(network.downstreamCustomers || []),
            ...(network.competitors || []),
            ...(network.inverseRelationships || [])
        ];
        
        const relation = allRelations.find(r => r.ticker === ticker2);
        return relation ? relation.correlation : 0;
    }
};

// Export
window.SupplyChainIntelligence = SupplyChainIntelligence;
