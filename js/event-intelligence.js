/**
 * EVENT INTELLIGENCE ENGINE
 * Multi-dimensional world event analysis and classification
 */

const EventIntelligence = {
    
    /**
     * Event taxonomy - categorize all world events
     */
    eventTypes: {
        GEOPOLITICAL: {
            WAR: {
                impact: 'immediate',
                volatility: 'extreme',
                duration: 'medium-long',
                sectors: {
                    positive: ['defense', 'oil', 'cybersecurity'],
                    negative: ['airlines', 'tourism', 'consumer_discretionary']
                }
            },
            SANCTIONS: {
                impact: 'delayed',
                volatility: 'high',
                duration: 'long',
                sectors: {
                    positive: ['domestic_alternatives', 'competitors'],
                    negative: ['international_trade', 'logistics']
                }
            },
            TRADE_AGREEMENT: {
                impact: 'delayed',
                volatility: 'medium',
                duration: 'long',
                sectors: {
                    positive: ['exporters', 'logistics', 'manufacturing'],
                    negative: ['protected_industries']
                }
            }
        },
        ECONOMIC: {
            INTEREST_RATE_CHANGE: {
                impact: 'immediate',
                volatility: 'high',
                duration: 'long',
                sectors: {
                    positive: ['financials', 'banks'],
                    negative: ['real_estate', 'growth_stocks', 'tech']
                }
            },
            INFLATION_SHOCK: {
                impact: 'immediate',
                volatility: 'extreme',
                duration: 'medium',
                sectors: {
                    positive: ['commodities', 'energy', 'materials'],
                    negative: ['consumer_discretionary', 'tech']
                }
            },
            RECESSION_SIGNAL: {
                impact: 'delayed',
                volatility: 'high',
                duration: 'long',
                sectors: {
                    positive: ['defensive_stocks', 'utilities', 'consumer_staples'],
                    negative: ['cyclicals', 'industrials', 'luxury']
                }
            }
        },
        COMMODITY: {
            OIL_SUPPLY_SHOCK: {
                impact: 'immediate',
                volatility: 'extreme',
                duration: 'medium',
                sectors: {
                    positive: ['oil_majors', 'oil_services', 'tankers'],
                    negative: ['airlines', 'transport', 'chemicals']
                },
                cascadeEffects: {
                    'airlines': { delay: 0, magnitude: -0.8 },
                    'transport': { delay: 1, magnitude: -0.6 },
                    'refiners': { delay: 0, magnitude: 0.7 },
                    'oil_services': { delay: 2, magnitude: 0.9 },
                    'renewable_energy': { delay: 7, magnitude: 0.5 }
                }
            },
            SEMICONDUCTOR_SHORTAGE: {
                impact: 'delayed',
                volatility: 'high',
                duration: 'long',
                sectors: {
                    positive: ['chip_makers', 'foundries'],
                    negative: ['auto', 'consumer_electronics', 'data_centers']
                }
            }
        },
        REGULATORY: {
            FDA_APPROVAL: {
                impact: 'immediate',
                volatility: 'extreme',
                duration: 'short',
                sectors: {
                    positive: ['specific_company', 'competitors'],
                    negative: ['alternative_treatments']
                }
            },
            ANTITRUST_ACTION: {
                impact: 'delayed',
                volatility: 'high',
                duration: 'long',
                sectors: {
                    positive: ['competitors', 'small_caps'],
                    negative: ['target_company', 'related_monopolies']
                }
            }
        },
        NATURAL_DISASTER: {
            HURRICANE: {
                impact: 'immediate',
                volatility: 'high',
                duration: 'short-medium',
                sectors: {
                    positive: ['insurance', 'construction', 'building_materials'],
                    negative: ['utilities', 'real_estate', 'local_retail']
                }
            },
            EARTHQUAKE: {
                impact: 'immediate',
                volatility: 'extreme',
                duration: 'medium',
                sectors: {
                    positive: ['construction', 'engineering', 'materials'],
                    negative: ['regional_stocks', 'insurance']
                }
            }
        },
        TECHNOLOGY: {
            AI_BREAKTHROUGH: {
                impact: 'delayed',
                volatility: 'high',
                duration: 'long',
                sectors: {
                    positive: ['tech', 'semiconductors', 'cloud'],
                    negative: ['traditional_services', 'labor_intensive']
                }
            },
            CYBERSECURITY_BREACH: {
                impact: 'immediate',
                volatility: 'high',
                duration: 'short',
                sectors: {
                    positive: ['cybersecurity', 'cloud_security'],
                    negative: ['breached_company', 'similar_companies']
                }
            }
        }
    },
    
    /**
     * Analyze real-world event and classify
     */
    classifyEvent(eventDescription) {
        // Example: "Trump invaded Venezuela and captured Maduro"
        
        const keywords = eventDescription.toLowerCase();
        let classification = {
            primaryType: null,
            secondaryType: null,
            confidence: 0,
            affectedRegions: [],
            affectedCommodities: [],
            timeline: null
        };
        
        // Keyword matching with confidence scores
        const matchers = {
            // Geopolitical
            'invade|invasion|war|military|capture|attack': {
                type: 'GEOPOLITICAL.WAR',
                confidence: 0.95
            },
            'sanction|embargo|ban|restrict': {
                type: 'GEOPOLITICAL.SANCTIONS',
                confidence: 0.90
            },
            
            // Commodity
            'oil|crude|petroleum|energy': {
                type: 'COMMODITY.OIL_SUPPLY_SHOCK',
                confidence: 0.85,
                commodity: 'oil'
            },
            
            // Economic
            'interest rate|fed|federal reserve|rate hike': {
                type: 'ECONOMIC.INTEREST_RATE_CHANGE',
                confidence: 0.90
            },
            'inflation|cpi|price increase': {
                type: 'ECONOMIC.INFLATION_SHOCK',
                confidence: 0.85
            },
            
            // Regulatory
            'fda|approval|drug|clinical trial': {
                type: 'REGULATORY.FDA_APPROVAL',
                confidence: 0.95
            }
        };
        
        // Find best match
        for (const [pattern, data] of Object.entries(matchers)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(keywords)) {
                if (data.confidence > classification.confidence) {
                    const [primary, secondary] = data.type.split('.');
                    classification.primaryType = primary;
                    classification.secondaryType = secondary;
                    classification.confidence = data.confidence;
                    
                    if (data.commodity) {
                        classification.affectedCommodities.push(data.commodity);
                    }
                }
            }
        }
        
        // Extract geographic regions
        const regions = {
            'venezuela|south america|latam': 'SOUTH_AMERICA',
            'middle east|iran|iraq|saudi': 'MIDDLE_EAST',
            'china|asia|taiwan|korea': 'ASIA',
            'europe|eu|uk|germany': 'EUROPE',
            'us|usa|america|united states': 'NORTH_AMERICA'
        };
        
        for (const [pattern, region] of Object.entries(regions)) {
            if (new RegExp(pattern, 'i').test(keywords)) {
                classification.affectedRegions.push(region);
            }
        }
        
        return classification;
    },
    
    /**
     * Get event metadata from classification
     */
    getEventMetadata(classification) {
        if (!classification.primaryType || !classification.secondaryType) {
            return null;
        }
        
        const eventData = this.eventTypes[classification.primaryType]?.[classification.secondaryType];
        
        if (!eventData) return null;
        
        return {
            ...eventData,
            classification: classification,
            timestamp: Date.now()
        };
    },
    
    /**
     * Calculate time-decay for event impact
     */
    calculateTimeDecay(eventType, hoursSinceEvent) {
        const decayRates = {
            'immediate': 0.15,  // Fast decay (hours to days)
            'delayed': 0.05,     // Slow decay (days to weeks)
            'long': 0.01         // Very slow decay (weeks to months)
        };
        
        const rate = decayRates[eventType.impact] || 0.10;
        
        return Math.exp(-rate * hoursSinceEvent);
    }
};

// Export
window.EventIntelligence = EventIntelligence;
