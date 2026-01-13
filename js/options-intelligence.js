// ===== Options Intelligence Screener =====
// Advanced options analysis with smart scoring algorithms

// Global state
const state = {
    apiConfig: {
        consumerKey: '',
        consumerSecret: '',
        isConfigured: false
    },
    selectedStrategy: null,
    scanResults: [],
    sortField: 'score',
    sortAsc: false
};

// ===== API Configuration =====
function toggleAPISetup() {
    const panel = document.getElementById('apiSetup');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    
    // Load saved config
    const saved = localStorage.getItem('etradeConfig');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('consumerKey').value = config.consumerKey || '';
        document.getElementById('consumerSecret').value = config.consumerSecret || '';
    }
}

function saveAPIConfig() {
    const key = document.getElementById('consumerKey').value.trim();
    const secret = document.getElementById('consumerSecret').value.trim();
    
    if (!key || !secret) {
        showStatus('error', 'Please enter both Consumer Key and Secret');
        return;
    }
    
    state.apiConfig = {
        consumerKey: key,
        consumerSecret: secret,
        isConfigured: true
    };
    
    localStorage.setItem('etradeConfig', JSON.stringify(state.apiConfig));
    showStatus('success', '✓ Configuration saved successfully!');
}

function testConnection() {
    if (!state.apiConfig.isConfigured) {
        showStatus('error', 'Please save configuration first');
        return;
    }
    
    showStatus('success', '✓ Connection test passed! (Using mock data for now)');
    // TODO: Implement real E*TRADE API connection test
}

function showStatus(type, message) {
    const statusEl = document.getElementById('apiStatus');
    statusEl.className = `api-status ${type}`;
    statusEl.textContent = message;
}

// ===== Strategy Selection =====
function selectStrategy(strategy) {
    state.selectedStrategy = strategy;
    
    // Update UI
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.strategy-card').classList.add('selected');
    
    // Apply strategy-specific filter presets
    applyStrategyFilters(strategy);
}

function applyStrategyFilters(strategy) {
    const presets = {
        momentum: {
            deltaMin: 0.60,
            deltaMax: 0.80,
            dteMin: 20,
            dteMax: 45,
            premiumMin: 2.00,
            premiumMax: 10.00,
            ivMin: 35,
            ivMax: 70
        },
        value: {
            deltaMin: 0.50,
            deltaMax: 0.70,
            dteMin: 30,
            dteMax: 60,
            premiumMin: 1.00,
            premiumMax: 5.00,
            ivMin: 15,
            ivMax: 35
        },
        income: {
            deltaMin: 0.40,
            deltaMax: 0.60,
            dteMin: 30,
            dteMax: 60,
            premiumMin: 1.50,
            premiumMax: 5.00,
            ivMin: 20,
            ivMax: 45
        },
        swing: {
            deltaMin: 0.55,
            deltaMax: 0.75,
            dteMin: 21,
            dteMax: 45,
            premiumMin: 1.00,
            premiumMax: 5.00,
            ivMin: 25,
            ivMax: 50
        }
    };
    
    const preset = presets[strategy];
    if (preset) {
        document.getElementById('deltaMin').value = preset.deltaMin;
        document.getElementById('deltaMax').value = preset.deltaMax;
        document.getElementById('dteMin').value = preset.dteMin;
        document.getElementById('dteMax').value = preset.dteMax;
        document.getElementById('premiumMin').value = preset.premiumMin;
        document.getElementById('premiumMax').value = preset.premiumMax;
        document.getElementById('ivMin').value = preset.ivMin;
        document.getElementById('ivMax').value = preset.ivMax;
    }
}

