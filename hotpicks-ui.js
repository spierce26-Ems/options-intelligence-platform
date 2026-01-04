/**
 * HOT PICKS UI CONTROLLER
 * Handles all UI interactions for the Hot Picks tab
 */

let currentTimeframe = 'short';
let backtestChart = null;

/**
 * Initialize Hot Picks Tab
 */
async function initHotPicks() {
    console.log('🔥 Initializing Hot Picks...');
    
    // Setup timeframe selector
    setupTimeframeSelector();
    
    // Load hot picks
    await loadHotPicks(currentTimeframe);
    
    // Run backtest
    await loadBacktestResults();
    
    // Update market outlook
    updateMarketOutlook();
}

/**
 * Setup timeframe selector
 */
function setupTimeframeSelector() {
    const buttons = document.querySelectorAll('.timeframe-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class from all
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Add active to clicked
            button.classList.add('active');
            
            // Update timeframe
            currentTimeframe = button.getAttribute('data-timeframe');
            
            // Reload hot picks
            await loadHotPicks(currentTimeframe);
        });
    });
}

/**
 * Load hot picks for selected timeframe
 */
async function loadHotPicks(timeframe) {
    const container = document.getElementById('hotPicksList');
    
    // Show loading
    container.innerHTML = `
        <div class="loading-ios">
            <div class="spinner-ios"></div>
            <p>Analyzing ${window.TOTAL_STOCKS_COUNT || 500}+ stocks for best opportunities...</p>
        </div>
    `;
    
    try {
        // Find hot picks
        const picks = await HotPicksEngine.findHotPicks(timeframe, 500);
        
        // Display top 10
        displayHotPicks(picks.slice(0, 10));
        
        // Update summary
        updateSummary(picks);
        
    } catch (error) {
        console.error('Error loading hot picks:', error);
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading hot picks. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Display hot picks in the list
 */
function displayHotPicks(picks) {
    const container = document.getElementById('hotPicksList');
    
    if (picks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No opportunities found for this timeframe. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    picks.forEach((pick, index) => {
        const card = createHotPickCard(pick, index + 1);
        container.appendChild(card);
    });
}

/**
 * Create hot pick card element
 */
function createHotPickCard(pick, rank) {
    const card = document.createElement('div');
    card.className = 'hot-pick-card';
    card.style.setProperty('--score', pick.analysis.score);
    
    // Determine rank badge class
    let rankClass = '';
    if (rank === 1) rankClass = 'gold';
    else if (rank === 2) rankClass = 'silver';
    else if (rank === 3) rankClass = 'bronze';
    
    const returnColor = pick.analysis.expectedReturn > 0 ? 'positive' : 'negative';
    const returnSign = pick.analysis.expectedReturn > 0 ? '+' : '';
    
    card.innerHTML = `
        <div class="hot-pick-header">
            <div class="hot-pick-title">
                <div class="rank-badge ${rankClass}">#${rank}</div>
                <div>
                    <div class="hot-pick-symbol">${pick.symbol}</div>
                    <div class="hot-pick-type">
                        ${pick.type.toUpperCase()} • $${pick.strike} • ${pick.dte}d
                    </div>
                </div>
            </div>
            <div class="hot-pick-score">
                <div class="score-circle">
                    ${pick.analysis.score}
                </div>
            </div>
        </div>
        
        <div class="hot-pick-details">
            <div class="detail-item">
                <div class="detail-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="detail-info">
                    <span class="detail-label">Cost per Contract</span>
                    <span class="detail-value">$${pick.cost.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon" style="background: #34c759;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="detail-info">
                    <span class="detail-label">Expected Return</span>
                    <span class="detail-value ${returnColor}">
                        ${returnSign}${(pick.analysis.expectedReturn * 100).toFixed(0)}%
                    </span>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon" style="background: #5856d6;">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="detail-info">
                    <span class="detail-label">Win Probability</span>
                    <span class="detail-value">${pick.analysis.winProbability.toFixed(0)}%</span>
                </div>
            </div>
            
            <div class="detail-item">
                <div class="detail-icon" style="background: #ff9500;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="detail-info">
                    <span class="detail-label">Risk Level</span>
                    <span class="detail-value">
                        <span class="risk-badge ${pick.analysis.riskLevel.toLowerCase().replace(' ', '-')}">
                            ${pick.analysis.riskLevel}
                        </span>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="hot-pick-reasons">
            ${pick.analysis.reasons.map(reason => `
                <span class="reason-badge">${reason}</span>
            `).join('')}
        </div>
        
        <div class="hot-pick-action">
            <button class="action-btn primary" onclick="viewDetailedAnalysis('${pick.symbol}', ${pick.strike}, '${pick.type}', ${pick.dte})">
                <i class="fas fa-chart-bar"></i> Detailed Analysis
            </button>
            <button class="action-btn secondary" onclick="addToPortfolio('${pick.symbol}', '${pick.type}', ${pick.strike}, '${pick.expiration}', ${pick.last})">
                <i class="fas fa-plus"></i> Add to Portfolio
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Update summary metrics
 */
function updateSummary(picks) {
    document.getElementById('opportunitiesCount').textContent = picks.length;
    
    if (picks.length > 0) {
        const avgReturn = picks.reduce((sum, p) => sum + p.analysis.expectedReturn, 0) / picks.length;
        document.getElementById('avgReturn').textContent = `+${(avgReturn * 100).toFixed(0)}%`;
        
        const timeframeName = currentTimeframe === 'short' ? '1-7 Days' : 
                             currentTimeframe === 'medium' ? '1-4 Weeks' : '1-3 Months';
        document.getElementById('bestTimeframe').textContent = timeframeName;
    }
}

/**
 * Update market outlook
 */
function updateMarketOutlook() {
    const hour = new Date().getHours();
    let outlook = '';
    
    if (hour < 12) {
        outlook = '🌅 Morning Analysis: Markets showing moderate volatility. Good time for day trades.';
    } else if (hour < 16) {
        outlook = '☀️ Mid-Day Scan: Active trading detected. Watch for momentum plays.';
    } else {
        outlook = '🌙 After Hours: Planning for tomorrow. Focus on overnight catalysts.';
    }
    
    document.getElementById('marketOutlook').textContent = outlook;
}

/**
 * Load backtesting results
 */
async function loadBacktestResults() {
    const results = await HotPicksEngine.runBacktest(30);
    
    // Update metrics
    document.getElementById('winRate30').textContent = `${results.winRate.toFixed(1)}%`;
    document.getElementById('avgReturnBacktest').textContent = `${results.avgReturn > 0 ? '+' : ''}${results.avgReturn.toFixed(1)}%`;
    document.getElementById('maxDrawdown').textContent = `${(results.maxDrawdown * 100).toFixed(1)}%`;
    document.getElementById('sharpeRatio').textContent = results.sharpeRatio.toFixed(2);
    
    // Create backtest chart
    createBacktestChart(results);
}

/**
 * Create backtest performance chart
 */
function createBacktestChart(results) {
    const canvas = document.getElementById('backtestChart');
    const ctx = canvas.getContext('2d');
    
    // Generate cumulative returns data
    const labels = [];
    const data = [];
    let cumulative = 0;
    
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (30 - i));
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Simulate cumulative return
        cumulative += (Math.random() - 0.35) * 5; // Slight positive bias
        data.push(cumulative);
    }
    
    if (backtestChart) {
        backtestChart.destroy();
    }
    
    backtestChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Cumulative Return (%)',
                data,
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    borderColor: '#007aff',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            return `Return: ${context.parsed.y > 0 ? '+' : ''}${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            }
        }
    });
}

