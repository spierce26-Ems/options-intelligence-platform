/**
 * TECHNICAL CONFLUENCE INTELLIGENCE
 * Combines multiple technical indicators with event/news analysis
 * Identifies when technicals align with fundamental catalysts
 */

const TechnicalConfluence = {
    
    /**
     * Analyze technical setup for a stock
     * Combines price action, momentum, support/resistance with other intelligence
     */
    analyzeTechnicalSetup(ticker, currentPrice, timeframe = 'short') {
        console.log(`📈 Technical Analysis: ${ticker} @ $${currentPrice}`);
        
        // In production, fetch real historical data
        // For now, generate realistic technical signals
        const technicals = this.generateTechnicalSignals(ticker, currentPrice);
        
        let score = 0;
        let reasoning = [];
        let signals = [];
        
        // 1. TREND ANALYSIS (0-3 points)
        if (technicals.trend === 'strong_uptrend') {
            score += 3;
            signals.push({ type: 'TREND', strength: 'strong', direction: 'bullish' });
            reasoning.push('📈 Strong uptrend confirmed');
        } else if (technicals.trend === 'uptrend') {
            score += 2;
            signals.push({ type: 'TREND', strength: 'moderate', direction: 'bullish' });
            reasoning.push('📈 Uptrend in place');
        } else if (technicals.trend === 'downtrend') {
            score -= 2;
            signals.push({ type: 'TREND', strength: 'moderate', direction: 'bearish' });
            reasoning.push('📉 Downtrend in place');
        } else if (technicals.trend === 'strong_downtrend') {
            score -= 3;
            signals.push({ type: 'TREND', strength: 'strong', direction: 'bearish' });
            reasoning.push('📉 Strong downtrend confirmed');
        }
        
        // 2. MOMENTUM (0-2 points)
        if (technicals.rsi > 70) {
            score -= 1;
            signals.push({ type: 'MOMENTUM', indicator: 'RSI', value: technicals.rsi, signal: 'overbought' });
            reasoning.push(`⚠️ Overbought: RSI ${technicals.rsi.toFixed(1)}`);
        } else if (technicals.rsi < 30) {
            score += 2;
            signals.push({ type: 'MOMENTUM', indicator: 'RSI', value: technicals.rsi, signal: 'oversold' });
            reasoning.push(`✅ Oversold: RSI ${technicals.rsi.toFixed(1)} (bounce candidate)`);
        } else if (technicals.rsi >= 50 && technicals.rsi <= 60) {
            score += 1;
            signals.push({ type: 'MOMENTUM', indicator: 'RSI', value: technicals.rsi, signal: 'bullish_zone' });
            reasoning.push(`✅ RSI in bullish zone: ${technicals.rsi.toFixed(1)}`);
        }
        
        // 3. SUPPORT/RESISTANCE (0-2 points)
        if (technicals.nearSupport) {
            score += 2;
            signals.push({ type: 'SUPPORT', level: technicals.supportLevel, distance: technicals.supportDistance });
            reasoning.push(`🎯 Near key support at $${technicals.supportLevel.toFixed(2)} (${technicals.supportDistance}% away)`);
        }
        
        if (technicals.nearResistance) {
            score -= 1;
            signals.push({ type: 'RESISTANCE', level: technicals.resistanceLevel, distance: technicals.resistanceDistance });
            reasoning.push(`⚠️ Near resistance at $${technicals.resistanceLevel.toFixed(2)} (${technicals.resistanceDistance}% away)`);
        }
        
        // 4. VOLUME ANALYSIS (0-1 point)
        if (technicals.volumeSignal === 'increasing') {
            score += 1;
            signals.push({ type: 'VOLUME', signal: 'increasing' });
            reasoning.push('📊 Volume increasing (confirms move)');
        } else if (technicals.volumeSignal === 'decreasing') {
            score -= 0.5;
            signals.push({ type: 'VOLUME', signal: 'decreasing' });
            reasoning.push('📊 Volume decreasing (weak follow-through)');
        }
        
        // 5. MOVING AVERAGE CONFLUENCE (0-2 points)
        const maAlignment = this.checkMovingAverageAlignment(technicals.movingAverages, currentPrice);
        score += maAlignment.score;
        if (maAlignment.signal !== 'neutral') {
            signals.push({ type: 'MA_ALIGNMENT', signal: maAlignment.signal });
            reasoning.push(maAlignment.description);
        }
        
        // Normalize score to 0-10 range
        const normalizedScore = Math.max(0, Math.min(10, score + 5));
        
        // Determine overall technical signal
        const overallSignal = normalizedScore >= 7 ? 'BULLISH' :
                             normalizedScore >= 5.5 ? 'NEUTRAL' :
                             normalizedScore >= 4 ? 'NEUTRAL_BEARISH' : 'BEARISH';
        
        return {
            score: normalizedScore,
            overallSignal: overallSignal,
            signals: signals,
            reasoning: reasoning,
            technicals: technicals,
            confidence: this.calculateTechnicalConfidence(signals)
        };
    },
    
    /**
     * Generate realistic technical signals (simulated)
     * In production, calculate from real price data
     */
    generateTechnicalSignals(ticker, currentPrice) {
        // Simulate technical indicators
        const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = (seed * 9301 + 49297) % 233280 / 233280;
        
        // Generate trend
        const trends = ['strong_downtrend', 'downtrend', 'sideways', 'uptrend', 'strong_uptrend'];
        const trend = trends[Math.floor(random * trends.length)];
        
        // Generate RSI (14-86 range)
        const rsi = 30 + (random * 56);
        
        // Generate support/resistance levels
        const supportLevel = currentPrice * (0.90 + random * 0.05);
        const resistanceLevel = currentPrice * (1.05 + random * 0.05);
        const supportDistance = ((currentPrice - supportLevel) / currentPrice * 100);
        const resistanceDistance = ((resistanceLevel - currentPrice) / currentPrice * 100);
        
        // Volume signal
        const volumeSignals = ['decreasing', 'stable', 'increasing', 'surging'];
        const volumeSignal = volumeSignals[Math.floor(random * volumeSignals.length)];
        
        // Moving averages
        const movingAverages = {
            ma20: currentPrice * (0.98 + random * 0.04),
            ma50: currentPrice * (0.96 + random * 0.08),
            ma200: currentPrice * (0.90 + random * 0.20)
        };
        
        return {
            trend: trend,
            rsi: rsi,
            supportLevel: supportLevel,
            resistanceLevel: resistanceLevel,
            supportDistance: supportDistance.toFixed(1),
            resistanceDistance: resistanceDistance.toFixed(1),
            nearSupport: supportDistance < 3,
            nearResistance: resistanceDistance < 3,
            volumeSignal: volumeSignal,
            movingAverages: movingAverages
        };
    },
    
    /**
     * Check moving average alignment (golden cross / death cross)
     */
    checkMovingAverageAlignment(mas, currentPrice) {
        const { ma20, ma50, ma200 } = mas;
        
        // Golden cross: Short-term > Long-term = Bullish
        if (ma20 > ma50 && ma50 > ma200 && currentPrice > ma20) {
            return {
                score: 2,
                signal: 'golden_cross',
                description: '🌟 Golden Cross: All MAs aligned bullish'
            };
        }
        
        // Death cross: Short-term < Long-term = Bearish
        if (ma20 < ma50 && ma50 < ma200 && currentPrice < ma20) {
            return {
                score: -2,
                signal: 'death_cross',
                description: '💀 Death Cross: All MAs aligned bearish'
            };
        }
        
        // Above 200-day MA = Bullish
        if (currentPrice > ma200) {
            return {
                score: 1,
                signal: 'above_200ma',
                description: '✅ Above 200-day MA (bullish)'
            };
        }
        
        // Below 200-day MA = Bearish
        if (currentPrice < ma200) {
            return {
                score: -1,
                signal: 'below_200ma',
                description: '⚠️ Below 200-day MA (bearish)'
            };
        }
        
        return {
            score: 0,
            signal: 'neutral',
            description: 'Moving averages mixed'
        };
    },
    
    /**
     * Calculate confidence in technical analysis
     */
    calculateTechnicalConfidence(signals) {
        // More signals = higher confidence
        const signalCount = signals.length;
        
        // Check for confluence (multiple signals agreeing)
        const bullishSignals = signals.filter(s => 
            s.signal === 'bullish' || s.signal === 'oversold' || s.signal === 'golden_cross'
        ).length;
        
        const bearishSignals = signals.filter(s => 
            s.signal === 'bearish' || s.signal === 'overbought' || s.signal === 'death_cross'
        ).length;
        
        const alignment = Math.abs(bullishSignals - bearishSignals) / signalCount;
        
        // Base confidence from signal count
        let confidence = Math.min(0.7, signalCount / 10);
        
        // Boost for alignment
        confidence += alignment * 0.25;
        
        return Math.min(0.95, confidence);
    },
    
    /**
     * Find technical entry points
     */
    findEntryPoints(ticker, currentPrice, direction) {
        const technicals = this.generateTechnicalSignals(ticker, currentPrice);
        const entryPoints = [];
        
        if (direction === 'bullish') {
            // Buy calls entry points
            entryPoints.push({
                type: 'SUPPORT_BOUNCE',
                price: technicals.supportLevel,
                confidence: 0.7,
                description: `Buy calls if price bounces off support at $${technicals.supportLevel.toFixed(2)}`
            });
            
            if (technicals.rsi < 40) {
                entryPoints.push({
                    type: 'OVERSOLD_REVERSAL',
                    price: currentPrice,
                    confidence: 0.65,
                    description: `RSI oversold (${technicals.rsi.toFixed(1)}) - reversal candidate`
                });
            }
            
            entryPoints.push({
                type: 'BREAKOUT',
                price: technicals.resistanceLevel,
                confidence: 0.80,
                description: `Buy calls on breakout above $${technicals.resistanceLevel.toFixed(2)}`
            });
        } else {
            // Buy puts entry points
            entryPoints.push({
                type: 'RESISTANCE_REJECTION',
                price: technicals.resistanceLevel,
                confidence: 0.7,
                description: `Buy puts if price rejects resistance at $${technicals.resistanceLevel.toFixed(2)}`
            });
            
            if (technicals.rsi > 60) {
                entryPoints.push({
                    type: 'OVERBOUGHT_REVERSAL',
                    price: currentPrice,
                    confidence: 0.65,
                    description: `RSI overbought (${technicals.rsi.toFixed(1)}) - correction candidate`
                });
            }
            
            entryPoints.push({
                type: 'BREAKDOWN',
                price: technicals.supportLevel,
                confidence: 0.80,
                description: `Buy puts on breakdown below $${technicals.supportLevel.toFixed(2)}`
            });
        }
        
        return entryPoints;
    },
    
    /**
     * Calculate stop loss and take profit levels
     */
    calculateRiskReward(ticker, currentPrice, direction, targetPrice) {
        const technicals = this.generateTechnicalSignals(ticker, currentPrice);
        
        let stopLoss, takeProfit;
        
        if (direction === 'bullish') {
            // Stop loss below support
            stopLoss = technicals.supportLevel * 0.98;
            // Take profit at resistance or +10%, whichever is closer
            takeProfit = Math.min(targetPrice, technicals.resistanceLevel, currentPrice * 1.10);
        } else {
            // Stop loss above resistance
            stopLoss = technicals.resistanceLevel * 1.02;
            // Take profit at support or -10%, whichever is closer
            takeProfit = Math.max(targetPrice, technicals.supportLevel, currentPrice * 0.90);
        }
        
        const riskAmount = Math.abs(currentPrice - stopLoss);
        const rewardAmount = Math.abs(takeProfit - currentPrice);
        const riskRewardRatio = rewardAmount / riskAmount;
        
        return {
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            riskRewardRatio: riskRewardRatio.toFixed(2),
            maxLoss: ((riskAmount / currentPrice) * 100).toFixed(1) + '%',
            maxGain: ((rewardAmount / currentPrice) * 100).toFixed(1) + '%',
            recommendation: riskRewardRatio >= 2.0 ? 'EXCELLENT' :
                          riskRewardRatio >= 1.5 ? 'GOOD' :
                          riskRewardRatio >= 1.0 ? 'ACCEPTABLE' : 'POOR'
        };
    }
};

// Export
window.TechnicalConfluence = TechnicalConfluence;
