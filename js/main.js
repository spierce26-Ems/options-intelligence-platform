/**
 * MAIN APPLICATION CONTROLLER
 * Coordinates all modules and handles UI interactions
 */

// Global state
let currentTab = 'hotpicks';
let activeStrategy = null;
let putCallChart = null;

/**
 * Initialize application
 */
async function init() {
    console.log('Initializing Options Intelligence Platform...');
    
    // Check data source and show banner
    checkDataSource();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update market status
    updateMarketStatus();
    setInterval(updateMarketStatus, 60000); // Update every minute
    
    // Initialize portfolio
    Portfolio.init();
    
    // Load initial data
    await loadInitialData();
    
    console.log('Platform initialized!');
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            currentTab = targetTab;
            
            // Load tab-specific data
            loadTabData(targetTab);
        });
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Scanner button
    document.getElementById('scanBtn')?.addEventListener('click', runScanner);
    
    // Add position button
    document.querySelector('.btn-primary[onclick="addPosition()"]')?.addEventListener('click', handleAddPosition);
    
    // Refresh signals button
    document.getElementById('refreshSignalsBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('refreshSignalsBtn');
        const originalHTML = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Signals...';
            
            console.log('🔄 Refreshing signals...');
            await SignalsEngine.generateAllSignals();
            updateSignalsDisplay();
            
            btn.innerHTML = '<i class="fas fa-check"></i> Signals Updated!';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('❌ Error refreshing signals:', error);
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
        }
    });
    
    // Strategy buttons are handled with onclick attributes in HTML
}

/**
 * Load initial data
 */
async function loadInitialData() {
    console.log('Loading initial data...');
    
    // V7: Hot Picks initialized by V7HotPicksAdapter
    // await initHotPicks(); // OLD - disabled
    
    try {
        // Generate signals
        console.log('📡 Starting signals generation...');
        await SignalsEngine.generateAllSignals();
        console.log('✅ Signals generated:', SignalsEngine.signals.length);
        
        // Update signals tab
        updateSignalsDisplay();
        console.log('✅ Signals display updated');
        
        // Show top opportunities
        showTopOpportunities();
        console.log('✅ Top opportunities displayed');
    } catch (error) {
        console.error('❌ Error loading signals:', error);
    }
    
    try {
        // Update portfolio
        await Portfolio.updatePositions();
        updatePortfolioDisplay();
        console.log('✅ Portfolio updated');
    } catch (error) {
        console.error('❌ Error loading portfolio:', error);
    }
}

/**
 * Load tab-specific data
 */
async function loadTabData(tab) {
    switch (tab) {
        case 'hotpicks':
            // V7: Handled by V7HotPicksAdapter
            // await initHotPicks(); // OLD - disabled
            break;
        case 'scanner':
            // Scanner loads on demand
            break;
        case 'signals':
            // Check if signals exist, if not generate them
            if (!SignalsEngine.signals || SignalsEngine.signals.length === 0) {
                console.log('📡 No signals found, generating...');
                await SignalsEngine.generateAllSignals();
            }
            updateSignalsDisplay();
            break;
        case 'greeks':
            await loadGreeksAnalysis();
            break;
        case 'strategies':
            // Strategies load on demand
            break;
        case 'flow':
            await loadFlowData();
            break;
        case 'portfolio':
            await Portfolio.updatePositions();
            updatePortfolioDisplay();
            break;
    }
}

/**
 * Run options scanner
 */
async function runScanner() {
    const scanBtn = document.getElementById('scanBtn');
    const resultsTable = document.getElementById('scannerResults');
    
    // Get filters
    const filters = {
        minVolume: parseInt(document.getElementById('minVolume').value) || 0,
        minOI: parseInt(document.getElementById('minOI').value) || 0,
        ivRank: document.getElementById('ivRank').value,
        dteFilter: document.getElementById('dteFilter').value,
        optionType: document.getElementById('optionType').value,
        signalType: document.getElementById('signalType').value
    };
    
    // Disable button
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    
    resultsTable.innerHTML = '<tr><td colspan="11" class="loading">Scanning options chains...</td></tr>';
    
    try {
        // Run scanner
        const results = await Scanner.scan(filters);
        
        // Display results
        if (results.length === 0) {
            resultsTable.innerHTML = '<tr><td colspan="11" class="empty-state">No options found matching filters</td></tr>';
        } else {
            displayScannerResults(results.slice(0, 100)); // Show top 100
        }
        
    } catch (error) {
        console.error('Scanner error:', error);
        resultsTable.innerHTML = '<tr><td colspan="11" class="error">Error scanning options. Please try again.</td></tr>';
    } finally {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<i class="fas fa-sync"></i> Scan Options';
    }
}