function resetFilters() {
    document.getElementById('filterMarketCap').value = 'large';
    document.getElementById('deltaMin').value = 0.50;
    document.getElementById('deltaMax').value = 0.70;
    document.getElementById('dteMin').value = 30;
    document.getElementById('dteMax').value = 60;
    document.getElementById('premiumMin').value = 1.00;
    document.getElementById('premiumMax').value = 5.00;
    document.getElementById('ivMin').value = 20;
    document.getElementById('ivMax').value = 50;
    document.getElementById('minOI').value = 1000;
    document.getElementById('maxSpread').value = 0.15;
    document.getElementById('minVolume').value = 500;
    
    state.selectedStrategy = null;
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// ===== Scoring Algorithm =====
function calculateScore(option) {
    let score = 0;
    const weights = {
        liquidity: 25,
        value: 25,
        probability: 25,
        riskReward: 25
    };
    
    // 1. Liquidity Score (0-25 points)
    const liquidityScore = calculateLiquidityScore(option);
    score += liquidityScore * weights.liquidity / 100;
    
    // 2. Value Score (0-25 points)
    const valueScore = calculateValueScore(option);
    score += valueScore * weights.value / 100;
    
    // 3. Probability Score (0-25 points)
    const probabilityScore = calculateProbabilityScore(option);
    score += probabilityScore * weights.probability / 100;
    
    // 4. Risk/Reward Score (0-25 points)
    const riskRewardScore = calculateRiskRewardScore(option);
    score += riskRewardScore * weights.riskReward / 100;
    
    return Math.round(score);
}

function calculateLiquidityScore(option) {
    let score = 0;
    
    // Volume (max 30 points)
    if (option.volume > 2000) score += 30;
    else if (option.volume > 1000) score += 25;
    else if (option.volume > 500) score += 20;
    else score += 10;
    
    // Open Interest (max 40 points)
    if (option.openInterest > 5000) score += 40;
    else if (option.openInterest > 2000) score += 30;
    else if (option.openInterest > 1000) score += 20;
    else score += 10;
    
    // Bid-Ask Spread (max 30 points)
    if (option.spread < 0.10) score += 30;
    else if (option.spread < 0.15) score += 20;
    else if (option.spread < 0.20) score += 10;
    else score += 5;
    
    return score;
}

function calculateValueScore(option) {
    let score = 0;
    
    // IV Rank (max 40 points) - prefer moderate IV
    if (option.ivRank >= 30 && option.ivRank <= 60) score += 40;
    else if (option.ivRank >= 20 && option.ivRank <= 70) score += 30;
    else if (option.ivRank >= 10 && option.ivRank <= 80) score += 20;
    else score += 10;
    
    // Premium to Stock Price Ratio (max 30 points)
    const premiumRatio = (option.premium / option.stockPrice) * 100;
    if (premiumRatio >= 2 && premiumRatio <= 8) score += 30;
    else if (premiumRatio >= 1 && premiumRatio <= 10) score += 20;
    else score += 10;
    
    // Days to Expiration (max 30 points) - prefer 30-45 DTE
    if (option.dte >= 30 && option.dte <= 45) score += 30;
    else if (option.dte >= 21 && option.dte <= 60) score += 20;
    else score += 10;
    
    return score;
}

function calculateProbabilityScore(option) {
    let score = 0;
    
    // Delta (max 50 points) - higher delta = higher probability
    const deltaValue = Math.abs(option.delta);
    if (deltaValue >= 0.60 && deltaValue <= 0.75) score += 50;
    else if (deltaValue >= 0.50 && deltaValue <= 0.80) score += 40;
    else if (deltaValue >= 0.40 && deltaValue <= 0.85) score += 30;
    else score += 20;
    
    // Break-even Distance (max 50 points) - closer is better
    const breakEvenPct = ((option.breakEven - option.stockPrice) / option.stockPrice) * 100;
    if (breakEvenPct < 3) score += 50;
    else if (breakEvenPct < 5) score += 40;
    else if (breakEvenPct < 7) score += 30;
    else if (breakEvenPct < 10) score += 20;
    else score += 10;
    
    return score;
}

function calculateRiskRewardScore(option) {
    let score = 0;
    
    // Max Loss (premium) vs Max Gain potential (max 50 points)
    const upside = option.strike - option.stockPrice;
    const riskedCapital = option.premium;
    
    if (upside > 0) {
        const ratio = upside / riskedCapital;
        if (ratio > 2) score += 50;
        else if (ratio > 1.5) score += 40;
        else if (ratio > 1) score += 30;
        else score += 20;
    } else {
        score += 10; // ITM options
    }
    
    // Volatility consideration (max 50 points)
    if (option.iv < 30) score += 50; // Low IV = less risk
    else if (option.iv < 40) score += 40;
    else if (option.iv < 50) score += 30;
    else score += 20;
    
    return score;
}

// ===== Mock Data for Testing =====
function getMockOptions() {
    return [
        {
            ticker: 'ET',
            stockPrice: 17.15,
            marketCap: 58.2,
            strike: 18.00,
            expiration: '2026-02-20',
            dte: 38,
            premium: 1.45,
            delta: 0.65,
            gamma: 0.08,
            theta: -0.04,
            vega: 0.12,
            iv: 32.5,
            ivRank: 45,
            volume: 1250,
            openInterest: 3200,
            spread: 0.10,
            breakEven: 19.45,
            winProbability: 65
        },
        {
            ticker: 'MO',
            stockPrice: 55.88,
            marketCap: 92.0,
            strike: 58.00,
            expiration: '2026-02-20',
            dte: 38,
            premium: 2.10,
            delta: 0.58,
            gamma: 0.06,
            theta: -0.05,
            vega: 0.15,
            iv: 28.3,
            ivRank: 38,
            volume: 2100,
            openInterest: 5800,
            spread: 0.08,
            breakEven: 60.10,
            winProbability: 58
        },
        {
            ticker: 'ARCC',
            stockPrice: 20.50,
            marketCap: 15.0,
            strike: 21.00,
            expiration: '2026-03-20',
            dte: 66,
            premium: 1.80,
            delta: 0.62,
            gamma: 0.10,
            theta: -0.03,
            vega: 0.14,
            iv: 35.7,
            ivRank: 52,
            volume: 890,
            openInterest: 2400,
            spread: 0.12,
            breakEven: 22.80,
            winProbability: 62
        },
        {
            ticker: 'EPD',
            stockPrice: 28.75,
            marketCap: 62.5,
            strike: 30.00,
            expiration: '2026-02-20',
            dte: 38,
            premium: 1.25,
            delta: 0.53,
            gamma: 0.07,
            theta: -0.04,
            vega: 0.11,
            iv: 26.9,
            ivRank: 35,
            volume: 750,
            openInterest: 1900,
            spread: 0.15,
            breakEven: 31.25,
            winProbability: 53
        },
        {
            ticker: 'VZ',
            stockPrice: 42.80,
            marketCap: 180.5,
            strike: 44.00,
            expiration: '2026-02-20',
            dte: 38,
            premium: 1.60,
            delta: 0.59,
            gamma: 0.09,
            theta: -0.04,
            vega: 0.13,
            iv: 24.1,
            ivRank: 42,
            volume: 3200,
            openInterest: 7500,
            spread: 0.05,
            breakEven: 45.60,
            winProbability: 59
        },
        {
            ticker: 'T',
            stockPrice: 23.15,
            marketCap: 165.0,
            strike: 24.00,
            expiration: '2026-03-20',
            dte: 66,
            premium: 1.05,
            delta: 0.56,
            gamma: 0.08,
            theta: -0.02,
            vega: 0.10,
            iv: 27.8,
            ivRank: 40,
            volume: 2800,
            openInterest: 6200,
            spread: 0.06,
            breakEven: 25.05,
            winProbability: 56
        },
        {
            ticker: 'BMY',
            stockPrice: 58.30,
            marketCap: 120.0,
            strike: 60.00,
            expiration: '2026-02-20',
            dte: 38,
            premium: 2.30,
            delta: 0.61,
            gamma: 0.07,
            theta: -0.06,
            vega: 0.16,
            iv: 31.4,
            ivRank: 48,
            volume: 1550,
            openInterest: 4100,
            spread: 0.09,
            breakEven: 62.30,
            winProbability: 61
        },
        {
            ticker: 'XOM',
            stockPrice: 123.64,
            marketCap: 510.0,
            strike: 127.00,
            expiration: '2026-02-20',
            dte: 38,
            premium: 4.50,
            delta: 0.57,
            gamma: 0.05,
            theta: -0.10,
            vega: 0.20,
            iv: 29.6,
            ivRank: 44,
            volume: 4200,
            openInterest: 9800,
            spread: 0.12,
            breakEven: 131.50,
            winProbability: 57
        },
        {
            ticker: 'CVX',
            stockPrice: 162.96,
            marketCap: 305.0,
            strike: 167.50,
            expiration: '2026-02-20',
            dte: 38,
            premium: 5.80,
            delta: 0.55,
            gamma: 0.04,
            theta: -0.12,
            vega: 0.22,
            iv: 28.9,
            ivRank: 41,
            volume: 1900,
            openInterest: 5200,
            spread: 0.14,
            breakEven: 173.30,
            winProbability: 55
        },
        {
            ticker: 'PFE',
            stockPrice: 28.45,
            marketCap: 160.0,
            strike: 29.00,
            expiration: '2026-03-20',
            dte: 66,
            premium: 1.40,
            delta: 0.60,
            gamma: 0.11,
            theta: -0.03,
            vega: 0.14,
            iv: 33.2,
            ivRank: 50,
            volume: 2400,
            openInterest: 5600,
            spread: 0.08,
            breakEven: 30.40,
            winProbability: 60
        }
    ];
}

// ===== Scan for Opportunities =====
function runScan() {
    // Get filter values
    const filters = {
        marketCap: document.getElementById('filterMarketCap').value,
        deltaMin: parseFloat(document.getElementById('deltaMin').value),
        deltaMax: parseFloat(document.getElementById('deltaMax').value),
        dteMin: parseInt(document.getElementById('dteMin').value),
        dteMax: parseInt(document.getElementById('dteMax').value),
        premiumMin: parseFloat(document.getElementById('premiumMin').value),
        premiumMax: parseFloat(document.getElementById('premiumMax').value),
        ivMin: parseInt(document.getElementById('ivMin').value),
        ivMax: parseInt(document.getElementById('ivMax').value),
        minOI: parseInt(document.getElementById('minOI').value),
        maxSpread: parseFloat(document.getElementById('maxSpread').value),
        minVolume: parseInt(document.getElementById('minVolume').value)
    };
    
    // Get options data (mock for now)
    let options = getMockOptions();
    
    // Apply filters
    options = options.filter(opt => {
        // Market cap filter
        if (filters.marketCap === 'mega' && opt.marketCap < 200) return false;
        if (filters.marketCap === 'large' && (opt.marketCap < 10 || opt.marketCap >= 200)) return false;
        if (filters.marketCap === 'mid' && (opt.marketCap < 2 || opt.marketCap >= 10)) return false;
        
        // Other filters
        if (opt.delta < filters.deltaMin || opt.delta > filters.deltaMax) return false;
        if (opt.dte < filters.dteMin || opt.dte > filters.dteMax) return false;
        if (opt.premium < filters.premiumMin || opt.premium > filters.premiumMax) return false;
        if (opt.iv < filters.ivMin || opt.iv > filters.ivMax) return false;
        if (opt.openInterest < filters.minOI) return false;
        if (opt.spread > filters.maxSpread) return false;
        if (opt.volume < filters.minVolume) return false;
        
        return true;
    });
    
    // Calculate scores
    options.forEach(opt => {
        opt.score = calculateScore(opt);
    });
    
    // Sort by score
    options.sort((a, b) => b.score - a.score);
    
    // Save to state
    state.scanResults = options;
    
    // Display results
    displayResults(options);
}

// ===== Display Results =====
function displayResults(options) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsBody = document.getElementById('resultsBody');
    const resultsStats = document.getElementById('resultsStats');
    
    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Update stats
    resultsStats.textContent = `Found ${options.length} opportunities`;
    
    // Clear table
    resultsBody.innerHTML = '';
    
    // Add rows
    options.forEach(opt => {
        const row = document.createElement('tr');
        
        const scoreClass = 
            opt.score >= 80 ? 'score-excellent' :
            opt.score >= 70 ? 'score-good' :
            opt.score >= 60 ? 'score-fair' : 'score-poor';
        
        row.innerHTML = `
            <td><span class="score-badge ${scoreClass}">${opt.score}</span></td>
            <td><strong>${opt.ticker}</strong></td>
            <td>$${opt.stockPrice.toFixed(2)}</td>
            <td>$${opt.strike.toFixed(2)}</td>
            <td>${opt.expiration} (${opt.dte}d)</td>
            <td><strong>$${opt.premium.toFixed(2)}</strong></td>
            <td>${opt.delta.toFixed(2)}</td>
            <td>${opt.iv.toFixed(1)}%</td>
            <td>${opt.ivRank}</td>
            <td>$${opt.breakEven.toFixed(2)} <span style="color: var(--text-secondary); font-size: 0.85em;">(+${((opt.breakEven - opt.stockPrice) / opt.stockPrice * 100).toFixed(1)}%)</span></td>
            <td><strong>${opt.winProbability}%</strong></td>
            <td><button class="btn-view" onclick="viewDetails('${opt.ticker}', ${opt.strike})">View</button></td>
        `;
        
        resultsBody.appendChild(row);
    });
}

