/**
 * CALCULATIONS MODULE
 * Advanced options pricing models and risk calculations
 */

/**
 * Black-Scholes Option Pricing Model
 */
function blackScholes(S, K, T, r, sigma, type = 'call') {
    if (T <= 0) return type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const nd1 = normalCDF(d1);
    const nd2 = normalCDF(d2);
    
    if (type === 'call') {
        return S * nd1 - K * Math.exp(-r * T) * nd2;
    } else {
        return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    }
}

/**
 * Normal Cumulative Distribution Function
 */
function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
}

/**
 * Normal Probability Density Function
 */
function normalPDF(x) {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate Probability of Profit (POP)
 */
function calculatePOP(strategy, stockPrice, strikePrice, premium, type, dte) {
    const breakEven = type === 'call' ? 
        strikePrice + premium : 
        strikePrice - premium;
    
    // Estimate move using volatility
    const expectedMove = stockPrice * 0.01 * Math.sqrt(dte / 365); // 1% daily vol
    
    // Calculate probability using normal distribution
    const z = (breakEven - stockPrice) / expectedMove;
    
    if (strategy === 'long-call' || strategy === 'long-put') {
        return (1 - normalCDF(Math.abs(z))) * 100;
    } else if (strategy === 'short-call' || strategy === 'short-put') {
        return normalCDF(Math.abs(z)) * 100;
    }
    
    return 50; // Default
}

/**
 * Calculate Expected Move (from straddle pricing)
 */
function calculateExpectedMove(atmCallPrice, atmPutPrice, stockPrice) {
    const straddlePrice = atmCallPrice + atmPutPrice;
    const expectedMove = straddlePrice / stockPrice;
    return {
        dollars: straddlePrice,
        percent: expectedMove * 100,
        upperBound: stockPrice * (1 + expectedMove),
        lowerBound: stockPrice * (1 - expectedMove)
    };
}

/**
 * Calculate Max Pain (price where most options expire worthless)
 */
function calculateMaxPain(optionsChain, expiration) {
    const relevantOptions = optionsChain.filter(opt => opt.expiration === expiration);
    
    if (relevantOptions.length === 0) return null;
    
    // Get all strikes
    const strikes = [...new Set(relevantOptions.map(opt => opt.strike))].sort((a, b) => a - b);
    
    let maxPainStrike = strikes[Math.floor(strikes.length / 2)];
    let minPain = Infinity;
    
    // Calculate pain for each strike
    for (const strike of strikes) {
        let pain = 0;
        
        for (const option of relevantOptions) {
            if (option.type === 'call' && strike > option.strike) {
                pain += (strike - option.strike) * option.openInterest;
            } else if (option.type === 'put' && strike < option.strike) {
                pain += (option.strike - strike) * option.openInterest;
            }
        }
        
        if (pain < minPain) {
            minPain = pain;
            maxPainStrike = strike;
        }
    }
    
    return maxPainStrike;
}

/**
 * Calculate Put/Call Ratio
 */
function calculatePutCallRatio(optionsChain) {
    let callVolume = 0;
    let putVolume = 0;
    let callOI = 0;
    let putOI = 0;
    
    for (const option of optionsChain) {
        if (option.type === 'call') {
            callVolume += option.volume;
            callOI += option.openInterest;
        } else {
            putVolume += option.volume;
            putOI += option.openInterest;
        }
    }
    
    return {
        volumeRatio: callVolume > 0 ? putVolume / callVolume : 0,
        oiRatio: callOI > 0 ? putOI / callOI : 0,
        sentiment: putVolume / callVolume > 1 ? 'Bearish' : 'Bullish'
    };
}

/**
 * Calculate Implied Volatility using Newton-Raphson method
 */
function calculateImpliedVolatility(optionPrice, S, K, T, r, type, guess = 0.3) {
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    let sigma = guess;
    
    for (let i = 0; i < maxIterations; i++) {
        const price = blackScholes(S, K, T, r, sigma, type);
        const diff = optionPrice - price;
        
        if (Math.abs(diff) < tolerance) {
            return sigma;
        }
        
        // Vega (derivative of price with respect to sigma)
        const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
        const vega = S * normalPDF(d1) * Math.sqrt(T);
        
        if (vega === 0) break;
        
        sigma = sigma + diff / vega;
        
        if (sigma <= 0) sigma = tolerance;
    }
    
    return sigma;
}

/**
 * Calculate Greek sensitivities for a portfolio
 */
function calculatePortfolioGreeks(positions) {
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    
    for (const position of positions) {
        const multiplier = position.quantity * 100; // 100 shares per contract
        totalDelta += position.delta * multiplier;
        totalGamma += position.gamma * multiplier;
        totalTheta += position.theta * multiplier;
        totalVega += position.vega * multiplier;
    }
    
    return {
        delta: totalDelta,
        gamma: totalGamma,
        theta: totalTheta,
        vega: totalVega,
        interpretation: interpretGreeks(totalDelta, totalGamma, totalTheta, totalVega)
    };
}

/**
 * Interpret Greeks for risk assessment
 */
function interpretGreeks(delta, gamma, theta, vega) {
    const interpretation = {
        delta: delta > 0 ? 'Bullish position' : 'Bearish position',
        gamma: Math.abs(gamma) > 10 ? 'High price sensitivity' : 'Low price sensitivity',
        theta: theta < -50 ? 'Significant time decay' : 'Minimal time decay',
        vega: Math.abs(vega) > 100 ? 'High IV sensitivity' : 'Low IV sensitivity'
    };
    
    return interpretation;
}

/**
 * Calculate Kelly Criterion for position sizing
 */
function calculateKellyCriterion(winRate, avgWin, avgLoss) {
    if (avgLoss === 0) return 0;
    const b = avgWin / avgLoss;
    const p = winRate / 100;
    const q = 1 - p;
    const kelly = (b * p - q) / b;
    return Math.max(0, Math.min(kelly, 0.25)); // Cap at 25% of portfolio
}

/**
 * Calculate Risk/Reward Ratio
 */
function calculateRiskReward(maxProfit, maxLoss) {
    if (maxLoss === 0) return Infinity;
    return maxProfit / Math.abs(maxLoss);
}

/**
 * Calculate Break-Even Points
 */
function calculateBreakEven(strategy, strikes, premiums) {
    const breakEvens = [];
    
    switch (strategy) {
        case 'long-call':
            breakEvens.push(strikes[0] + premiums[0]);
            break;
        case 'long-put':
            breakEvens.push(strikes[0] - premiums[0]);
            break;
        case 'bull-call-spread':
            breakEvens.push(strikes[0] + premiums[0] - premiums[1]);
            break;
        case 'bear-put-spread':
            breakEvens.push(strikes[1] - (premiums[0] - premiums[1]));
            break;
        case 'iron-condor':
            breakEvens.push(strikes[0] + premiums[0] + premiums[1] - premiums[2] - premiums[3]);
            breakEvens.push(strikes[3] - (premiums[0] + premiums[1] - premiums[2] - premiums[3]));
            break;
        case 'straddle':
            const totalPremium = premiums[0] + premiums[1];
            breakEvens.push(strikes[0] - totalPremium);
            breakEvens.push(strikes[0] + totalPremium);
            break;
    }
    
    return breakEvens;
}

/**
 * Calculate Position Score (0-100)
 */
function calculatePositionScore(option, signals) {
    let score = 50; // Base score
    
    // Volume/OI ratio (liquidity)
    const volOIRatio = option.volume / option.openInterest;
    if (volOIRatio > 0.5) score += 10;
    else if (volOIRatio < 0.1) score -= 10;
    
    // IV Rank
    const ivRank = calculateIVRank(option.iv / 100, option.symbol);
    if (ivRank > 75) score += 15;
    else if (ivRank < 25) score -= 10;
    
    // Time decay (prefer selling high theta, buying low theta)
    if (Math.abs(option.theta) > 0.1 && option.theta < 0) score += 10;
    
    // Delta (prefer near ATM for directional plays)
    const absDelta = Math.abs(option.delta);
    if (absDelta > 0.4 && absDelta < 0.6) score += 15;
    
    // Unusual activity
    if (option.volume > option.openInterest * 2) score += 20;
    
    // Add signal bonuses
    for (const signal of signals) {
        if (signal.symbol === option.symbol) {
            score += signal.strength * 20;
        }
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate Historical Volatility
 */
function calculateHistoricalVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Annualize (assuming daily returns)
    return stdDev * Math.sqrt(252) * 100;
}

/**
 * Detect Gamma Squeeze Potential
 */
function detectGammaSqueeze(optionsChain, stockPrice) {
    // Find options with high gamma near current price
    const nearMoneyOptions = optionsChain.filter(opt => 
        Math.abs(opt.strike - stockPrice) / stockPrice < 0.05 && // Within 5%
        opt.gamma > 0.01
    );
    
    let totalGammaExposure = 0;
    for (const opt of nearMoneyOptions) {
        totalGammaExposure += opt.gamma * opt.openInterest;
    }
    
    // High gamma exposure indicates potential squeeze
    const risk = totalGammaExposure > 1000 ? 'HIGH' : 
                 totalGammaExposure > 500 ? 'MEDIUM' : 'LOW';
    
    return {
        risk,
        exposure: totalGammaExposure,
        strikes: nearMoneyOptions.map(opt => opt.strike)
    };
}

/**
 * Calculate Volatility Skew
 */
function calculateVolatilitySkew(optionsChain, expiration) {
    const options = optionsChain.filter(opt => opt.expiration === expiration);
    
    const puts = options.filter(opt => opt.type === 'put').sort((a, b) => a.strike - b.strike);
    const calls = options.filter(opt => opt.type === 'call').sort((a, b) => a.strike - b.strike);
    
    if (puts.length < 3 || calls.length < 3) return null;
    
    // Compare OTM put IV vs OTM call IV
    const otmPutIV = puts[Math.floor(puts.length * 0.25)].iv; // 25% OTM
    const otmCallIV = calls[Math.floor(calls.length * 0.75)].iv; // 25% OTM
    
    const skew = otmPutIV - otmCallIV;
    
    return {
        skew,
        interpretation: skew > 5 ? 'Fear (Put Skew)' : 
                       skew < -5 ? 'Greed (Call Skew)' : 'Neutral'
    };
}

/**
 * Export all calculation functions
 */
window.OptionsCalculations = {
    blackScholes,
    normalCDF,
    calculatePOP,
    calculateExpectedMove,
    calculateMaxPain,
    calculatePutCallRatio,
    calculateImpliedVolatility,
    calculatePortfolioGreeks,
    calculateKellyCriterion,
    calculateRiskReward,
    calculateBreakEven,
    calculatePositionScore,
    calculateHistoricalVolatility,
    detectGammaSqueeze,
    calculateVolatilitySkew,
    interpretGreeks
};

/**
 * Helper function to calculate IV Rank
 */
function calculateIVRank(currentIV, symbol) {
    const ivLow = 0.15;
    const ivHigh = 0.80;
    return ((currentIV - ivLow) / (ivHigh - ivLow)) * 100;
}
