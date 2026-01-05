/**
 * DEMO INTERFACE FOR ENHANCED INTELLIGENCE
 * Adds a "World Event Analyzer" button to Hot Picks tab
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced Intelligence Demo Interface Loading...');
    
    // Add demo button to Hot Picks tab after a short delay
    setTimeout(addDemoInterface, 2000);
});

function addDemoInterface() {
    // Find Hot Picks tab content
    const hotPicksTab = document.getElementById('hotpicks');
    if (!hotPicksTab) {
        console.warn('Hot Picks tab not found');
        return;
    }
    
    // Create demo interface container
    const demoContainer = document.createElement('div');
    demoContainer.className = 'world-event-analyzer';
    demoContainer.innerHTML = `
        <div class="event-analyzer-card" style="
            background: linear-gradient(135deg, rgba(26, 34, 53, 0.9) 0%, rgba(15, 21, 33, 0.9) 100%);
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        ">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                <i class="fas fa-brain" style="font-size: 2rem; color: var(--dtp-primary);"></i>
                <div>
                    <h3 style="margin: 0; color: var(--dtp-primary); font-size: 1.5rem;">
                        🧠 World Event Intelligence Analyzer
                    </h3>
                    <p style="margin: 0.5rem 0 0 0; color: var(--dtp-text-dim); font-size: 0.9rem;">
                        Analyze any world event with 7 institutional-grade intelligence layers
                    </p>
                </div>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
                <label style="display: block; color: var(--dtp-text); font-weight: 600; margin-bottom: 0.5rem;">
                    Enter World Event:
                </label>
                <textarea id="eventInput" placeholder="Example: Trump invaded Venezuela and captured Maduro. Motivated by oil control to let US companies rebuild infrastructure..." 
                    style="
                        width: 100%;
                        min-height: 100px;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(0, 255, 136, 0.2);
                        border-radius: 8px;
                        color: var(--dtp-text);
                        font-size: 1rem;
                        font-family: inherit;
                        resize: vertical;
                    "></textarea>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <label style="display: block; color: var(--dtp-text); font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        Timeframe:
                    </label>
                    <select id="timeframeSelect" style="
                        width: 100%;
                        padding: 0.75rem;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(0, 255, 136, 0.2);
                        border-radius: 8px;
                        color: var(--dtp-text);
                        font-size: 1rem;
                    ">
                        <option value="short">Short (1-7 days)</option>
                        <option value="medium">Medium (8-30 days)</option>
                        <option value="long">Long (31-90 days)</option>
                    </select>
                </div>
                
                <div style="flex: 1;">
                    <label style="display: block; color: var(--dtp-text); font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        Max Results:
                    </label>
                    <select id="maxResultsSelect" style="
                        width: 100%;
                        padding: 0.75rem;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(0, 255, 136, 0.2);
                        border-radius: 8px;
                        color: var(--dtp-text);
                        font-size: 1rem;
                    ">
                        <option value="5">Top 5</option>
                        <option value="10" selected>Top 10</option>
                        <option value="20">Top 20</option>
                        <option value="30">Top 30</option>
                    </select>
                </div>
            </div>
            
            <button id="analyzeEventBtn" style="
                width: 100%;
                padding: 1rem 2rem;
                background: linear-gradient(135deg, var(--dtp-primary), var(--dtp-secondary));
                border: none;
                border-radius: 8px;
                color: #0a0e1a;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0, 255, 136, 0.4)';" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <i class="fas fa-rocket"></i>
                ANALYZE EVENT & FIND OPPORTUNITIES
            </button>
            
            <div id="analysisProgress" style="display: none; margin-top: 1rem; padding: 1rem; background: rgba(0, 255, 136, 0.1); border-radius: 8px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--dtp-primary);"></i>
                <p style="margin: 0.5rem 0 0 0; color: var(--dtp-text);">
                    Analyzing event with 7 intelligence layers...
                </p>
            </div>
        </div>
        
        <div style="margin: 1rem 0; padding: 1rem; background: rgba(255, 215, 0, 0.1); border-left: 4px solid #ffd700; border-radius: 4px;">
            <strong style="color: #ffd700;">💡 Example Events to Try:</strong>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem; color: var(--dtp-text);">
                <li>"Fed announces surprise rate cut of 50 basis points"</li>
                <li>"Russia and Ukraine sign peace agreement, war ends"</li>
                <li>"Major oil refinery explosion cuts global supply by 20%"</li>
                <li>"FDA approves groundbreaking Alzheimer's drug"</li>
                <li>"China announces massive semiconductor investment program"</li>
            </ul>
        </div>
    `;
    
    // Insert at the top of Hot Picks content
    const pageHeader = hotPicksTab.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.insertAdjacentElement('afterend', demoContainer);
    } else {
        hotPicksTab.insertBefore(demoContainer, hotPicksTab.firstChild);
    }
    
    // Add event listener to analyze button
    document.getElementById('analyzeEventBtn').addEventListener('click', async function() {
        const eventInput = document.getElementById('eventInput').value.trim();
        const timeframe = document.getElementById('timeframeSelect').value;
        const maxResults = parseInt(document.getElementById('maxResultsSelect').value);
        
        if (!eventInput) {
            alert('Please enter a world event to analyze');
            return;
        }
        
        // Show progress
        document.getElementById('analysisProgress').style.display = 'block';
        this.disabled = true;
        
        try {
            console.log('🚀 Starting Enhanced Analysis...');
            console.log('Event:', eventInput);
            console.log('Timeframe:', timeframe);
            console.log('Max Results:', maxResults);
            
            // Run the analysis
            const results = await EnhancedHotPicks.analyzeEventAndFindOpportunities(
                eventInput,
                timeframe,
                maxResults
            );
            
            console.log('✅ Analysis Complete:', results);
            
            // Display results
            EnhancedHotPicksUI.displayAnalysisResults(results);
            
            // Scroll to results
            setTimeout(() => {
                const resultsContainer = document.getElementById('enhancedHotPicksResults');
                if (resultsContainer) {
                    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            alert('Analysis failed. Please check the console for details.');
        } finally {
            // Hide progress
            document.getElementById('analysisProgress').style.display = 'none';
            this.disabled = false;
        }
    });
    
    console.log('✅ Enhanced Intelligence Demo Interface Loaded');
}

// Quick test function
window.testEnhancedIntelligence = function() {
    const event = "Trump invaded Venezuela and captured Maduro. This is motivated by oil control to let US companies rebuild infrastructure.";
    
    EnhancedHotPicks.analyzeEventAndFindOpportunities(event, 'short', 10)
        .then(results => {
            console.log('📊 Results:', results);
            EnhancedHotPicksUI.displayAnalysisResults(results);
        })
        .catch(error => {
            console.error('❌ Error:', error);
        });
};

console.log('💡 Tip: You can run window.testEnhancedIntelligence() in the console to see a demo');
