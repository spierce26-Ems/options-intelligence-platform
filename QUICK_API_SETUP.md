# ⚡ Quick API Setup Guide
**Get Real-Time Data in 10 Minutes**

---

## 🏆 Recommended: Tradier API

### Why Tradier?
- ✅ **FREE Sandbox** to start
- ✅ **$10/month** for real-time
- ✅ **Complete options data** with Greeks
- ✅ **Already integrated** in your platform
- ✅ **No rate limits** on paid plan

---

## 🚀 5-Minute Setup

### Step 1: Sign Up (2 min)
```
1. Go to: https://developer.tradier.com
2. Click "Get Started"
3. Create free account
4. Verify your email
```

### Step 2: Get API Key (1 min)
```
1. Login to developer dashboard
2. Navigate to "API Access" or "Applications"
3. Click "Create Application"
4. Copy your Sandbox API Key
5. Save it somewhere safe
```

### Step 3: Add to Platform (2 min)

Open your browser console on the platform and run:

```javascript
// Configure Tradier Sandbox (FREE)
RealTimeData.configureAPI('tradier', 'YOUR_SANDBOX_KEY_HERE', {
    sandbox: true
});

// Test connection
RealTimeData.testConnection('tradier');
```

Or edit the file directly:

**File:** `js/realtime-data.js`

```javascript
apis: {
    tradier: {
        enabled: true,        // ← Change from false
        apiKey: 'YOUR_KEY',   // ← Add your key
        sandbox: true,        // ← Keep true for sandbox
        baseUrl: 'https://sandbox.tradier.com/v1'
    },
    // ... other APIs
}
```

---

## ✅ Test It Works

### Test Stock Quotes
```javascript
// In browser console:
const price = await RealTimeData.getStockPrice('AAPL');
console.log('AAPL Price:', price);

// Should return:
// {
//   price: 178.50,
//   change: 2.34,
//   changePercent: 1.33,
//   volume: 52000000,
//   source: 'tradier'
// }
```

### Test Options Chain
```javascript
const chain = await RealTimeData.getOptionsChain('AAPL');
console.log('Options:', chain.options.length, 'contracts');

// Should return:
// Options: 200+ contracts
```

### Use in Platform
1. Go to **Hot Picks** tab - Click refresh
2. Go to **Search Ticker** - Search for AAPL
3. Go to **Scanner** - Run scan
4. **See real data!** 🎉

---

## 💰 Upgrade to Real-Time ($10/month)

### When Ready for Live Data:

1. **Upgrade Plan**
   - Go to: https://brokerage.tradier.com/market-data
   - Subscribe to "Market Data" plan ($10/month)
   - Get your Production API key

2. **Update Configuration**
   ```javascript
   RealTimeData.configureAPI('tradier', 'YOUR_PRODUCTION_KEY', {
       sandbox: false  // ← Change to false
   });
   ```

3. **Change Base URL** (in code)
   ```javascript
   baseUrl: 'https://api.tradier.com/v1'  // ← Remove 'sandbox'
   ```

4. **Deploy!** 🚀

---

## 🎯 What You Get

### Sandbox (FREE)
- ✅ Same API structure as real-time
- ✅ Test all features
- ✅ Build your platform
- ⏰ 15-minute delayed quotes
- ✅ Perfect for development

### Real-Time ($10/month)
- ✅ Live real-time quotes
- ✅ Complete options chains
- ✅ All Greeks (Delta, Gamma, Theta, Vega, IV)
- ✅ Volume & Open Interest
- ✅ Unlimited API calls
- ✅ Historical data
- ✅ WebSocket streaming
- ✅ Perfect for production

---

## 🔧 Alternative: TD Ameritrade (FREE)

### If You Have TD Ameritrade Account:

1. **Get API Key**
   - Go to: https://developer.tdameritrade.com
   - Create app
   - Get Client ID (API key)

2. **Setup OAuth**
   ```javascript
   // More complex - requires OAuth flow
   // See TD Ameritrade documentation
   ```

3. **Configure**
   ```javascript
   RealTimeData.configureAPI('tdameritrade', 'YOUR_CLIENT_ID');
   ```

**Pros:** Completely free  
**Cons:** Requires account, OAuth setup

---

## 📊 Data Coverage

### Stock Quotes
```javascript
{
    price: 178.50,
    change: 2.34,
    changePercent: 1.33,
    volume: 52000000,
    timestamp: 1234567890,
    source: 'tradier'
}
```

### Options Chains
```javascript
{
    options: [
        {
            symbol: 'AAPL240119C00150000',
            strike: 150,
            type: 'call',
            expiration: 1705622400000,
            dte: 15,
            bid: 2.40,
            ask: 2.45,
            last: 2.43,
            volume: 5000,
            openInterest: 12000,
            iv: 32.5,
            delta: 0.65,
            gamma: 0.05,
            theta: -0.08,
            vega: 0.15
        },
        // ... hundreds more
    ],
    source: 'tradier',
    timestamp: 1234567890
}
```

