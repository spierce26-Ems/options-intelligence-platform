/**
 * NEWS SENTIMENT INTELLIGENCE ENGINE
 * Multi-source news aggregation and AI-powered sentiment analysis
 */

const NewsSentimentEngine = {
    
    // API Configuration
    apis: {
        newsapi: {
            enabled: false,
            apiKey: '', // Get free key from newsapi.org
            baseUrl: 'https://newsapi.org/v2',
            limit: 100 // Free tier: 100 requests/day
        },
        alphavantage: {
            enabled: false,
            apiKey: '', // Get free key from alphavantage.co
            baseUrl: 'https://www.alphavantage.co/query',
            function: 'NEWS_SENTIMENT'
        },
        finnhub: {
            enabled: false,
            apiKey: '', // Get free key from finnhub.io
            baseUrl: 'https://finnhub.io/api/v1',
            limit: 60 // Free tier: 60 calls/minute
        }
    },
    
    // News cache
    cache: {},
    cacheTimeout: 15 * 60 * 1000, // 15 minutes
    
    /**
     * Fetch news from multiple sources
     */
    async fetchNews(query, lookbackHours = 24) {
        const cacheKey = `news_${query}_${lookbackHours}`;
        
        // Check cache
        const cached = this.cache[cacheKey];
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log(`📰 Using cached news for ${query}`);
            return cached.data;
        }
        
        const allNews = [];
        
        // Try multiple sources
        if (this.apis.newsapi.enabled) {
            const newsApiResults = await this.fetchFromNewsAPI(query, lookbackHours);
            allNews.push(...newsApiResults);
        }
        
        if (this.apis.alphavantage.enabled) {
            const avResults = await this.fetchFromAlphaVantage(query);
            allNews.push(...avResults);
        }
        
        if (this.apis.finnhub.enabled) {
            const finnhubResults = await this.fetchFromFinnhub(query);
            allNews.push(...finnhubResults);
        }
        
        // If no APIs enabled, generate simulated news for testing
        if (allNews.length === 0) {
            allNews.push(...this.generateSimulatedNews(query, lookbackHours));
        }
        
        // Deduplicate and sort by timestamp
        const uniqueNews = this.deduplicateNews(allNews);
        uniqueNews.sort((a, b) => b.timestamp - a.timestamp);
        
        // Cache results
        this.cache[cacheKey] = {
            data: uniqueNews,
            timestamp: Date.now()
        };
        
        return uniqueNews;
    },
    
    /**
     * Fetch from NewsAPI.org
     */
    async fetchFromNewsAPI(query, lookbackHours) {
        try {
            const fromDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
            const fromDateStr = fromDate.toISOString().split('T')[0];
            
            const url = `${this.apis.newsapi.baseUrl}/everything?q=${encodeURIComponent(query)}&from=${fromDateStr}&sortBy=publishedAt&apiKey=${this.apis.newsapi.apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(data.message || 'NewsAPI error');
            }
            
            return data.articles.map(article => ({
                title: article.title,
                description: article.description,
                content: article.content,
                url: article.url,
                source: article.source.name,
                timestamp: new Date(article.publishedAt).getTime(),
                imageUrl: article.urlToImage,
                sentiment: null, // To be analyzed
                relevance: 0.8,
                apiSource: 'newsapi'
            }));
            
        } catch (error) {
            console.log('NewsAPI fetch failed:', error.message);
            return [];
        }
    },
    
    /**
     * Fetch from Alpha Vantage
     */
    async fetchFromAlphaVantage(ticker) {
        try {
            const url = `${this.apis.alphavantage.baseUrl}?function=${this.apis.alphavantage.function}&tickers=${ticker}&apikey=${this.apis.alphavantage.apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.feed) {
                throw new Error('No feed data from Alpha Vantage');
            }
            
            return data.feed.map(item => ({
                title: item.title,
                description: item.summary,
                content: item.summary,
                url: item.url,
                source: item.source,
                timestamp: new Date(item.time_published).getTime(),
                sentiment: parseFloat(item.overall_sentiment_score), // AV provides this!
                relevance: parseFloat(item.relevance_score),
                apiSource: 'alphavantage',
                tickerSentiment: item.ticker_sentiment?.find(ts => ts.ticker === ticker)
            }));
            
        } catch (error) {
            console.log('Alpha Vantage fetch failed:', error.message);
            return [];
        }
    },
    
    /**
     * Fetch from Finnhub
     */
    async fetchFromFinnhub(symbol) {
        try {
            const url = `${this.apis.finnhub.baseUrl}/company-news?symbol=${symbol}&from=${this.getDateDaysAgo(7)}&to=${this.getDateDaysAgo(0)}&token=${this.apis.finnhub.apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            return data.map(item => ({
                title: item.headline,
                description: item.summary,
                content: item.summary,
                url: item.url,
                source: item.source,
                timestamp: item.datetime * 1000, // Unix timestamp
                imageUrl: item.image,
                sentiment: null,
                relevance: 0.7,
                apiSource: 'finnhub'
            }));
            
        } catch (error) {
            console.log('Finnhub fetch failed:', error.message);
            return [];
        }
    },
    
    /**
     * Analyze sentiment using keywords (simple version)
     * In production, use OpenAI/Hugging Face
     */
    analyzeSentiment(text) {
        if (!text) return { score: 0, label: 'neutral', confidence: 0 };
        
        const lowerText = text.toLowerCase();
        
        // Positive keywords
        const positiveKeywords = [
            'surge', 'soar', 'jump', 'rally', 'boost', 'gain', 'rise', 'growth',
            'bullish', 'optimistic', 'strong', 'beat', 'exceed', 'outperform',
            'breakthrough', 'success', 'win', 'approve', 'agreement', 'deal',
            'profit', 'revenue', 'upgrade', 'buy'
        ];
        
        // Negative keywords
        const negativeKeywords = [
            'plunge', 'crash', 'fall', 'drop', 'decline', 'loss', 'weak',
            'bearish', 'pessimistic', 'miss', 'fail', 'cut', 'reduce',
            'lawsuit', 'investigation', 'scandal', 'bankruptcy', 'downgrade',
            'concern', 'worry', 'fear', 'risk', 'threat', 'sell', 'underperform'
        ];
        
        let score = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        
        // Count positive keywords
        for (const keyword of positiveKeywords) {
            const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
            positiveCount += matches;
            score += matches * 0.1;
        }
        
        // Count negative keywords
        for (const keyword of negativeKeywords) {
            const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
            negativeCount += matches;
            score -= matches * 0.1;
        }
        
        // Normalize to -1 to +1 range
        score = Math.max(-1, Math.min(1, score));
        
        const label = score > 0.15 ? 'bullish' : score < -0.15 ? 'bearish' : 'neutral';
        const confidence = Math.min(1, (positiveCount + negativeCount) / 5);
        
        return { score, label, confidence };
    },
    
    /**
     * Calculate aggregate sentiment for a ticker
     */
    calculateAggregateSentiment(newsArticles) {
        if (newsArticles.length === 0) {
            return {
                score: 0,
                label: 'neutral',
                confidence: 0,
                articleCount: 0,
                recentTrend: 'neutral'
            };
        }
        
        let totalScore = 0;
        let totalWeight = 0;
        const now = Date.now();
        
        for (const article of newsArticles) {
            // Analyze sentiment if not provided
            let sentiment = article.sentiment;
            if (sentiment === null || sentiment === undefined) {
                const analysis = this.analyzeSentiment(article.title + ' ' + article.description);
                sentiment = analysis.score;
            }
            
            // Time decay: recent news weighs more
            const ageInHours = (now - article.timestamp) / (1000 * 60 * 60);
            const timeWeight = Math.exp(-0.1 * ageInHours);
            
            // Relevance weight
            const relevanceWeight = article.relevance || 0.5;
            
            // Combined weight
            const weight = timeWeight * relevanceWeight;
            
            totalScore += sentiment * weight;
            totalWeight += weight;
        }
        
        const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const label = averageScore > 0.15 ? 'bullish' : averageScore < -0.15 ? 'bearish' : 'neutral';
        
        // Calculate recent trend (last 6 hours vs overall)
        const recentArticles = newsArticles.filter(a => (now - a.timestamp) < 6 * 60 * 60 * 1000);
        const recentSentiment = this.calculateAggregateSentiment(recentArticles).score;
        const recentTrend = recentSentiment > averageScore + 0.1 ? 'improving' :
                           recentSentiment < averageScore - 0.1 ? 'deteriorating' : 'stable';
        
        return {
            score: averageScore,
            label: label,
            confidence: Math.min(1, newsArticles.length / 10),
            articleCount: newsArticles.length,
            recentTrend: recentTrend
        };
    },
    
    /**
     * Deduplicate news articles
     */
    deduplicateNews(articles) {
        const seen = new Set();
        const unique = [];
        
        for (const article of articles) {
            // Create fingerprint from title
            const fingerprint = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
            
            if (!seen.has(fingerprint)) {
                seen.add(fingerprint);
                unique.push(article);
            }
        }
        
        return unique;
    },
    
    /**
     * Helper: Get date string days ago
     */
    getDateDaysAgo(days) {
        const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Generate simulated news for testing (until APIs are configured)
     */
    generateSimulatedNews(query, lookbackHours) {
        console.log(`⚠️ Generating simulated news for ${query} (configure APIs for real data)`);
        
        const templates = {
            'XOM': [
                { title: 'Exxon Reports Strong Q4 Earnings', sentiment: 0.7 },
                { title: 'Oil Prices Surge on Supply Concerns', sentiment: 0.6 },
                { title: 'Analyst Upgrades Exxon Stock to Buy', sentiment: 0.8 }
            ],
            'TSLA': [
                { title: 'Tesla Deliveries Beat Expectations', sentiment: 0.8 },
                { title: 'Musk Announces New Factory Plans', sentiment: 0.6 },
                { title: 'EV Competition Intensifies', sentiment: -0.3 }
            ],
            'AAPL': [
                { title: 'Apple Launches New iPhone Model', sentiment: 0.7 },
                { title: 'Services Revenue Hits Record High', sentiment: 0.8 },
                { title: 'iPhone Sales Miss Estimates', sentiment: -0.4 }
            ]
        };
        
        const newsItems = templates[query] || [
            { title: `${query} Stock Gains on Positive Outlook`, sentiment: 0.5 },
            { title: `Analysts Remain Bullish on ${query}`, sentiment: 0.6 }
        ];
        
        return newsItems.map((item, i) => ({
            title: item.title,
            description: item.title,
            content: item.title,
            url: '#',
            source: 'Simulated News',
            timestamp: Date.now() - (i * 3600000), // Hourly spacing
            sentiment: item.sentiment,
            relevance: 0.8,
            apiSource: 'simulated'
        }));
    }
};

// Export
window.NewsSentimentEngine = NewsSentimentEngine;
