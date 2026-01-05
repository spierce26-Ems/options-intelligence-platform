/**
 * ENHANCED HOT PICKS ENGINE - INSTITUTIONAL GRADE
 * Integrates ALL 7 intelligence layers:
 * 1. Event Intelligence
 * 2. News Sentiment
 * 3. Supply Chain Correlation
 * 4. Cross-Asset Signals
 * 5. Macro Economic
 * 6. Technical Confluence
 * 7. Original Hot Picks Algorithm
 */

const EnhancedHotPicks = {
    
    /**
     * Analyze world event and find best options opportunities
     * This is the MASTER function that orchestrates everything
     */
    async analyzeEventAndFindOpportunities(eventDescription, timeframe = 'short', maxResults = 20) {
        console.log('🧠🧠🧠 ENHANCED HOT PICKS ENGINE - INSTITUTIONAL GRADE');
        console.log('================================================');
        console.log('📰 Event:', eventDescription);
        console.log('⏱️ Timeframe:', timeframe);
        console.log('================================================\n');
        
        const startTime = Date.now();
        
        // STEP 1: Analyze the world event
        const eventAnalysis = await MasterIntelligence.analyzeWorldEvent(eventDescription);
        
        if (!eventAnalysis) {
            console.error('❌ Failed to analyze event');
            return null;
        }
        
        console.log(`✅ Event Analysis Complete: ${eventAnalysis.opportunities.length} opportunities identified\n`);
        
        // STEP 2: Enhance each opportunity with additional intelligence layers
        const enhancedOpportunities = [];
        
        for (const opportunity of eventAnalysis.opportunities.slice(0, 30)) {
            console.log(`\n🔍 Deep analysis: ${opportunity.ticker}...`);
            
            const enhanced = await this.enhanceOpportunity(
                opportunity,
                eventAnalysis.metadata,
                timeframe
            );
            
            enhancedOpportunities.push(enhanced);
        }
        
        // STEP 3: Re-rank by enhanced total score
        enhancedOpportunities.sort((a, b) => b.enhancedScore.total - a.enhancedScore.total);
        
        // STEP 4: Generate final recommendations
        const topPicks = enhancedOpportunities.slice(0, maxResults);
        
        const processingTime = Date.now() - startTime;
        
        console.log('\n================================================');
        console.log('✅ ANALYSIS COMPLETE');
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`🎯 Top Pick: ${topPicks[0].ticker} (Score: ${topPicks[0].enhancedScore.total.toFixed(1)}/100)`);
        console.log('================================================\n');
        
        return {
            event: eventDescription,
            eventAnalysis: eventAnalysis,
            opportunities: topPicks,
            marketRegime: CrossAssetIntelligence.detectMarketRegime(),
            macroScenario: MacroIntelligence.detectMacroScenario(),
            processingTime: processingTime,
            timestamp: Date.now()
        };
    },
    
    /**
     * Enhance a single opportunity with all intelligence layers
     */
    async enhanceOpportunity(baseOpportunity, eventMetadata, timeframe) {
        const ticker = baseOpportunity.ticker;
        const sector = baseOpportunity.sector;
        
        // Get stock price (use real data if available)
        let stockPrice = 100; // Default
        try {
            if (typeof RealTimeData !== 'undefined') {
                const priceData = await RealTimeData.getStockPrice(ticker);
                stockPrice = priceData.price;
            }
        } catch (err) {
            console.log(`⚠️ Could not fetch real price for ${ticker}, using simulated`);
            stockPrice = 50 + Math.random() * 200;
        }
        
        // LAYER 4: Cross-Asset Correlation Analysis
        const crossAssetAnalysis = CrossAssetIntelligence.analyzeCrossAssetSignals(sector, ticker);
        
        // LAYER 5: Macro Economic Analysis
        const macroAnalysis = MacroIntelligence.calculateMacroScore(sector, timeframe);
        
        // LAYER 6: Technical Confluence Analysis
        const technicalAnalysis = TechnicalConfluence.analyzeTechnicalSetup(ticker, stockPrice, timeframe);
        
        // CALCULATE ENHANCED SCORE (0-100)
        const enhancedScore = {
            // From Master Intelligence (event + news + supply chain + sector)
            eventImpact: baseOpportunity.scores.eventImpact,        // 0-30
            newsSentiment: baseOpportunity.scores.newsSentiment,    // 0-20
            supplyChain: baseOpportunity.scores.supplyChainEffect,  // 0-25
            sectorCorrelation: baseOpportunity.scores.sectorCorrelation, // 0-15
            
            // New enhanced layers
            crossAsset: crossAssetAnalysis.score,                   // 0-25 (scaled from 0-25)
            macroEconomic: macroAnalysis.score,                     // 0-20
            technical: technicalAnalysis.score,                     // 0-10
            
            // Calculate total
            total: 0
        };
        
        // Sum all components
        enhancedScore.total = 
            enhancedScore.eventImpact +
            enhancedScore.newsSentiment +
            enhancedScore.supplyChain +
            enhancedScore.sectorCorrelation +
            (enhancedScore.crossAsset * 0.6) +  // Scale to ~15 points max
            enhancedScore.macroEconomic +
            enhancedScore.technical;
        
        // Cap at 100
        enhancedScore.total = Math.min(100, enhancedScore.total);
        
        // Calculate overall confidence
        const confidence = this.calculateOverallConfidence(
            baseOpportunity.confidence,
            technicalAnalysis.confidence,
            macroAnalysis.confidence,
            crossAssetAnalysis.signals.length
        );
        
        // Find best options setup
        const optionsSetup = await this.findBestOptionsSetup(
            ticker,
            stockPrice,
            baseOpportunity.primaryDirection,
            timeframe,
            enhancedScore.total
        );
        
        // Calculate risk/reward
        const riskReward = TechnicalConfluence.calculateRiskReward(
            ticker,
            stockPrice,
            baseOpportunity.primaryDirection,
            optionsSetup.targetPrice
        );
        
        // Generate entry points
        const entryPoints = TechnicalConfluence.findEntryPoints(
            ticker,
            stockPrice,
            baseOpportunity.primaryDirection
        );
        
        // Compile all reasoning
        const allReasoning = [
            '🎯 EVENT IMPACT:',
            ...baseOpportunity.reasoning.slice(0, 3),
            '',
            '📊 CROSS-ASSET SIGNALS:',
            ...crossAssetAnalysis.signals.slice(0, 3).map(s => s.explanation),
            '',
            '🌍 MACRO ECONOMIC:',
            ...macroAnalysis.reasoning.slice(0, 3),
            '',
            '📈 TECHNICAL ANALYSIS:',
            ...technicalAnalysis.reasoning.slice(0, 3)
        ];
        
        return {
            // Base data
            ticker: ticker,
            sector: sector,
            stockPrice: stockPrice,
            direction: baseOpportunity.primaryDirection,
            
            // Enhanced scoring
            enhancedScore: enhancedScore,
            confidence: confidence,
            
            // Options recommendation
            optionsSetup: optionsSetup,
            riskReward: riskReward,
            entryPoints: entryPoints,
            
            // Intelligence layers
            crossAssetAnalysis: crossAssetAnalysis,
            macroAnalysis: macroAnalysis,
            technicalAnalysis: technicalAnalysis,
            
            // Correlated opportunities
            correlatedStocks: baseOpportunity.correlatedStocks.slice(0, 5),
            
            // News
            newsArticles: baseOpportunity.newsArticles.slice(0, 5),
            
            // Reasoning
            reasoning: allReasoning,
            
            // Action
            action: this.determineEnhancedAction(enhancedScore.total, confidence, baseOpportunity.primaryDirection)
        };
    },
    
    /**
     * Find best options setup (calls vs puts, strikes, expiration)
     */
    async findBestOptionsSetup(ticker, stockPrice, direction, timeframe, score) {
        // Determine expiration based on timeframe
        const dteMap = {
            'short': { min: 1, max: 7, recommended: 3 },
            'medium': { min: 8, max: 30, recommended: 14 },
            'long': { min: 31, max: 90, recommended: 45 }
        };
        
        const dte = dteMap[timeframe] || dteMap['short'];
        const expDate = new Date(Date.now() + dte.recommended * 24 * 60 * 60 * 1000);
        
        // Determine strike based on score and direction
        let strikeSelection, strikePrice, optionType;
        
        if (direction === 'positive') {
            optionType = 'CALL';
            
            // High conviction = ATM or ITM
            if (score >= 80) {
                strikeSelection = 'ITM';
                strikePrice = this.roundToStrike(stockPrice * 0.98);
            } else if (score >= 60) {
                strikeSelection = 'ATM';
                strikePrice = this.roundToStrike(stockPrice);
            } else {
                strikeSelection = 'OTM';
                strikePrice = this.roundToStrike(stockPrice * 1.02);
            }
        } else {
            optionType = 'PUT';
            
            // High conviction = ATM or ITM
            if (score >= 80) {
                strikeSelection = 'ITM';
                strikePrice = this.roundToStrike(stockPrice * 1.02);
            } else if (score >= 60) {
                strikeSelection = 'ATM';
                strikePrice = this.roundToStrike(stockPrice);
            } else {
                strikeSelection = 'OTM';
                strikePrice = this.roundToStrike(stockPrice * 0.98);
            }
        }
        
        // Estimate option price (simplified)
        const estimatedPremium = this.estimateOptionPremium(stockPrice, strikePrice, dte.recommended, optionType);
        
        // Calculate target and stop
        const moveMagnitude = score >= 80 ? 0.15 : score >= 60 ? 0.10 : 0.07;
        const targetPrice = direction === 'positive' ? 
            stockPrice * (1 + moveMagnitude) :
            stockPrice * (1 - moveMagnitude);
        
        return {
            type: optionType,
            strike: strikePrice,
            strikeSelection: strikeSelection,
            expiration: expDate.toISOString().split('T')[0],
            dte: dte.recommended,
            estimatedPremium: estimatedPremium,
            estimatedCost: estimatedPremium * 100,
            targetPrice: targetPrice.toFixed(2),
            maxProfit: ((targetPrice - stockPrice) / stockPrice * 100).toFixed(1) + '%',
            breakeven: (strikePrice + (direction === 'positive' ? estimatedPremium : -estimatedPremium)).toFixed(2)
        };
    },
    
    /**
     * Round price to nearest option strike
     */
    roundToStrike(price) {
        if (price < 25) return Math.round(price * 2) / 2;        // $0.50 strikes
        if (price < 200) return Math.round(price);                // $1.00 strikes
        return Math.round(price / 5) * 5;                         // $5.00 strikes
    },
    
    /**
     * Estimate option premium (simplified Black-Scholes approximation)
     */
    estimateOptionPremium(stockPrice, strike, dte, optionType) {
        const timeValue = Math.sqrt(dte / 365) * stockPrice * 0.3; // Assume 30% IV
        const intrinsicValue = optionType === 'CALL' ?
            Math.max(0, stockPrice - strike) :
            Math.max(0, strike - stockPrice);
        
        return intrinsicValue + timeValue;
    },
    
    /**
     * Calculate overall confidence from all sources
     */
    calculateOverallConfidence(baseConfidence, technicalConfidence, macroConfidence, signalCount) {
        // Weighted average
        const weights = {
            base: 0.35,
            technical: 0.25,
            macro: 0.25,
            signals: 0.15
        };
        
        const signalConfidence = Math.min(1, signalCount / 10);
        
        const overall = 
            baseConfidence * weights.base +
            technicalConfidence * weights.technical +
            macroConfidence * weights.macro +
            signalConfidence * weights.signals;
        
        return Math.min(0.95, overall);
    },
    
    /**
     * Determine final action recommendation
     */
    determineEnhancedAction(score, confidence, direction) {
        if (score < 50 || confidence < 0.50) {
            return {
                type: 'PASS',
                conviction: 'NONE',
                reason: 'Insufficient score or confidence',
                positionSize: '0%'
            };
        }
        
        if (score >= 85 && confidence >= 0.80) {
            return {
                type: direction === 'positive' ? 'STRONG BUY CALLS' : 'STRONG BUY PUTS',
                conviction: 'VERY HIGH',
                reason: 'Multiple intelligence layers confirm opportunity',
                positionSize: '3-5% of portfolio',
                urgency: 'HIGH'
            };
        }
        
        if (score >= 70 && confidence >= 0.70) {
            return {
                type: direction === 'positive' ? 'BUY CALLS' : 'BUY PUTS',
                conviction: 'HIGH',
                reason: 'Strong multi-factor confluence',
                positionSize: '2-3% of portfolio',
                urgency: 'MEDIUM'
            };
        }
        
        if (score >= 60 && confidence >= 0.60) {
            return {
                type: direction === 'positive' ? 'BUY CALLS' : 'BUY PUTS',
                conviction: 'MODERATE',
                reason: 'Good opportunity with some risks',
                positionSize: '1-2% of portfolio',
                urgency: 'LOW'
            };
        }
        
        return {
            type: 'WATCH',
            conviction: 'LOW',
            reason: 'Monitor for better entry',
            positionSize: '0%',
            urgency: 'NONE'
        };
    }
};

// Export
window.EnhancedHotPicks = EnhancedHotPicks;