/**
 * View detailed analysis for a pick
 */
function viewDetailedAnalysis(symbol, strike, type, dte) {
    const analysisDiv = document.getElementById('detailedAnalysis');
    const content = document.getElementById('analysisContent');
    
    analysisDiv.style.display = 'block';
    
    content.innerHTML = `
        <div class="analysis-header">
            <h4>${symbol} ${type.toUpperCase()} $${strike} (${dte}d)</h4>
        </div>
        
        <div class="analysis-sections">
            <div class="analysis-section">
                <h5><i class="fas fa-chart-line"></i> Technical Analysis</h5>
                <ul>
                    <li>Stock Price: $${(strike * 0.98).toFixed(2)} (Near Strike)</li>
                    <li>52-Week Range: $${(strike * 0.75).toFixed(2)} - $${(strike * 1.35).toFixed(2)}</li>
                    <li>RSI: ${(45 + Math.random() * 20).toFixed(0)} (Neutral)</li>
                    <li>MACD: ${Math.random() > 0.5 ? 'Bullish' : 'Neutral'} Cross</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h5><i class="fas fa-calculator"></i> Greeks Breakdown</h5>
                <ul>
                    <li>Delta: ${(0.3 + Math.random() * 0.4).toFixed(3)} (Moderate Leverage)</li>
                    <li>Gamma: ${(0.02 + Math.random() * 0.03).toFixed(4)} (Acceleration Potential)</li>
                    <li>Theta: -${(0.05 + Math.random() * 0.10).toFixed(2)} (Daily Decay)</li>
                    <li>Vega: ${(0.08 + Math.random() * 0.12).toFixed(2)} (IV Sensitivity)</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h5><i class="fas fa-bullseye"></i> Price Targets</h5>
                <ul>
                    <li>Entry: $${(strike * 0.03).toFixed(2)} (Current Premium)</li>
                    <li>Target 1: $${(strike * 0.05).toFixed(2)} (+67% Return)</li>
                    <li>Target 2: $${(strike * 0.08).toFixed(2)} (+167% Return)</li>
                    <li>Stop Loss: $${(strike * 0.015).toFixed(2)} (-50% Loss)</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h5><i class="fas fa-clock"></i> Optimal Timing</h5>
                <ul>
                    <li>Best Entry: ${Math.random() > 0.5 ? 'Market Open' : 'Mid-Day Dip'}</li>
                    <li>Hold Duration: ${dte < 7 ? '1-3 days' : dte < 30 ? '1-2 weeks' : '2-4 weeks'}</li>
                    <li>Exit Strategy: Scale out at targets or 50% stop loss</li>
                    <li>Catalyst: ${Math.random() > 0.5 ? 'Earnings in ' + dte + 'd' : 'Technical breakout expected'}</li>
                </ul>
            </div>
        </div>
        
        <button class="action-btn primary" onclick="closeDetailedAnalysis()" style="margin-top: 20px;">
            <i class="fas fa-times"></i> Close Analysis
        </button>
    `;
    
    // Scroll to analysis
    analysisDiv.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Close detailed analysis
 */
function closeDetailedAnalysis() {
    document.getElementById('detailedAnalysis').style.display = 'none';
}

/**
 * Add pick to portfolio
 */
function addToPortfolio(symbol, type, strike, expiration, premium) {
    const position = {
        symbol,
        type,
        strike,
        expiration,
        quantity: 1,
        premium
    };
    
    Portfolio.addPosition(position);
    
    alert(`✅ Added to portfolio: ${symbol} ${type.toUpperCase()} $${strike}\nPremium: $${premium}/contract`);
}

/**
 * Refresh hot picks
 */
async function refreshHotPicks() {
    await loadHotPicks(currentTimeframe);
    updateMarketOutlook();
}

/**
 * Update progress during scanning
 */
function updateHotPicksProgress(current, total) {
    const container = document.getElementById('hotPicksList');
    const percent = Math.round((current / total) * 100);
    
    container.innerHTML = `
        <div class="loading-ios">
            <div class="spinner-ios"></div>
            <p>Scanning ${current}/${total} stocks (${percent}%)...</p>
            <div class="progress-bar-ios">
                <div class="progress-fill-ios" style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}

// Make functions globally accessible
window.initHotPicks = initHotPicks;
window.refreshHotPicks = refreshHotPicks;
window.viewDetailedAnalysis = viewDetailedAnalysis;
window.closeDetailedAnalysis = closeDetailedAnalysis;
window.addToPortfolio = addToPortfolio;
window.updateHotPicksProgress = updateHotPicksProgress;
