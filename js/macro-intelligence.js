/**
 * MACRO ECONOMIC INTELLIGENCE
 * Fed policy, inflation, GDP, unemployment, and macroeconomic indicators
 * Institutional-grade macro analysis
 */

const MacroIntelligence = {
    
    /**
     * Current macro indicators
     * In production, fetch from Fed APIs, BLS, etc.
     */
    indicators: {
        federalFundsRate: {
            current: 5.50,
            target: 5.50,
            trend: 'stable',
            lastChange: 0,
            nextMeetingDate: '2026-03-18',
            expectedChange: 0 // basis points
        },
        inflation: {
            cpi: 3.2,           // Current CPI YoY%
            pce: 2.8,           // Fed's preferred measure
            trend: 'declining',
            target: 2.0,
            lastUpdate: '2026-01-15'
        },
        employment: {
            unemployment: 3.8,  // %
            nfp: 180000,        // Last non-farm payrolls
            trend: 'stable',
            target: 4.0,        // Fed's estimate of full employment
            wageGrowth: 4.2     // % YoY
        },
        gdp: {
            current: 2.5,       // % annualized
            trend: 'moderate',
            lastQuarter: 2.8,
            forecast: 2.3
        },
        yieldCurve: {
            '2y10y': 0.45,      // 2yr-10yr spread (basis points)
            status: 'normal',   // normal, flat, inverted
            inversionWarning: false
        },
        commodities: {
            oil: 82.50,         // WTI crude
            gold: 2180,
            copper: 4.25,
            dxy: 103.8          // Dollar Index
        }
    },
    
    /**
     * Macro scenario templates
     */
    scenarios: {
        HAWKISH_FED: {
            name: 'Hawkish Fed (Rate Hikes)',
            triggers: ['inflation > 3.5%', 'wage_growth > 5%', 'tight_labor_market'],
            impact: {
                'financials': { score: 20, reason: 'Banks benefit from higher rates' },
                'energy': { score: 15, reason: 'Commodity inflation continues' },
                'utilities': { score: -20, reason: 'High rates hurt bond proxies' },
                'tech': { score: -25, reason: 'Growth stocks suffer from higher discount rates' },
                'real_estate': { score: -30, reason: 'Higher mortgage rates kill demand' },
                'consumer_discretionary': { score: -15, reason: 'Higher rates reduce spending' }
            },
            optionsStrategy: 'Buy puts on growth/tech, Buy calls on financials',
            duration: 'medium-long'
        },
        DOVISH_FED: {
            name: 'Dovish Fed (Rate Cuts)',
            triggers: ['inflation < 2.5%', 'unemployment > 4.5%', 'recession_risk'],
            impact: {
                'tech': { score: 25, reason: 'Lower discount rates boost growth stocks' },
                'real_estate': { score: 20, reason: 'Lower mortgage rates stimulate' },
                'utilities': { score: 20, reason: 'Bond proxies rise with falling rates' },
                'consumer_discretionary': { score: 15, reason: 'Lower rates boost spending' },
                'financials': { score: -15, reason: 'Net interest margin compression' },
                'energy': { score: -10, reason: 'Weak growth hurts commodity demand' }
            },
            optionsStrategy: 'Buy calls on growth/tech, Buy puts on financials',
            duration: 'medium-long'
        },
        STAGFLATION: {
            name: 'Stagflation (High inflation + Slow growth)',
            triggers: ['inflation > 4%', 'gdp < 1.5%', 'unemployment > 5%'],
            impact: {
                'energy': { score: 25, reason: 'Commodity prices rising' },
                'materials': { score: 20, reason: 'Inflation hedge' },
                'consumer_staples': { score: 15, reason: 'Defensive with pricing power' },
                'tech': { score: -30, reason: 'Worst environment for growth' },
                'consumer_discretionary': { score: -25, reason: 'Weak demand + high costs' },
                'financials': { score: -20, reason: 'Credit concerns + weak growth' }
            },
            optionsStrategy: 'Buy calls on commodities, Buy puts on everything else',
            duration: 'long'
        },
        GOLDILOCKS: {
            name: 'Goldilocks (Moderate growth + Low inflation)',
            triggers: ['inflation 2-2.5%', 'gdp 2-3%', 'stable_rates'],
            impact: {
                'tech': { score: 20, reason: 'Perfect environment for growth' },
                'consumer_discretionary': { score: 20, reason: 'Strong consumer spending' },
                'industrials': { score: 18, reason: 'Steady economic growth' },
                'financials': { score: 15, reason: 'Stable rates + growth' },
                'energy': { score: 10, reason: 'Moderate demand' },
                'utilities': { score: 5, reason: 'Stable but not exciting' }
            },
            optionsStrategy: 'Buy calls across the board, sell volatility',
            duration: 'medium'
        },
        RECESSION: {
            name: 'Recession',
            triggers: ['gdp < 0%', 'unemployment > 5%', 'inverted_yield_curve'],
            impact: {
                'consumer_staples': { score: 20, reason: 'Defensive essential goods' },
                'utilities': { score: 18, reason: 'Defensive with stable cash flows' },
                'healthcare': { score: 15, reason: 'Non-discretionary spending' },
                'tech': { score: -20, reason: 'Discretionary IT spending falls' },
                'consumer_discretionary': { score: -30, reason: 'First to be cut' },
                'industrials': { score: -25, reason: 'Cyclical downturn' },
                'materials': { score: -20, reason: 'Weak commodity demand' }
            },
            optionsStrategy: 'Buy puts on cyclicals, Buy calls on defensives, Long VIX',
            duration: 'medium-long'
        }
    },
    
    /**
     * Detect current macro scenario
     */
    detectMacroScenario() {
        const ind = this.indicators;
        let activeScenarios = [];
        
        // Check HAWKISH_FED
        if (ind.inflation.cpi > 3.5 || ind.employment.wageGrowth > 5.0) {
            activeScenarios.push({
                scenario: 'HAWKISH_FED',
                confidence: 0.75,
                data: this.scenarios.HAWKISH_FED
            });
        }
        
        // Check DOVISH_FED
        if (ind.inflation.cpi < 2.5 || ind.employment.unemployment > 4.5) {
            activeScenarios.push({
                scenario: 'DOVISH_FED',
                confidence: 0.60,
                data: this.scenarios.DOVISH_FED
            });
        }
        
        // Check STAGFLATION
        if (ind.inflation.cpi > 4.0 && ind.gdp.current < 1.5) {
            activeScenarios.push({
                scenario: 'STAGFLATION',
                confidence: 0.85,
                data: this.scenarios.STAGFLATION
            });
        }
        
        // Check GOLDILOCKS
        if (ind.inflation.cpi >= 2.0 && ind.inflation.cpi <= 2.5 &&
            ind.gdp.current >= 2.0 && ind.gdp.current <= 3.0) {
            activeScenarios.push({
                scenario: 'GOLDILOCKS',
                confidence: 0.70,
                data: this.scenarios.GOLDILOCKS
            });
        }
        
        // Check RECESSION
        if (ind.gdp.current < 0 || ind.employment.unemployment > 5.0 || 
            ind.yieldCurve.status === 'inverted') {
            activeScenarios.push({
                scenario: 'RECESSION',
                confidence: 0.80,
                data: this.scenarios.RECESSION
            });
        }
        
        // Default to current conditions analysis
        if (activeScenarios.length === 0) {
            activeScenarios.push({
                scenario: 'NEUTRAL',
                confidence: 0.50,
                data: {
                    name: 'Neutral/Mixed Signals',
                    impact: {},
                    optionsStrategy: 'Balanced approach, monitor for regime change'
                }
            });
        }
        
        // Sort by confidence
        activeScenarios.sort((a, b) => b.confidence - a.confidence);
        
        return {
            primary: activeScenarios[0],
            alternatives: activeScenarios.slice(1, 3),
            indicators: ind
        };
    },
    
    /**
     * Calculate macro score for a specific stock/sector
     */
    calculateMacroScore(sector, timeframe = 'short') {
        const scenario = this.detectMacroScenario();
        const primaryScenario = scenario.primary;
        
        // Get sector impact from primary scenario
        const sectorImpact = primaryScenario.data.impact?.[sector];
        
        if (!sectorImpact) {
            return {
                score: 12.5, // Neutral
                scenario: primaryScenario.scenario,
                confidence: 0.5,
                reasoning: [`No specific macro impact identified for ${sector}`]
            };
        }
        
        // Base score from scenario
        let score = sectorImpact.score;
        
        // Adjust for timeframe
        const timeframeAdjustment = {
            'short': 0.7,    // Macro takes time to play out
            'medium': 1.0,   // Perfect for macro
            'long': 1.2      // Macro dominates long-term
        };
        
        score *= (timeframeAdjustment[timeframe] || 1.0);
        
        // Normalize to 0-20 range (macro component of total score)
        score = Math.max(0, Math.min(20, score + 10));
        
        const reasoning = [
            `📊 Macro Scenario: ${primaryScenario.data.name}`,
            `🎯 ${sectorImpact.reason}`,
            `📈 Confidence: ${(primaryScenario.confidence * 100).toFixed(0)}%`,
            `⏱️ Duration: ${primaryScenario.data.duration}`
        ];
        
        // Add alternative scenarios if significant
        if (scenario.alternatives.length > 0) {
            const alt = scenario.alternatives[0];
            const altImpact = alt.data.impact?.[sector];
            if (altImpact && Math.abs(altImpact.score) > 10) {
                reasoning.push(`⚠️ Alternative: ${alt.data.name} (${(alt.confidence * 100).toFixed(0)}% probability)`);
            }
        }
        
        return {
            score: score,
            scenario: primaryScenario.scenario,
            confidence: primaryScenario.confidence,
            reasoning: reasoning,
            optionsStrategy: primaryScenario.data.optionsStrategy
        };
    },
    
    /**
     * Generate Fed meeting impact analysis
     */
    analyzeFedMeeting() {
        const fed = this.indicators.federalFundsRate;
        const daysUntilMeeting = this.getDaysUntil(fed.nextMeetingDate);
        
        if (daysUntilMeeting > 30) {
            return null; // Too far out
        }
        
        const expectedMove = fed.expectedChange;
        let impact = 'NEUTRAL';
        let sectors = {};
        
        if (expectedMove > 0) {
            // Rate hike expected
            impact = 'HAWKISH';
            sectors = {
                bullish: ['financials', 'energy'],
                bearish: ['tech', 'real_estate', 'utilities']
            };
        } else if (expectedMove < 0) {
            // Rate cut expected
            impact = 'DOVISH';
            sectors = {
                bullish: ['tech', 'real_estate', 'consumer_discretionary'],
                bearish: ['financials']
            };
        }
        
        return {
            daysUntil: daysUntilMeeting,
            date: fed.nextMeetingDate,
            expectedChange: expectedMove,
            impact: impact,
            affectedSectors: sectors,
            volatilityWarning: daysUntilMeeting < 7,
            reasoning: this.generateFedReasoning(expectedMove, daysUntilMeeting)
        };
    },
    
    /**
     * Generate reasoning for Fed meeting
     */
    generateFedReasoning(expectedChange, daysUntil) {
        if (expectedChange > 0) {
            return [
                `Fed likely to hike rates by ${expectedChange}bps in ${daysUntil} days`,
                'Higher rates → Bearish for growth stocks',
                'Higher rates → Bullish for financials',
                'Expect increased volatility as meeting approaches'
            ];
        } else if (expectedChange < 0) {
            return [
                `Fed likely to cut rates by ${Math.abs(expectedChange)}bps in ${daysUntil} days`,
                'Lower rates → Bullish for growth stocks',
                'Lower rates → Bearish for bank margins',
                'Risk-on environment expected'
            ];
        } else {
            return [
                `Fed expected to hold rates steady at ${this.indicators.federalFundsRate.current}%`,
                'Focus on Fed commentary and dot plot',
                'Moderate impact expected'
            ];
        }
    },
    
    /**
     * Calculate days until a date
     */
    getDaysUntil(dateString) {
        const targetDate = new Date(dateString);
        const now = new Date();
        const diffTime = targetDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Analyze inflation impact on sectors
     */
    analyzeInflationImpact() {
        const cpi = this.indicators.inflation.cpi;
        const target = this.indicators.inflation.target;
        const delta = cpi - target;
        
        let impactScore = {};
        
        if (delta > 1.5) {
            // High inflation environment
            impactScore = {
                'energy': 20,           // Beneficiary
                'materials': 18,        // Commodity exposure
                'financials': 15,       // Can raise rates
                'consumer_staples': 10, // Pricing power
                'utilities': -15,       // Fixed revenues
                'tech': -20,            // Growth valuations suffer
                'consumer_discretionary': -18  // Weak demand
            };
        } else if (delta < -0.5) {
            // Low inflation / deflation risk
            impactScore = {
                'tech': 20,             // Growth thrives
                'consumer_discretionary': 15, // Strong demand
                'utilities': 10,        // Bond proxy
                'energy': -20,          // Weak commodities
                'materials': -15,       // Weak pricing
                'financials': -10       // Lower rates
            };
        }
        
        return {
            currentCPI: cpi,
            targetCPI: target,
            delta: delta,
            environment: delta > 1.5 ? 'HIGH_INFLATION' : delta < -0.5 ? 'LOW_INFLATION' : 'NORMAL',
            sectorImpact: impactScore
        };
    }
};

// Export
window.MacroIntelligence = MacroIntelligence;