/**
 * Display scanner results
 */
function displayScannerResults(results) {
    const tbody = document.getElementById('scannerResults');
    tbody.innerHTML = '';
    
    for (const result of results) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${result.symbol}</strong></td>
            <td>$${result.strike}</td>
            <td><span class="badge ${result.type}">${result.type.toUpperCase()}</span></td>
            <td>${result.expirationString}</td>
            <td>$${result.bid.toFixed(2)} / $${result.ask.toFixed(2)}</td>
            <td>${result.iv.toFixed(1)}%</td>
            <td>${result.delta.toFixed(3)}</td>
            <td>${result.volume.toLocaleString()}</td>
            <td>${result.openInterest.toLocaleString()}</td>
            <td><span class="signal-badge">${result.signal}</span></td>
            <td><strong class="score-${getScoreClass(result.score)}">${result.score}</strong></td>
        `;
        tbody.appendChild(row);
    }
}

/**
 * Show top opportunities
 */
function showTopOpportunities() {
    const container = document.getElementById('topOpportunities');
    const topSignals = SignalsEngine.getTopSignals(6);
    
    if (topSignals.length === 0) {
        container.innerHTML = '<div class="empty-state">No opportunities found</div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const signal of topSignals) {
        const card = document.createElement('div');
        card.className = 'opportunity-card';
        card.innerHTML = `
            <div class="opp-header">
                <h4>${signal.symbol}</h4>
                <span class="strength-badge strength-${Math.round(signal.strength * 10)}">${(signal.strength * 100).toFixed(0)}%</span>
            </div>
            <div class="opp-type">${signal.type.toUpperCase()}: ${signal.subtype.replace(/-/g, ' ').toUpperCase()}</div>
            <div class="opp-description">${signal.description}</div>
            <div class="opp-action"><strong>Action:</strong> ${signal.details.action}</div>
        `;
        container.appendChild(card);
    }
}

/**
 * Update signals display
 */
function updateSignalsDisplay() {
    // Update signal categories
    updateSignalCategory('unusualActivity', 'unusual');
    updateSignalCategory('volatilitySignals', 'volatility');
    updateSignalCategory('earningsPlays', 'earnings');
    updateSignalCategory('technicalSignals', 'technical');
    
    // Update signals table
    updateSignalsTable();
}

/**
 * Update signal category
 */
function updateSignalCategory(elementId, signalType) {
    const container = document.getElementById(elementId);
    
    // Safety check
    if (!container) {
        console.warn(`⚠️ Signal container not found: ${elementId}`);
        return;
    }
    
    const signals = SignalsEngine.getSignalsByType(signalType);
    
    if (!signals || signals.length === 0) {
        container.innerHTML = '<div class="empty-state">🔍 No signals detected yet. The system is analyzing market data...</div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const signal of signals.slice(0, 5)) {
        const item = document.createElement('div');
        item.className = 'signal-item';
        item.innerHTML = `
            <div class="signal-symbol">${signal.symbol}</div>
            <div class="signal-desc">${signal.description}</div>
            <div class="signal-strength">
                <div class="strength-bar" style="width: ${signal.strength * 100}%"></div>
            </div>
        `;
        container.appendChild(item);
    }
    
    console.log(`✅ Updated ${signalType} signals: ${signals.length} found`);
}

/**
 * Update signals table
 */
function updateSignalsTable() {
    const tbody = document.getElementById('signalsResults');
    
    // Safety check
    if (!tbody) {
        console.warn('⚠️ Signals table not found');
        return;
    }
    
    const signals = SignalsEngine.signals.slice(0, 50);
    
    if (signals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">🔍 Analyzing market data for trading signals...</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    for (const signal of signals) {
        const row = document.createElement('tr');
        const time = new Date(signal.timestamp).toLocaleTimeString();
        
        row.innerHTML = `
            <td>${time}</td>
            <td><strong>${signal.symbol}</strong></td>
            <td><span class="badge ${signal.type}">${signal.type}</span></td>
            <td>${signal.description}</td>
            <td>
                <div class="strength-bar" style="width: ${signal.strength * 100}%"></div>
            </td>
            <td>${signal.details.action}</td>
            <td>${signal.details.option?.strike ? '$' + signal.details.option.strike : 'N/A'}</td>
        `;
        tbody.appendChild(row);
    }
}

/**
 * Load Greeks analysis
 */
async function loadGreeksAnalysis() {
    const tbody = document.getElementById('greeksResults');
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading Greeks analysis...</td></tr>';
    
    try {
        // Get all options with interesting Greeks
        const results = [];
        
        for (const symbol of OptionsData.ROBINHOOD_STOCKS.slice(0, 20)) {
            const stockPrice = await OptionsData.getStockPrice(symbol);
            if (!stockPrice) continue;
            
            const chain = OptionsData.generateOptionsChain(symbol, stockPrice);
            
            // Find high delta, gamma, theta, vega opportunities
            const interesting = chain.filter(opt => 
                (Math.abs(opt.delta) > 0.5 || opt.gamma > 0.03 || 
                 Math.abs(opt.theta) > 0.1 || opt.vega > 0.15) &&
                opt.volume > 100
            );
            
            results.push(...interesting.slice(0, 5));
        }
        
        // Sort by most interesting
        results.sort((a, b) => 
            (Math.abs(b.delta) + b.gamma * 10 + Math.abs(b.theta) + b.vega) -
            (Math.abs(a.delta) + a.gamma * 10 + Math.abs(a.theta) + a.vega)
        );
        
        displayGreeksResults(results.slice(0, 50));
        updateGreeksMetrics(results);
        
    } catch (error) {
        console.error('Greeks analysis error:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="error">Error loading Greeks data</td></tr>';
    }
}

/**
 * Display Greeks results
 */
function displayGreeksResults(results) {
    const tbody = document.getElementById('greeksResults');
    tbody.innerHTML = '';
    
    for (const opt of results) {
        const row = document.createElement('tr');
        
        // Determine strategy based on Greeks
        let strategy = 'Hold';
        if (opt.gamma > 0.05 && opt.dte < 7) strategy = 'Gamma Play';
        else if (Math.abs(opt.theta) > 0.15) strategy = 'Theta Decay';
        else if (opt.vega > 0.2) strategy = 'Vega Play';
        else if (Math.abs(opt.delta) > 0.6) strategy = 'Directional';
        
        const riskReward = opt.intrinsicValue > 0 ? 
            (opt.timeValue / opt.intrinsicValue).toFixed(2) : 
            'N/A';
        
        row.innerHTML = `
            <td><strong>${opt.symbol}</strong></td>
            <td>$${opt.strike}</td>
            <td><span class="badge ${opt.type}">${opt.type.toUpperCase()}</span></td>
            <td>${opt.delta.toFixed(3)}</td>
            <td>${opt.gamma.toFixed(4)}</td>
            <td>${opt.theta.toFixed(2)}</td>
            <td>${opt.vega.toFixed(2)}</td>
            <td><span class="strategy-badge">${strategy}</span></td>
            <td>${riskReward}</td>
        `;
        tbody.appendChild(row);
    }
}

/**
 * Update Greeks metrics
 */
function updateGreeksMetrics(results) {
    const deltaCount = results.filter(opt => Math.abs(opt.delta) > 0.6).length;
    const gammaCount = results.filter(opt => opt.gamma > 0.03).length;
    const thetaCount = results.filter(opt => Math.abs(opt.theta) > 0.1).length;
    const vegaCount = results.filter(opt => opt.vega > 0.15).length;
    
    document.getElementById('deltaCount').textContent = deltaCount;
    document.getElementById('gammaCount').textContent = gammaCount;
    document.getElementById('thetaCount').textContent = thetaCount;
    document.getElementById('vegaCount').textContent = vegaCount;
}

/**
 * Show strategy opportunities
 */
async function showStrategy(strategyType) {
    activeStrategy = strategyType;
    
    const resultsDiv = document.getElementById('strategyResults');
    const tbody = document.getElementById('strategyTableBody');
    const title = document.getElementById('strategyTitle');
    
    resultsDiv.style.display = 'block';
    title.textContent = `${strategyType.replace(/-/g, ' ').toUpperCase()} Opportunities`;
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Finding opportunities...</td></tr>';
    
    try {
        const strategies = await Scanner.findBestStrategies(strategyType);
        
        if (strategies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No opportunities found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        for (const strat of strategies.slice(0, 20)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${strat.symbol}</strong></td>
                <td>${strat.strategy}</td>
                <td>${strat.strikes}</td>
                <td class="positive">$${typeof strat.maxProfit === 'number' ? strat.maxProfit.toFixed(2) : strat.maxProfit}</td>
                <td class="negative">$${typeof strat.maxLoss === 'number' ? strat.maxLoss.toFixed(2) : strat.maxLoss}</td>
                <td>${strat.pop.toFixed(1)}%</td>
                <td>${strat.dte}d</td>
                <td><strong class="score-${getScoreClass(strat.score)}">${strat.score.toFixed(0)}</strong></td>
            `;
            tbody.appendChild(row);
        }
        
    } catch (error) {
        console.error('Strategy finder error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="error">Error finding strategies</td></tr>';
    }
}

