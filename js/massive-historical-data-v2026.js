/**
 * MASSIVE.COM HISTORICAL DATA ENGINE
 * Fetch real historical data for backtesting
 * 
 * API Documentation: https://polygon.io/docs (Massive.com uses Polygon infrastructure)
 * 
 * Key Endpoints:
 * - Stock prices: /v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}
 * - Options chains: /v3/snapshot/options/{underlying_asset}
 * - Historical options: /v3/reference/options/contracts
 */

const MassiveHistoricalData = {
    // Configuration
    get apiKey() {
        // Read API key dynamically from RealTimeData
        return RealTimeData?.apis?.polygon?.apiKey || '';
    },
    baseUrl: 'https://api.polygon.io',
    cache: {},
    
    /**
     * Check if API is configured
     */
    isConfigured() {
        const key = this.apiKey;
        const hasKey = key && key.length > 10 && key !== 'YOUR_NEW_API_KEY_HERE';
        
        if (!hasKey) {
            console.warn('⚠️ Massive.com API key not configured. Using simulated data.');
            console.warn(`   Current key: "${key}" (length: ${key?.length || 0})`);
        } else {
            console.log('✅ Massive.com API key configured:', key.substring(0, 8) + '...' + key.substring(key.length - 4));
        }
        
        return hasKey;
    },
    
    /**
     * Fetch historical stock prices (daily bars)
     */
    async getHistoricalPrices(symbol, startDate, endDate) {
        if (!this.isConfigured()) {
            console.warn(`⚠️ No API key - cannot fetch real data for ${symbol}`);
            return null;
        }
        
        const cacheKey = `prices_${symbol}_${startDate}_${endDate}`;
        if (this.cache[cacheKey]) {
            console.log(`📦 Using cached price data for ${symbol}`);
            return this.cache[cacheKey];
        }
        
        try {
            // Format dates as YYYY-MM-DD
            const fromDate = this.formatDate(startDate);
            const toDate = this.formatDate(endDate);
            
            // Polygon API endpoint for aggregates (daily bars)
            const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${this.apiKey}`;
            
            console.log(`📥 Fetching historical prices for ${symbol} (${fromDate} to ${toDate})...`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = 'Could not read error response';
                }
                
                console.error(`❌ Massive.com API Error (${response.status}):`, errorText);
                
                if (response.status === 401) {
                    console.error('   🔑 API Key Authentication Failed');
                    console.error('   → Check your API key at https://massive.com/dashboard');
                } else if (response.status === 429) {
                    console.error('   ⏱️ Rate Limit Exceeded');
                    console.error('   → Options Starter Plan: UNLIMITED calls/minute');
                    console.error('   → If seeing this, may be temporary throttle. Wait 60 seconds.');
                } else if (response.status === 403) {
                    console.error('   🚫 Access Forbidden - Free Tier Limitation');
                    console.error('   → Historical aggregates require paid plan ($49+/month)');
                    console.error('   → Upgrade at: https://polygon.io/pricing');
                } else if (response.status === 404) {
                    console.error('   🚫 Endpoint Not Found - FREE TIER LIMITATION');
                    console.error('   → /v2/aggs endpoint requires PAID plan');
                    console.error('   → Free tier only includes: quotes, trades, ticker data');
                    console.error('   → Historical data requires Starter plan ($49/month) or higher');
                    console.error('   → Upgrade at: https://polygon.io/pricing');
                    console.error('   ');
                    console.error('   💡 SOLUTION: Falling back to simulated data for backtesting');
                    console.error('   → For real trading, use current IV (free tier supports this)');
                    console.error('   → Or upgrade to paid plan for historical backtesting');
                }
                
                return null;
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                console.warn(`⚠️ No price data returned for ${symbol}`);
                return null;
            }
            
            // Transform to our format
            const prices = data.results.map(bar => ({
                date: this.formatDate(new Date(bar.t)),
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                volume: bar.v,
                timestamp: bar.t
            }));
            
            console.log(`✅ Fetched ${prices.length} days of price data for ${symbol}`);
            
            // Cache the results
            this.cache[cacheKey] = prices;
            
            return prices;
            
        } catch (error) {
            console.error(`❌ Error fetching prices for ${symbol}:`, error);
            return null;
        }
    },
    
    /**
     * Calculate historical IV from options data
     * This is complex - we'll use a simplified approach
     */
    async getHistoricalIV(symbol, date) {
        if (!this.isConfigured()) {
            return null;
        }
        
        try {
            // Get options snapshot for the date
            const url = `${this.baseUrl}/v3/snapshot/options/${symbol}?apiKey=${this.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                return null;
            }
            
            // Calculate average IV from ATM options
            const stockPrice = data.results[0]?.underlying_price || 0;
            
            // Find ATM options (within 5% of stock price)
            const atmOptions = data.results.filter(opt => {
                const strike = opt.details?.strike_price || 0;
                return Math.abs(strike - stockPrice) < stockPrice * 0.05;
            });
            
            if (atmOptions.length === 0) {
                return { iv: 30, price: stockPrice }; // Default if no data
            }
            
            // Average IV of ATM options
            const avgIV = atmOptions.reduce((sum, opt) => {
                const iv = opt.implied_volatility || 0.30;
                return sum + iv;  // Don't multiply by 100 here - already handled below
            }, 0) / atmOptions.length;
            
            return {
                iv: Math.round(avgIV * 100 * 10) / 10,  // Convert to percentage here
                price: stockPrice,
                date: date
            };
            
        } catch (error) {
            console.error(`Error fetching IV for ${symbol}:`, error);
            return null;
        }
    },
    
    /**
     * Build complete historical dataset for backtesting
     * Combines price data with estimated IV
     */
    async buildHistoricalDataset(symbol, startDate, endDate) {
        console.log(`\n🔨 Building historical dataset for ${symbol}...`);
        console.log(`   Period: ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`);
        
        // Get historical prices
        const prices = await this.getHistoricalPrices(symbol, startDate, endDate);
        
        if (!prices || prices.length === 0) {
            console.error(`❌ Could not fetch price data for ${symbol}`);
            return null;
        }
        
        console.log(`   ✅ Got ${prices.length} days of price data`);
        
        // Estimate IV for each day
        // Note: Real historical IV is hard to get from free APIs
        // We'll use a realistic estimation based on price volatility
        const dataset = this.estimateHistoricalIV(prices);
        
        console.log(`   ✅ Calculated IV for ${dataset.length} days`);
        console.log(`   ✅ Dataset ready for backtesting`);
        
        return dataset;
    },
    
    /**
     * Estimate historical IV from price volatility
     * Uses realized volatility as proxy for implied volatility
     */
    estimateHistoricalIV(prices) {
        const dataset = [];
        const windowSize = 20; // 20-day rolling volatility
        
        for (let i = 0; i < prices.length; i++) {
            const price = prices[i];
            
            // Calculate realized volatility over last N days
            let realizedVol = 30; // Default
            
            if (i >= windowSize) {
                const returns = [];
                for (let j = i - windowSize + 1; j <= i; j++) {
                    const ret = Math.log(prices[j].close / prices[j - 1].close);
                    returns.push(ret);
                }
                
                // Standard deviation of returns
                const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
                const stdDev = Math.sqrt(variance);
                
                // Annualized volatility (252 trading days)
                realizedVol = stdDev * Math.sqrt(252) * 100;
                
                // Add some randomness to make it more realistic (IV != realized vol)
                realizedVol = realizedVol * (0.9 + Math.random() * 0.3);
            }
            
            // Calculate IV Rank (need historical IV data)
            let ivRank = 50; // Default middle
            
            if (i >= 252) {
                // Use past year of IV data
                const pastYear = dataset.slice(Math.max(0, i - 252), i);
                if (pastYear.length > 0) {
                    const ivValues = pastYear.map(d => d.iv);
                    const minIV = Math.min(...ivValues);
                    const maxIV = Math.max(...ivValues);
                    
                    if (maxIV > minIV) {
                        ivRank = ((realizedVol - minIV) / (maxIV - minIV)) * 100;
                        // Clamp to 0-100 range
                        ivRank = Math.max(0, Math.min(100, ivRank));
                    }
                }
            }
            
            dataset.push({
                date: price.date,
                price: price.close,
                open: price.open,
                high: price.high,
                low: price.low,
                volume: price.volume,
                iv: Math.round(realizedVol * 10) / 10,
                ivRank: Math.round(ivRank * 10) / 10
            });
        }
        
        return dataset;
    },
    
    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        if (typeof date === 'string') return date;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    /**
     * Test API connection
     */
    async testConnection() {
        console.log('\n🧪 Testing Massive.com API connection...');
        
        if (!this.isConfigured()) {
            console.error('❌ API key not configured');
            return false;
        }
        
        try {
            // Test with a simple quote request
            const url = `${this.baseUrl}/v2/aggs/ticker/AAPL/prev?adjusted=true&apiKey=${this.apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error (${response.status}):`, errorText);
                return false;
            }
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                console.log('✅ API connection successful!');
                console.log(`   Sample data: AAPL = $${data.results[0].c}`);
                return true;
            } else {
                console.error('❌ No data returned');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Connection failed:', error);
            return false;
        }
    },
    
    /**
     * Get current IV for a symbol (for real-time scanning)
     */
    async getCurrentIV(symbol) {
        if (!this.isConfigured()) {
            return null;
        }
        
        try {
            const url = `${this.baseUrl}/v3/snapshot/options/${symbol}?apiKey=${this.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                return null;
            }
            
            const stockPrice = data.results[0]?.underlying_price || 0;
            
            // Find ATM options
            const atmOptions = data.results.filter(opt => {
                const strike = opt.details?.strike_price || 0;
                return Math.abs(strike - stockPrice) < stockPrice * 0.05;
            });
            
            if (atmOptions.length === 0) return null;
            
            // Average IV
            const avgIV = atmOptions.reduce((sum, opt) => {
                const iv = opt.implied_volatility || 0.30;
                return sum + (iv * 100);
            }, 0) / atmOptions.length;
            
            return {
                symbol: symbol,
                price: stockPrice,
                iv: Math.round(avgIV * 10) / 10,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error(`Error fetching current IV for ${symbol}:`, error);
            return null;
        }
    }
};

// Export
window.MassiveHistoricalData = MassiveHistoricalData;

console.log('✅ Massive Historical Data Engine loaded');

// Auto-test connection
if (window.RealTimeData?.apis?.polygon?.enabled) {
    console.log('🔌 Massive.com API detected - historical data available');
}
