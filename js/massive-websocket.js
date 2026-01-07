/**
 * MASSIVE WEBSOCKET CLIENT
 * Real-time streaming market data
 * 
 * Features:
 * - Single connection for all stocks
 * - Real-time price updates
 * - Zero rate limit issues
 * - Event-driven architecture
 * 
 * VERSION: 1.0.0
 */

class MassiveWebSocket {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.ws = null;
        this.connected = false;
        this.authenticated = false;
        this.subscribers = new Map();
        this.priceCache = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.messageHandlers = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Connect to real-time feed
                console.log('🔌 Connecting to Massive WebSocket...');
                this.ws = new WebSocket('wss://socket.massive.com/stocks');

                this.ws.onopen = () => {
                    console.log('✅ Massive WebSocket connected');
                    this.connected = true;
                    this.reconnectAttempts = 0;
                };

                this.ws.onmessage = (event) => {
                    try {
                        const messages = JSON.parse(event.data);
                        if (Array.isArray(messages)) {
                            messages.forEach(msg => this.handleMessage(msg));
                        } else {
                            this.handleMessage(messages);
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                };

                this.ws.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    this.connected = false;
                    this.authenticated = false;
                    this.attemptReconnect();
                };

                // Wait for connection and authentication
                setTimeout(() => {
                    if (this.authenticated) {
                        resolve();
                    } else if (this.connected) {
                        // Connected but not authenticated yet, authenticate now
                        this.authenticate().then(resolve).catch(reject);
                    } else {
                        reject(new Error('Connection timeout'));
                    }
                }, 2000);

            } catch (error) {
                reject(error);
            }
        });
    }

    async authenticate() {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected'));
                return;
            }

            console.log('🔐 Authenticating...');

            // Send authentication request
            const authMsg = {
                action: 'auth',
                params: this.apiKey
            };

            this.ws.send(JSON.stringify(authMsg));

            // Wait for auth success
            const authTimeout = setTimeout(() => {
                if (!this.authenticated) {
                    reject(new Error('Authentication timeout'));
                }
            }, 5000);

            // Store resolve/reject for when we get auth response
            this._authResolve = () => {
                clearTimeout(authTimeout);
                resolve();
            };
            this._authReject = (error) => {
                clearTimeout(authTimeout);
                reject(error);
            };
        });
    }

    subscribe(symbols) {
        if (!this.authenticated) {
            console.warn('⚠️ Not authenticated, cannot subscribe');
            return;
        }

        // Subscribe to aggregate minute bars for real-time prices
        const params = symbols.map(sym => `AM.${sym}`).join(',');
        
        const subMsg = {
            action: 'subscribe',
            params: params
        };

        this.ws.send(JSON.stringify(subMsg));
        console.log(`📡 Subscribed to ${symbols.length} stocks via WebSocket`);

        // Track subscriptions
        symbols.forEach(sym => this.subscribers.set(sym, true));
    }

    handleMessage(msg) {
        switch(msg.ev) {
            case 'status':
                if (msg.status === 'connected') {
                    this.connected = true;
                    console.log('✅ WebSocket status: connected');
                } else if (msg.status === 'auth_success') {
                    this.authenticated = true;
                    console.log('✅ WebSocket authenticated successfully');
                    if (this._authResolve) {
                        this._authResolve();
                    }
                } else if (msg.status === 'auth_failed') {
                    console.error('❌ WebSocket authentication failed');
                    if (this._authReject) {
                        this._authReject(new Error('Authentication failed'));
                    }
                }
                break;

            case 'AM': // Aggregate Minute bar
                this.handleAggregateMinute(msg);
                break;

            case 'T': // Trade
                this.handleTrade(msg);
                break;

            case 'Q': // Quote
                this.handleQuote(msg);
                break;

            default:
                // console.log('WebSocket message:', msg.ev);
        }
    }

    handleAggregateMinute(msg) {
        // msg structure:
        // {
        //   ev: "AM",
        //   sym: "AAPL",
        //   v: 12345,       // volume
        //   o: 150.85,      // open
        //   c: 152.90,      // close
        //   h: 153.17,      // high
        //   l: 150.50,      // low
        //   a: 151.87,      // VWAP
        //   s: 1611082800000, // start timestamp
        //   e: 1611082860000  // end timestamp
        // }

        const priceData = {
            symbol: msg.sym,
            price: msg.c,  // Close price
            open: msg.o,
            high: msg.h,
            low: msg.l,
            vwap: msg.a,
            volume: msg.v,
            change: msg.c - msg.o,
            changePercent: ((msg.c - msg.o) / msg.o) * 100,
            timestamp: msg.e,
            source: 'massive-websocket'
        };

        this.priceCache.set(msg.sym, priceData);
        
        // Notify subscribers
        if (this.onPriceUpdate) {
            this.onPriceUpdate(priceData);
        }

        // console.log(`📊 ${msg.sym}: $${msg.c.toFixed(2)} (${priceData.changePercent.toFixed(2)}%)`);
    }

    handleTrade(msg) {
        // Real-time trade data
        // Could be used for more granular updates
        // For now, just cache the latest trade price
        const priceData = {
            symbol: msg.sym,
            price: msg.p,
            volume: msg.s,
            timestamp: msg.t,
            source: 'massive-websocket-trade'
        };

        // Update cache if we don't have aggregate data yet
        if (!this.priceCache.has(msg.sym)) {
            this.priceCache.set(msg.sym, priceData);
        }
    }

    handleQuote(msg) {
        // Real-time quote (bid/ask) data
        // Similar to trade, cache for reference
    }

    getPrice(symbol) {
        return this.priceCache.get(symbol);
    }

    getAllPrices() {
        return Array.from(this.priceCache.values());
    }

    isSubscribed(symbol) {
        return this.subscribers.has(symbol);
    }

    isReady() {
        return this.connected && this.authenticated;
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`🔄 Reconnecting in ${delay/1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.connect().catch(err => {
                console.error('Reconnection failed:', err);
            });
        }, delay);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
            this.authenticated = false;
            console.log('🔌 WebSocket disconnected');
        }
    }
}

// Export for use in other modules
window.MassiveWebSocket = MassiveWebSocket;

console.log('✅ Massive WebSocket Client loaded (v1.0.0)');