/**
 * Load flow data
 */
async function loadFlowData() {
    const tbody = document.getElementById('flowResults');
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading flow data...</td></tr>';
    
    try {
        // Simulate flow data (in production, use real-time flow APIs)
        const flowData = [];
        
        for (const symbol of OptionsData.ROBINHOOD_STOCKS.slice(0, 30)) {
            const stockPrice = await OptionsData.getStockPrice(symbol);
            if (!stockPrice) continue;
            
            const chain = OptionsData.generateOptionsChain(symbol, stockPrice);
            
            // Find unusual flow
            const unusualFlow = chain.filter(opt => 
                opt.volume > opt.openInterest * 2 && opt.volume > 500
            );
            
            flowData.push(...unusualFlow.slice(0, 3));
        }
        
        // Sort by premium
        flowData.sort((a, b) => (b.last * b.volume) - (a.last * a.volume));
        
        displayFlowData(flowData.slice(0, 50));
        updateFlowMetrics(flowData);
        updatePutCallChart();
        
    } catch (error) {
        console.error('Flow data error:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="error">Error loading flow data</td></tr>';
    }
}

/**
 * Display flow data
 */
function displayFlowData(flowData) {
    const tbody = document.getElementById('flowResults');
    tbody.innerHTML = '';
    
    for (const opt of flowData) {
        const row = document.createElement('tr');
        const time = new Date().toLocaleTimeString();
        const premium = opt.last * opt.volume * 100;
        const sentiment = opt.type === 'call' ? 'Bullish' : 'Bearish';
        
        let category = 'Standard';
        if (premium > 100000) category = 'Whale';
        else if (opt.volume > opt.openInterest * 5) category = 'Sweep';
        else if (opt.volume > opt.openInterest * 3) category = 'Unusual';
        
        row.innerHTML = `
            <td>${time}</td>
            <td><strong>${opt.symbol}</strong></td>
            <td><span class="badge ${opt.type}">${opt.type.toUpperCase()}</span></td>
            <td>$${opt.strike}</td>
            <td>${opt.expirationString}</td>
            <td>$${premium.toLocaleString()}</td>
            <td>${opt.volume.toLocaleString()}</td>
            <td><span class="sentiment-${sentiment.toLowerCase()}">${sentiment}</span></td>
            <td><span class="category-${category.toLowerCase()}">${category}</span></td>
        `;
        tbody.appendChild(row);
    }
}

/**
 * Update flow metrics
 */
function updateFlowMetrics(flowData) {
    const bullish = flowData.filter(opt => opt.type === 'call')
        .reduce((sum, opt) => sum + opt.last * opt.volume * 100, 0);
    
    const bearish = flowData.filter(opt => opt.type === 'put')
        .reduce((sum, opt) => sum + opt.last * opt.volume * 100, 0);
    
    const whales = flowData.filter(opt => opt.last * opt.volume * 100 > 100000).length;
    const sweeps = flowData.filter(opt => opt.volume > opt.openInterest * 5).length;
    
    document.getElementById('bullishFlow').textContent = '$' + (bullish / 1000000).toFixed(2) + 'M';
    document.getElementById('bearishFlow').textContent = '$' + (bearish / 1000000).toFixed(2) + 'M';
    document.getElementById('whaleCount').textContent = whales;
    document.getElementById('sweepCount').textContent = sweeps;
}

/**
 * Update Put/Call ratio chart
 */
function updatePutCallChart() {
    const canvas = document.getElementById('putCallChart');
    const ctx = canvas.getContext('2d');
    
    // Generate sample data (in production, use real historical data)
    const labels = [];
    const data = [];
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        data.push(0.7 + Math.random() * 0.6); // 0.7 to 1.3
    }
    
    if (putCallChart) {
        putCallChart.destroy();
    }
    
    putCallChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Put/Call Ratio',
                data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Ratio' }
                }
            }
        }
    });
}