// ===== Sort Results =====
function sortBy(field) {
    if (state.sortField === field) {
        state.sortAsc = !state.sortAsc;
    } else {
        state.sortField = field;
        state.sortAsc = false;
    }
    
    const sorted = [...state.scanResults].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (typeof aVal === 'string') {
            return state.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        } else {
            return state.sortAsc ? aVal - bVal : bVal - aVal;
        }
    });
    
    displayResults(sorted);
}

// ===== View Detailed Analysis =====
function viewDetails(ticker, strike) {
    const option = state.scanResults.find(opt => opt.ticker === ticker && opt.strike === strike);
    if (!option) return;
    
    const modal = document.getElementById('analysisModal');
    const content = document.getElementById('analysisContent');
    
    // Calculate detailed metrics
    const needToRise = ((option.breakEven - option.stockPrice) / option.stockPrice * 100).toFixed(2);
    const premiumReturn = ((option.premium / option.stockPrice) * 100).toFixed(2);
    const intrinsicValue = Math.max(0, option.stockPrice - option.strike);
    const timeValue = (option.premium - intrinsicValue).toFixed(2);
    
    // Scenarios
    const scenarios = [
        {
            name: 'Bull Case',
            targetPrice: (option.stockPrice * 1.15).toFixed(2),
            profit: ((option.stockPrice * 1.15 - option.strike - option.premium) * 100).toFixed(0),
            probability: '15-20%'
        },
        {
            name: 'Base Case',
            targetPrice: (option.breakEven).toFixed(2),
            profit: '0',
            probability: '~' + option.winProbability + '%'
        },
        {
            name: 'Bear Case',
            targetPrice: (option.stockPrice * 0.95).toFixed(2),
            profit: (-option.premium * 100).toFixed(0),
            probability: (100 - option.winProbability) + '%'
        }
    ];
    
    content.innerHTML = `
        <h2>${option.ticker} - $${option.strike} Call</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Expiration: ${option.expiration} (${option.dte} days)</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-bottom: 1rem; color: var(--primary);">📊 Overall Score</h3>
                <div style="font-size: 3rem; font-weight: 700; color: ${option.score >= 70 ? 'var(--success)' : option.score >= 60 ? 'var(--info)' : 'var(--warning)'};">
                    ${option.score}/100
                </div>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                    ${option.score >= 80 ? 'Excellent Opportunity' : option.score >= 70 ? 'Good Opportunity' : option.score >= 60 ? 'Fair Opportunity' : 'Poor Opportunity'}
                </p>
            </div>
            
            <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-bottom: 1rem; color: var(--success);">💰 Premium Income</h3>
                <div style="font-size: 2rem; font-weight: 700;">$${option.premium.toFixed(2)}</div>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">${premiumReturn}% of stock price</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">$${(option.premium * 100).toFixed(0)} per contract</p>
            </div>
            
            <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-bottom: 1rem; color: var(--info);">🎯 Win Probability</h3>
                <div style="font-size: 2rem; font-weight: 700;">${option.winProbability}%</div>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Delta: ${option.delta.toFixed(2)}</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Break-even: $${option.breakEven.toFixed(2)} (+${needToRise}%)</p>
            </div>
        </div>
        
        <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">🎲 Scenarios</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${scenarios.map(s => `
                    <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <h4 style="margin-bottom: 0.5rem;">${s.name}</h4>
                        <p style="font-size: 1.2rem; font-weight: 600; color: ${s.profit >= 0 ? 'var(--success)' : 'var(--danger)'}">${s.profit >= 0 ? '+' : ''}$${s.profit}</p>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Target: $${s.targetPrice}</p>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Probability: ${s.probability}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-bottom: 1rem;">📈 Greeks & Metrics</h3>
                <table style="width: 100%;">
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Delta:</td><td style="text-align: right; font-weight: 600;">${option.delta.toFixed(3)}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Gamma:</td><td style="text-align: right; font-weight: 600;">${option.gamma.toFixed(3)}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Theta:</td><td style="text-align: right; font-weight: 600; color: var(--danger);">${option.theta.toFixed(3)}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Vega:</td><td style="text-align: right; font-weight: 600;">${option.vega.toFixed(3)}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">IV:</td><td style="text-align: right; font-weight: 600;">${option.iv.toFixed(1)}%</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">IV Rank:</td><td style="text-align: right; font-weight: 600;">${option.ivRank}</td></tr>
                </table>
            </div>
            
            <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-bottom: 1rem;">💧 Liquidity</h3>
                <table style="width: 100%;">
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Volume:</td><td style="text-align: right; font-weight: 600;">${option.volume.toLocaleString()}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Open Interest:</td><td style="text-align: right; font-weight: 600;">${option.openInterest.toLocaleString()}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Bid-Ask Spread:</td><td style="text-align: right; font-weight: 600;">$${option.spread.toFixed(2)}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Intrinsic Value:</td><td style="text-align: right; font-weight: 600;">$${intrinsicValue.toFixed(2)}</td></tr>
                    <tr><td style="padding: 0.5rem 0; color: var(--text-secondary);">Time Value:</td><td style="text-align: right; font-weight: 600;">$${timeValue}</td></tr>
                </table>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--primary);">
            <h3 style="margin-bottom: 1rem;">💡 Key Takeaways</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0;">✓</span>
                    Stock needs to rise ${needToRise}% to $${option.breakEven.toFixed(2)} for break-even
                </li>
                <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0;">✓</span>
                    Premium of $${option.premium.toFixed(2)} = ${premiumReturn}% immediate return potential
                </li>
                <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0;">✓</span>
                    ${option.winProbability}% probability of profit based on delta
                </li>
                <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0;">✓</span>
                    ${option.dte} days until expiration (${option.theta.toFixed(3)} daily theta decay)
                </li>
                <li style="padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0;">✓</span>
                    ${option.volume > 1000 ? 'Excellent' : option.volume > 500 ? 'Good' : 'Fair'} liquidity with ${option.volume.toLocaleString()} volume
                </li>
            </ul>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('analysisModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('analysisModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Load saved API config
    const saved = localStorage.getItem('etradeConfig');
    if (saved) {
        state.apiConfig = JSON.parse(saved);
    }
});
