/**
 * ENHANCED HOT PICKS UI
 * Display institutional-grade analysis results
 */

const EnhancedHotPicksUI = {
    
    /**
     * Display analysis results in the UI
     */
    displayAnalysisResults(results) {
        console.log('🎨 Rendering Enhanced Hot Picks UI...');
        
        // Get container
        const container = document.getElementById('enhancedHotPicksResults') || this.createContainer();
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create header
        const header = this.createHeader(results);
        container.appendChild(header);
        
        // Create market context section
        const context = this.createMarketContext(results);
        container.appendChild(context);
        
        // Create opportunities grid
        const opportunities = this.createOpportunitiesGrid(results.opportunities);
        container.appendChild(opportunities);
        
        console.log('✅ UI rendered');
    },
    
    /**
     * Create container if it doesn't exist
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'enhancedHotPicksResults';
        container.className = 'enhanced-hotpicks-container';
        
        // Insert after hot picks section
        const hotPicksSection = document.querySelector('.hot-picks-grid');
        if (hotPicksSection && hotPicksSection.parentNode) {
            hotPicksSection.parentNode.insertBefore(container, hotPicksSection.nextSibling);
        } else {
            document.querySelector('.tab-content').appendChild(container);
        }
        
        return container;
    },
    
    /**
     * Create header section
     */
    createHeader(results) {
        const header = document.createElement('div');
        header.className = 'enhanced-header';
        header.innerHTML = `
            <div class="enhanced-header-content">
                <h2>🧠 Institutional-Grade Event Analysis</h2>
                <div class="event-description">
                    <strong>Event:</strong> ${results.event}
                </div>
                <div class="meta-info">
                    <span class="meta-item">
                        <i class="fas fa-chart-line"></i>
                        ${results.opportunities.length} Opportunities
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-clock"></i>
                        Analyzed in ${results.processingTime}ms
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-brain"></i>
                        7 Intelligence Layers
                    </span>
                </div>
            </div>
        `;
        return header;
    },
    
    /**
     * Create market context section
     */
    createMarketContext(results) {
        const context = document.createElement('div');
        context.className = 'market-context';
        
        const regime = results.marketRegime;
        const macro = results.macroScenario;
        
        context.innerHTML = `
            <div class="context-grid">
                <div class="context-card regime-card">
                    <h3>📊 Market Regime</h3>
                    <div class="regime-badge ${regime.regime.toLowerCase()}">${regime.regime.replace('_', ' ')}</div>
                    <ul class="context-list">
                        ${regime.characteristics.slice(0, 3).map(c => `<li>${c}</li>`).join('')}
                    </ul>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${regime.confidence * 100}%"></div>
                        <span class="confidence-label">${(regime.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>
                </div>
                
                <div class="context-card macro-card">
                    <h3>🌍 Macro Scenario</h3>
                    <div class="macro-badge ${macro.primary.scenario.toLowerCase()}">${macro.primary.data.name}</div>
                    <div class="macro-strategy">
                        <strong>Strategy:</strong> ${macro.primary.data.optionsStrategy}
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${macro.primary.confidence * 100}%"></div>
                        <span class="confidence-label">${(macro.primary.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>
                </div>
            </div>
        `;
        
        return context;
    },
    
    /**
     * Create opportunities grid
     */
    createOpportunitiesGrid(opportunities) {
        const grid = document.createElement('div');
        grid.className = 'opportunities-grid';
        
        opportunities.forEach((opp, index) => {
            const card = this.createOpportunityCard(opp, index + 1);
            grid.appendChild(card);
        });
        
        return grid;
    },
    
    /**
     * Create individual opportunity card
     */
    createOpportunityCard(opp, rank) {
        const card = document.createElement('div');
        card.className = `opportunity-card rank-${Math.min(rank, 5)}`;
        
        const score = opp.enhancedScore.total;
        const scoreClass = score >= 80 ? 'score-excellent' : score >= 70 ? 'score-good' : score >= 60 ? 'score-moderate' : 'score-low';
        
        const direction = opp.direction === 'positive' ? 'bullish' : 'bearish';
        const directionIcon = opp.direction === 'positive' ? '📈' : '📉';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-rank">#${rank}</div>
                <div class="card-ticker-section">
                    <h3 class="card-ticker">${opp.ticker}</h3>
                    <div class="card-sector">${opp.sector}</div>
                    <div class="card-price">$${opp.stockPrice.toFixed(2)}</div>
                </div>
                <div class="card-score ${scoreClass}">
                    <div class="score-value">${score.toFixed(1)}</div>
                    <div class="score-label">Score</div>
                </div>
            </div>
            
            <div class="card-direction ${direction}">
                ${directionIcon} ${opp.action.type}
                <span class="conviction-badge">${opp.action.conviction}</span>
            </div>
            
            <div class="options-setup">
                <h4>Options Setup</h4>
                <div class="setup-grid">
                    <div class="setup-item">
                        <span class="setup-label">Type:</span>
                        <span class="setup-value">${opp.optionsSetup.type}</span>
                    </div>
                    <div class="setup-item">
                        <span class="setup-label">Strike:</span>
                        <span class="setup-value">$${opp.optionsSetup.strike}</span>
                    </div>
                    <div class="setup-item">
                        <span class="setup-label">Exp:</span>
                        <span class="setup-value">${opp.optionsSetup.dte} days</span>
                    </div>
                    <div class="setup-item">
                        <span class="setup-label">Cost:</span>
                        <span class="setup-value">$${opp.optionsSetup.estimatedCost.toFixed(0)}</span>
                    </div>
                    <div class="setup-item">
                        <span class="setup-label">Target:</span>
                        <span class="setup-value">$${opp.optionsSetup.targetPrice}</span>
                    </div>
                    <div class="setup-item">
                        <span class="setup-label">Max Profit:</span>
                        <span class="setup-value">${opp.optionsSetup.maxProfit}</span>
                    </div>
                </div>
            </div>
            
            <div class="risk-reward">
                <h4>Risk/Reward</h4>
                <div class="rr-grid">
                    <div class="rr-item">
                        <span class="rr-label">Stop Loss:</span>
                        <span class="rr-value">$${opp.riskReward.stopLoss.toFixed(2)}</span>
                    </div>
                    <div class="rr-item">
                        <span class="rr-label">Take Profit:</span>
                        <span class="rr-value">$${opp.riskReward.takeProfit.toFixed(2)}</span>
                    </div>
                    <div class="rr-item">
                        <span class="rr-label">R:R Ratio:</span>
                        <span class="rr-value ${this.getRRClass(opp.riskReward.riskRewardRatio)}">${opp.riskReward.riskRewardRatio}:1</span>
                    </div>
                    <div class="rr-item">
                        <span class="rr-label">Rec:</span>
                        <span class="rr-value">${opp.riskReward.recommendation}</span>
                    </div>
                </div>
            </div>
            
            <div class="score-breakdown">
                <h4>Score Breakdown</h4>
                <div class="breakdown-bars">
                    ${this.createScoreBar('Event Impact', opp.enhancedScore.eventImpact, 30)}
                    ${this.createScoreBar('Cross-Asset', opp.enhancedScore.crossAsset * 0.6, 15)}
                    ${this.createScoreBar('Macro', opp.enhancedScore.macroEconomic, 20)}
                    ${this.createScoreBar('Technical', opp.enhancedScore.technical, 10)}
                </div>
            </div>
            
            <div class="reasoning-section">
                <button class="show-reasoning-btn" onclick="EnhancedHotPicksUI.toggleReasoning('${opp.ticker}')">
                    Show Full Analysis <i class="fas fa-chevron-down"></i>
                </button>
                <div class="reasoning-content" id="reasoning-${opp.ticker}" style="display: none;">
                    ${opp.reasoning.map(r => `<p>${r}</p>`).join('')}
                </div>
            </div>
            
            <div class="confidence-footer">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${opp.confidence * 100}%"></div>
                </div>
                <span class="confidence-text">${(opp.confidence * 100).toFixed(0)}% Confidence</span>
            </div>
        `;
        
        return card;
    },
    
    /**
     * Create score bar
     */
    createScoreBar(label, score, max) {
        const percentage = (score / max) * 100;
        const colorClass = percentage >= 70 ? 'bar-high' : percentage >= 40 ? 'bar-medium' : 'bar-low';
        
        return `
            <div class="score-bar-item">
                <div class="score-bar-label">${label}</div>
                <div class="score-bar-container">
                    <div class="score-bar-fill ${colorClass}" style="width: ${percentage}%"></div>
                    <span class="score-bar-value">${score.toFixed(1)}/${max}</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Get risk/reward class
     */
    getRRClass(ratio) {
        const r = parseFloat(ratio);
        return r >= 2.0 ? 'rr-excellent' : r >= 1.5 ? 'rr-good' : r >= 1.0 ? 'rr-acceptable' : 'rr-poor';
    },
    
    /**
     * Toggle reasoning section
     */
    toggleReasoning(ticker) {
        const content = document.getElementById(`reasoning-${ticker}`);
        const btn = event.target.closest('.show-reasoning-btn');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.innerHTML = 'Hide Full Analysis <i class="fas fa-chevron-up"></i>';
        } else {
            content.style.display = 'none';
            btn.innerHTML = 'Show Full Analysis <i class="fas fa-chevron-down"></i>';
        }
    }
};

// Export
window.EnhancedHotPicksUI = EnhancedHotPicksUI;