/**
 * Update portfolio display
 */
function updatePortfolioDisplay() {
    const stats = Portfolio.getStatistics();
    
    // Update metrics
    document.getElementById('totalPL').textContent = formatCurrency(stats.totalPL);
    document.getElementById('totalPL').className = 'metric-value ' + (stats.totalPL >= 0 ? 'positive' : 'negative');
    
    document.getElementById('plPercent').textContent = formatPercent(stats.plPercent);
    document.getElementById('plPercent').className = 'metric-label ' + (stats.plPercent >= 0 ? 'positive' : 'negative');
    
    document.getElementById('openPositions').textContent = stats.openPositions;
    document.getElementById('winRate').textContent = stats.winRate.toFixed(1) + '%';
    document.getElementById('totalRisk').textContent = formatCurrency(stats.totalRisk);
    
    // Update positions table
    updatePositionsTable();
}

/**
 * Update positions table
 */
function updatePositionsTable() {
    const tbody = document.getElementById('portfolioResults');
    
    if (Portfolio.positions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No positions. Add your first trade above!</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    for (const pos of Portfolio.positions) {
        const row = document.createElement('tr');
        const pl = pos.unrealizedPL || 0;
        const plPercent = pos.unrealizedPLPercent || 0;
        
        row.innerHTML = `
            <td><strong>${pos.symbol}</strong></td>
            <td><span class="badge ${pos.type}">${pos.type.toUpperCase()}</span></td>
            <td>$${pos.strike}</td>
            <td>${new Date(pos.expiration).toLocaleDateString()}</td>
            <td>${pos.quantity}</td>
            <td>$${pos.premium.toFixed(2)}</td>
            <td>$${(pos.currentPrice || pos.premium).toFixed(2)}</td>
            <td class="${pl >= 0 ? 'positive' : 'negative'}">${formatCurrency(pl)}</td>
            <td class="${plPercent >= 0 ? 'positive' : 'negative'}">${formatPercent(plPercent)}</td>
            <td>
                <button class="btn-small btn-danger" onclick="closePosition(${pos.id})">Close</button>
                <button class="btn-small btn-secondary" onclick="deletePosition(${pos.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    }
}

/**
 * Handle add position
 */
function handleAddPosition() {
    const position = {
        symbol: document.getElementById('posSymbol').value.trim().toUpperCase(),
        type: document.getElementById('posType').value,
        strike: document.getElementById('posStrike').value,
        expiration: document.getElementById('posExpiration').value,
        quantity: document.getElementById('posQuantity').value,
        premium: document.getElementById('posPremium').value
    };
    
    // Validate
    if (!position.symbol || !position.strike || !position.expiration || !position.quantity || !position.premium) {
        alert('Please fill in all fields');
        return;
    }
    
    Portfolio.addPosition(position);
    
    // Clear form
    document.getElementById('posSymbol').value = '';
    document.getElementById('posStrike').value = '';
    document.getElementById('posExpiration').value = '';
    document.getElementById('posQuantity').value = '1';
    document.getElementById('posPremium').value = '';
    
    updatePortfolioDisplay();
    
    alert(`Position added: ${position.symbol} ${position.type.toUpperCase()} $${position.strike}`);
}

/**
 * Close position
 */
function closePosition(id) {
    const exitPremium = prompt('Enter exit premium:');
    if (exitPremium === null) return;
    
    const closed = Portfolio.closePosition(id, parseFloat(exitPremium));
    if (closed) {
        updatePortfolioDisplay();
        alert(`Position closed. P&L: ${formatCurrency(closed.pl)} (${formatPercent(closed.plPercent)})`);
    }
}

/**
 * Delete position
 */
function deletePosition(id) {
    if (confirm('Are you sure you want to delete this position?')) {
        Portfolio.deletePosition(id);
        updatePortfolioDisplay();
    }
}

/**
 * Add position - make it globally accessible
 */
window.addPosition = handleAddPosition;
window.closePosition = closePosition;
window.deletePosition = deletePosition;
window.showStrategy = showStrategy;

/**
 * Update market status
 */
function updateMarketStatus() {
    if (!window.OptionsData) return;
    
    const status = OptionsData.getMarketStatus();
    const statusEl = document.getElementById('marketStatus');
    
    if (!statusEl) return; // Exit if element doesn't exist
    
    const dot = statusEl.querySelector('.status-dot');
    const textSpans = statusEl.querySelectorAll('span:not(.status-dot)');
    const text = textSpans.length > 0 ? textSpans[0] : null;
    
    if (text) {
        text.textContent = status.status;
    }
    
    if (dot) {
        dot.className = 'status-dot ' + (status.isOpen ? 'open' : 'closed');
    }
    
    // Update status indicator class
    statusEl.className = 'status-indicator ' + (status.isOpen ? 'status-positive' : 'status-neutral');
    
    // Update last updated time if element exists
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = 'Last Updated: ' + new Date().toLocaleTimeString();
    }
}

/**
 * Helper: Format currency
 */
function formatCurrency(value) {
    const sign = value >= 0 ? '+' : '';
    return sign + '$' + Math.abs(value).toFixed(2);
}

/**
 * Helper: Format percentage
 */
function formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
}

/**
 * Helper: Get score class
 */
function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

/**
 * Check data source and display warning banner
 */
function checkDataSource() {
    const banner = document.getElementById('dataSourceBanner');
    const bannerText = document.getElementById('dataSourceText');
    
    // Check if RealTimeData is available and configured
    const hasRealData = window.RealTimeData && (
        RealTimeData.apis.polygon.enabled ||
        RealTimeData.apis.tradier.enabled ||
        RealTimeData.apis.yahoo.enabled
    );
    
    if (hasRealData) {
        // Determine which API is active
        let activeAPI = 'Unknown';
        if (RealTimeData.apis.polygon.enabled) activeAPI = 'Massive.com';
        else if (RealTimeData.apis.tradier.enabled) activeAPI = 'Tradier';
        else if (RealTimeData.apis.yahoo.enabled) activeAPI = 'Yahoo Finance';
        
        banner.className = 'data-source-banner real-data';
        bannerText.innerHTML = `<strong>✓ LIVE DATA MODE</strong> - Using real market data from ${activeAPI}`;
        banner.style.display = 'block';
        
        console.log(`✅ Using REAL data from ${activeAPI}`);
    } else {
        // Show warning for simulated data
        banner.className = 'data-source-banner simulated-data';
        bannerText.innerHTML = `<strong>⚠️ DEMO MODE</strong> - Using simulated data. <a href="#" style="color: inherit; text-decoration: underline;" onclick="alert('To enable real data:\\n\\n1. Configure your API key in js/realtime-data.js\\n2. Set polygon.enabled = true\\n3. Refresh the page\\n\\nSee documentation for details.')">Enable Real Data</a>`;
        banner.style.display = 'block';
        
        console.warn('⚠️ Using SIMULATED data - configure API keys for real data');
    }
}

/**
 * Show disclaimer modal
 */
function showDisclaimer() {
    alert('DISCLAIMER:\n\nThis platform is for educational purposes only. Options trading involves substantial risk and is not suitable for all investors. Past performance does not guarantee future results. Always consult with a licensed financial advisor before making investment decisions.');
}

/**
 * Show about modal
 */
function showAbout() {
    alert('Options Intelligence Platform\n\nAn institutional-grade options analysis platform featuring:\n\n- Real-time options scanning\n- 10+ trading signal algorithms\n- Greeks analysis\n- Strategy finder\n- Flow tracking\n- Portfolio management\n\nVersion 1.0');
}

/**
 * Configure API
 */
function configureAPI() {
    const provider = document.getElementById('apiProvider').value;
    const apiKey = document.getElementById('apiKeyInput').value;
    
    if (provider === 'yahoo') {
        RealTimeData.apis.yahoo.enabled = true;
        document.getElementById('dataSourceStatus').textContent = 'Yahoo Finance (Free, Limited)';
        document.getElementById('dataSourceStatus').style.color = '#00ff88';
        alert('✅ Yahoo Finance enabled! Note: Data may be limited or delayed.');
        return;
    }
    
    if (!apiKey) {
        alert('⚠️ Please enter an API key for ' + provider);
        return;
    }
    
    const success = RealTimeData.configureAPI(provider, apiKey);
    
    if (success) {
        document.getElementById('dataSourceStatus').textContent = `${provider} - Connected ✅`;
        document.getElementById('dataSourceStatus').style.color = '#00ff88';
        alert(`✅ ${provider} API configured successfully!`);
    } else {
        alert('❌ Failed to configure API. Please check your settings.');
    }
}

// Make globally available
window.configureAPI = configureAPI;

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