---

## 🎓 Pro Tips

### 1. Cache Responses
```javascript
// Don't call API every second
// Cache for 1 minute for stocks
// Cache for 5 minutes for options
```

### 2. Use Scanner Wisely
```javascript
// Scan 100 stocks = 100 API calls
// Do this once per hour, not every minute
```

### 3. Monitor Usage
```javascript
// Tradier sandbox: Unlimited
// Tradier production: Unlimited
// But be reasonable!
```

### 4. Handle Errors
```javascript
// Your platform already has fallback
// Tradier → Yahoo → Simulated
```

---

## 🚨 Important Notes

### Sandbox Limitations
- ✅ **Same API structure** as real-time
- ⏰ **15-minute delayed** quotes
- ✅ **Perfect for testing** and development
- ✅ **Unlimited requests**
- ⚠️ **Not suitable** for live trading

### Production Requirements
- 💰 **$10/month** subscription
- ✅ **Real-time quotes** during market hours
- ✅ **Same API calls** as sandbox
- ✅ **Production-ready** infrastructure
- ✅ **Professional support**

---

## 📞 Help & Support

### Tradier Support
- **Email:** developers@tradier.com
- **Docs:** https://documentation.tradier.com
- **Status:** https://status.tradier.com
- **Response:** Usually within 24 hours

### Common Issues

**"401 Unauthorized"**
```
- Check your API key is correct
- Make sure 'enabled: true'
- Verify sandbox vs production URL
```

**"Too Many Requests"**
```
- Only on free tier (not Tradier)
- Add caching
- Reduce scan frequency
```

**"No data returned"**
```
- Check symbol is valid
- Try a common stock like AAPL
- Check market hours (9:30am-4pm ET)
```

---

## ✅ Quick Checklist

- [ ] Signed up for Tradier account
- [ ] Got Sandbox API key
- [ ] Added key to platform code
- [ ] Tested with AAPL stock quote
- [ ] Tested with AAPL options chain
- [ ] Verified data in Hot Picks tab
- [ ] Tested Scanner with real data
- [ ] All working! 🎉

---

## 🎯 Next Steps After Setup

### Week 1: Test Everything
- Run Hot Picks scan
- Search different tickers
- Test all 43 signals
- Verify Greeks calculations
- Paper trade 10 positions

### Week 2: Optimize
- Add response caching
- Tune refresh rates
- Optimize scanner performance
- Monitor API usage

### Week 3: Deploy
- Consider upgrading to real-time ($10/mo)
- Deploy to GitHub Pages / Netlify
- Share with users
- Get feedback

### Week 4: Scale
- Add more features
- Implement WebSocket streaming
- Add historical backtesting
- Consider adding trading

---

## 💡 Cost Breakdown

### Development Phase (FREE)
```
Month 1: Tradier Sandbox        $0
Month 2: Tradier Sandbox        $0
Month 3: Tradier Sandbox        $0
Total:                          $0
```

### Production Phase
```
Month 1: Tradier Real-Time      $10
Month 2: Tradier Real-Time      $10
Month 3: Tradier Real-Time      $10
Total per year:                 $120
```

**vs. Building your own data infrastructure:** $10,000+  
**vs. Polygon.io:** $588/year  
**vs. Other premium APIs:** $600-$2,400/year

**Tradier = Best Value!** 🏆

---

## 🚀 Ready to Start?

### Right Now:
1. **Open:** https://developer.tradier.com
2. **Sign up:** Create free account (2 min)
3. **Get key:** Copy your Sandbox API key (1 min)
4. **Add to code:** Update `js/realtime-data.js` (1 min)
5. **Test it:** Run AAPL quote test (1 min)
6. **Success!** See real data in your platform 🎉

**Total Time:** 5 minutes  
**Total Cost:** $0 (sandbox)  
**Result:** Real-time capable platform

---

## 📖 Additional Resources

### Documentation
- **API_RECOMMENDATION.md** - Complete API comparison
- **js/realtime-data.js** - Your integration code
- **Tradier Docs** - https://documentation.tradier.com

### Example Code
Your platform already includes:
- Stock quote fetching
- Options chain retrieval
- Greeks calculations
- Error handling
- Fallback system

**Just add your API key and it works!**

---

**Get Started:** https://developer.tradier.com  
**Cost:** FREE (sandbox) or $10/month (real-time)  
**Time:** 5 minutes setup  
**Difficulty:** Easy  
**Support:** Excellent  

---

*Your platform is ready. Just add the API key!* 🔑✨

---

**Guide:** QUICK_API_SETUP.md  
**Date:** January 4, 2026  
**Recommended API:** Tradier  
**Status:** ✅ Ready to Use
