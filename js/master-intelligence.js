/**
 * MASTER INTELLIGENCE ORCHESTRATOR
 * Combines all intelligence layers into final prediction
 */

const MasterIntelligence = {
    
    /**
     * Analyze world event and generate complete intelligence report
     */
    async analyzeWorldEvent(eventDescription) {
        console.log('🧠 Master Intelligence: Analyzing world event...');
        console.log('📰 Event:', eventDescription);
        
        const startTime = Date.now();
        
        // STEP 1: Classify the event
        const eventClassification = EventIntelligence.classifyEvent(eventDescription);
        const eventMetadata = EventIntelligence.getEventMetadata(eventClassification);
        
        if (!eventMetadata) {
            console.warn('⚠️ Could not classify event');
            return null;
        }
        
        console.log('✅ Event classified:', eventClassification.secondaryType);
        console.log('📊 Impact type:', eventMetadata.impact);
        console.log('⏱️ Duration:', eventMetadata.duration);
        
        // STEP 2: Identify affected sectors and stocks
        const affectedSectors = [
            ...Object.keys(eventMetadata.sectors.positive),
            ...Object.keys(eventMetadata.sectors.negative)
        ];
        
        // STEP 3: Map sectors to specific stocks
        const stockUniverse = this.mapSectorsToStocks(eventMetadata.sectors);
        
        console.log(`📈 Found ${stockUniverse.positive.length} bullish opportunities`);
        console.log(`📉 Found ${stockUniverse.negative.length} bearish opportunities`);
        
        // STEP 4: Calculate cascade effects for each stock
        const detailedAnalysis = [];
        
        for (const stock of [...stockUniverse.positive, ...stockUniverse.negative]) {
            const analysis = await this.analyzeStockOpportunity(
                stock,
                eventMetadata,
                eventClassification
            );
            detailedAnalysis.push(analysis);
        }
        
        // STEP 5: Rank by total score
        detailedAnalysis.sort((a, b) => b.totalScore - a.totalScore);
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Analysis complete in ${processingTime}ms`);
        console.log(`🎯 Top opportunity: ${detailedAnalysis[0].ticker} (score: ${detailedAnalysis[0].totalScore})`);
        
        return {
            event: eventDescription,
            classification: eventClassification,
            metadata: eventMetadata,
            opportunities: detailedAnalysis,
            timestamp: Date.now(),
            processingTime: processingTime
        };
    },
    
    /**
     * Deep analysis of individual stock opportunity
     */
    async analyzeStockOpportunity(stock, eventMetadata, eventClassification) {
        const ticker = stock.ticker;
        const primaryDirection = stock.impact; // 'positive' or 'negative'
        
        // Initialize scoring components
        let scores = {
            eventImpact: 0,
            newsSentiment: 0,
            supplyChainEffect: 0,
            sectorCorrelation: 0,
            technicalAlignment: 0,
            totalScore: 0
        };
        
        let reasoning = [];
        
        // 1. DIRECT EVENT IMPACT (0-30 points)
        const eventImpact = this.calculateEventImpact(stock, eventMetadata);
        scores.eventImpact = eventImpact.score;
        reasoning.push(...eventImpact.reasons);
        
        // 2. NEWS SENTIMENT (0-20 points)
        const newsSentiment = await this.analyzeNewsSentiment(ticker, primaryDirection);
        scores.newsSentiment = newsSentiment.score;
        reasoning.push(...newsSentiment.reasons);
        
        // 3. SUPPLY CHAIN CASCADE (0-25 points)
        const cascadeEffect = this.analyzeSupplyChainCascade(ticker, primaryDirection, eventMetadata);
        scores.supplyChainEffect = cascadeEffect.score;
        reasoning.push(...cascadeEffect.reasons);
        
        // 4. SECTOR CORRELATION (0-15 points)
        const sectorEffect = this.analyzeSectorCorrelation(stock.sector, eventMetadata);
        scores.sectorCorrelation = sectorEffect.score;
        reasoning.push(...sectorEffect.reasons);
        
        // 5. TECHNICAL ALIGNMENT (0-10 points)
        // This would integrate with existing technical analysis
        scores.technicalAlignment = 5; // Placeholder
        
        // CALCULATE TOTAL SCORE (0-100)
        scores.totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        
        // Calculate confidence based on data quality
        const confidence = this.calculateConfidence(scores, newsSentiment.articleCount);
        
        // Determine recommended action
        const action = this.determineAction(scores.totalScore, primaryDirection, confidence);
        
        return {
            ticker: ticker,
            sector: stock.sector,
            primaryDirection: primaryDirection,
            scores: scores,
            confidence: confidence,
            action: action,
            reasoning: reasoning,
            totalScore: scores.totalScore,
            correlatedStocks: cascadeEffect.correlatedStocks || [],
            newsArticles: newsSentiment.articles || []
        };
    },
    
    /**
     * Calculate direct impact from event
     */
    calculateEventImpact(stock, eventMetadata) {
        let score = 0;
        let reasons = [];
        
        // Base impact from event classification
        const impactStrength = {
            'immediate': 30,
            'delayed': 20,
            'long': 15
        };
        
        score = impactStrength[eventMetadata.impact] || 15;
        
        // Adjust for volatility
        if (eventMetadata.volatility === 'extreme') {
            score *= 1.2;
            reasons.push('⚡ Extreme volatility event');
        }
        
        // Time decay
        const hoursSinceEvent = 0; // Assuming immediate analysis
        const decay = EventIntelligence.calculateTimeDecay(eventMetadata, hoursSinceEvent);
        score *= decay;
        
        // Direction bonus
        if (stock.impact === 'positive') {
            reasons.push(`🎯 Direct beneficiary of ${eventMetadata.classification.secondaryType}`);
        } else {
            reasons.push(`⚠️ Negatively impacted by ${eventMetadata.classification.secondaryType}`);
        }
        
        return { score, reasons };
    },
    
    /**
     * Analyze news sentiment for ticker
     */
    async analyzeNewsSentiment(ticker, expectedDirection) {
        // Fetch recent news
        const news = await NewsSentimentEngine.fetchNews(ticker, 24);
        const sentiment = NewsSentimentEngine.calculateAggregateSentiment(news);
        
        let score = 0;
        let reasons = [];
        
        // Sentiment score: -20 to +20
        score = sentiment.score * 20;
        
        // Alignment bonus: if sentiment matches expected direction
        const sentimentDirection = sentiment.score > 0 ? 'positive' : 'negative';
        if (sentimentDirection === expectedDirection) {
            score *= 1.3;
            reasons.push(`✅ News sentiment aligns with event impact (${sentiment.label})`);
        } else {
            score *= 0.7;
            reasons.push(`⚠️ Mixed signals: News is ${sentiment.label} but event suggests ${expectedDirection}`);
        }
        
        // Confidence from article count
        if (news.length > 5) {
            reasons.push(`📰 High news coverage (${news.length} articles)`);
        }
        
        // Recent trend
        if (sentiment.recentTrend === 'improving') {
            score *= 1.1;
            reasons.push('📈 Sentiment improving in recent hours');
        } else if (sentiment.recentTrend === 'deteriorating') {
            score *= 0.9;
            reasons.push('📉 Sentiment deteriorating recently');
        }
        
        return {
            score: Math.max(-20, Math.min(20, score)),
            reasons,
            articles: news,
            articleCount: news.length,
            sentimentLabel: sentiment.label
        };
    },
    
    /**
     * Analyze supply chain cascade effects
     */
    analyzeSupplyChainCascade(ticker, expectedDirection, eventMetadata) {
        // Calculate cascade from this stock's movement
        const cascadeEffects = SupplyChainIntelligence.calculateCascadeEffect(
            ticker,
            expectedDirection === 'positive' ? 10 : -10, // Assume 10% move
            'short'
        );
        
        let score = 0;
        let reasons = [];
        
        // Score based on number and strength of correlated stocks
        if (cascadeEffects.length > 0) {
            score = Math.min(25, cascadeEffects.length * 5);
            reasons.push(`🔗 ${cascadeEffects.length} correlated stocks identified`);
            
            // Highlight strongest correlations
            const topCorrelations = cascadeEffects.slice(0, 3);
            for (const corr of topCorrelations) {
                reasons.push(`  → ${corr.ticker}: ${corr.reasoning}`);
            }
        }
        
        return {
            score,
            reasons,
            correlatedStocks: cascadeEffects
        };
    },
    
    /**
     * Analyze sector-level correlation
     */
    analyzeSectorCorrelation(sector, eventMetadata) {
        const affectedSectors = [
            ...Object.keys(eventMetadata.sectors.positive),
            ...Object.keys(eventMetadata.sectors.negative)
        ];
        
        let score = 0;
        let reasons = [];
        
        // Check if this stock's sector is directly affected
        if (affectedSectors.includes(sector)) {
            score = 15;
            reasons.push(`✅ ${sector} sector directly affected by event`);
        } else {
            // Check for correlation with affected sectors
            const opportunities = SupplyChainIntelligence.findSectorOpportunities(
                'event',
                affectedSectors
            );
            
            const relevantCorr = opportunities.find(opp => opp.targetSector === sector);
            if (relevantCorr) {
                score = Math.abs(relevantCorr.correlation) * 15;
                reasons.push(`🔗 ${sector} correlated with affected sectors (${relevantCorr.correlation.toFixed(2)})`);
            }
        }
        
        return { score, reasons };
    },
    
    /**
     * Calculate overall confidence
     */
    calculateConfidence(scores, newsArticleCount) {
        let confidence = 0.5; // Base confidence
        
        // Higher scores = higher confidence
        if (scores.totalScore > 70) confidence += 0.2;
        else if (scores.totalScore > 50) confidence += 0.1;
        
        // More news coverage = higher confidence
        if (newsArticleCount > 10) confidence += 0.2;
        else if (newsArticleCount > 5) confidence += 0.1;
        
        // Supply chain correlation adds confidence
        if (scores.supplyChainEffect > 15) confidence += 0.1;
        
        return Math.min(0.95, confidence);
    },
    
    /**
     * Determine recommended trading action
     */
    determineAction(totalScore, direction, confidence) {
        if (totalScore < 40 || confidence < 0.5) {
            return { type: 'PASS', reason: 'Insufficient score or confidence' };
        }
        
        if (totalScore >= 75 && confidence >= 0.7) {
            return {
                type: direction === 'positive' ? 'STRONG_BUY_CALLS' : 'STRONG_BUY_PUTS',
                timeframe: 'short',
                reason: 'High conviction opportunity'
            };
        }
        
        if (totalScore >= 60 && confidence >= 0.6) {
            return {
                type: direction === 'positive' ? 'BUY_CALLS' : 'BUY_PUTS',
                timeframe: 'medium',
                reason: 'Moderate conviction opportunity'
            };
        }
        
        return {
            type: 'WATCH',
            reason: 'Potential opportunity, monitor closely'
        };
    },
    
    /**
     * Map sectors to specific stocks
     */
    mapSectorsToStocks(sectors) {
        const sectorStockMap = {
            'defense': [
                { ticker: 'LMT', sector: 'defense' },
                { ticker: 'RTX', sector: 'defense' },
                { ticker: 'NOC', sector: 'defense' },
                { ticker: 'GD', sector: 'defense' },
                { ticker: 'BA', sector: 'aerospace_defense' }
            ],
            'oil': [
                { ticker: 'XOM', sector: 'oil' },
                { ticker: 'CVX', sector: 'oil' },
                { ticker: 'COP', sector: 'oil' },
                { ticker: 'OXY', sector: 'oil' }
            ],
            'oil_services': [
                { ticker: 'SLB', sector: 'oil_services' },
                { ticker: 'HAL', sector: 'oil_services' },
                { ticker: 'BKR', sector: 'oil_services' }
            ],
            'cybersecurity': [
                { ticker: 'CRWD', sector: 'cybersecurity' },
                { ticker: 'PANW', sector: 'cybersecurity' },
                { ticker: 'ZS', sector: 'cybersecurity' }
            ],
            'airlines': [
                { ticker: 'DAL', sector: 'airlines' },
                { ticker: 'UAL', sector: 'airlines' },
                { ticker: 'AAL', sector: 'airlines' },
                { ticker: 'LUV', sector: 'airlines' }
            ]
        };
        
        const positive = [];
        const negative = [];
        
        for (const sector of sectors.positive || []) {
            const stocks = sectorStockMap[sector] || [];
            positive.push(...stocks.map(s => ({ ...s, impact: 'positive' })));
        }
        
        for (const sector of sectors.negative || []) {
            const stocks = sectorStockMap[sector] || [];
            negative.push(...stocks.map(s => ({ ...s, impact: 'negative' })));
        }
        
        return { positive, negative };
    }
};

// Export
window.MasterIntelligence = MasterIntelligence;
