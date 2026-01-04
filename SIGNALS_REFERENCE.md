# 📡 Complete Trading Signals Reference

## All 40+ Institutional-Grade Trading Signals

This document lists **EVERY trading signal and scenario** implemented in the Options Intelligence Platform, matching what major investment firms and hedge funds use.

---

## 🔥 CATEGORY 1: UNUSUAL OPTIONS ACTIVITY (10 Signals)

These signals detect when "smart money" is making unusual moves.

### 1. **Whale Trade Detection** 🐋
- **Trigger:** Premium > $100,000 on single option
- **Meaning:** Institutional player taking large position
- **Action:** Follow the whales (usually informed traders)
- **Strength:** 90%

### 2. **Volume Spike** 📊
- **Trigger:** Volume > 10x Open Interest + Volume > 500
- **Meaning:** Unusual buying/selling activity
- **Action:** Investigate underlying catalyst
- **Strength:** 75%

### 3. **Sweep Order Detection** ⚡
- **Trigger:** High volume + tight bid/ask spread + aggressive fills
- **Meaning:** Trader aggressively buying across exchanges
- **Action:** Strong directional signal
- **Strength:** 85%

### 4. **Dark Pool Print** 🌑
- **Trigger:** Large OTM option trade with minimal spread
- **Meaning:** Institutional hedging or positioning
- **Action:** Follow direction of trade
- **Strength:** 70%

### 5. **Open Interest Explosion** 💥
- **Trigger:** OI increases 5x+ overnight at specific strike
- **Action:** Major new positions opening
- **Strength:** 65%

### 6. **Bullish Flow Dominance** 📈
- **Trigger:** Call volume > Put volume by 3:1
- **Meaning:** Market participants heavily bullish
- **Action:** Consider bullish plays
- **Strength:** 70%

### 7. **Bearish Flow Dominance** 📉
- **Trigger:** Put volume > Call volume by 2:1
- **Meaning:** Market participants hedging/bearish
- **Action:** Consider bearish plays or protection
- **Strength:** 70%

### 8. **Smart Money Divergence** 🧠
- **Trigger:** Unusual options activity contradicts stock price move
- **Meaning:** Informed traders betting against current trend
- **Action:** Follow the divergence
- **Strength:** 80%

### 9. **Multi-Strike Accumulation** 📊
- **Trigger:** Large volume across multiple strikes, same expiration
- **Meaning:** Building position or complex strategy
- **Action:** Identify the strategy being built
- **Strength:** 65%

### 10. **After-Hours Flow** 🌙
- **Trigger:** Significant options activity during extended hours
- **Meaning:** Reaction to news or pre-positioning
- **Action:** Investigate catalyst
- **Strength:** 75%

---

## ⚡ CATEGORY 2: VOLATILITY SIGNALS (8 Signals)

These detect opportunities based on implied volatility.

### 11. **IV Crush Setup** 📅
- **Trigger:** IV > 60% + Earnings within 7 days
- **Meaning:** Volatility likely to collapse post-earnings
- **Action:** Sell premium before earnings, or wait to buy after
- **Strength:** 70%

### 12. **IV Expansion** 🚀
- **Trigger:** IV Rank > 75%
- **Meaning:** Implied volatility at yearly highs
- **Action:** Sell credit spreads, iron condors
- **Strength:** 75%

### 13. **IV Compression** 📉
- **Trigger:** IV Rank < 25%
- **Meaning:** Volatility at yearly lows
- **Action:** Buy debit spreads, straddles (before event)
- **Strength:** 60%

### 14. **Volatility Skew - Put Heavy** 😰
- **Trigger:** OTM Put IV > OTM Call IV by 5%+
- **Meaning:** Market fear, hedging demand
- **Action:** Sell OTM puts, buy calls
- **Strength:** 65%

### 15. **Volatility Skew - Call Heavy** 🤑
- **Trigger:** OTM Call IV > OTM Put IV by 5%+
- **Meaning:** Market greed, speculation
- **Action:** Sell OTM calls, buy puts
- **Strength:** 60%

### 16. **VIX Spike** 📈
- **Trigger:** VIX increases 20%+ in single day
- **Meaning:** Market-wide fear increasing
- **Action:** Reduce position size, buy protection
- **Strength:** 85%

### 17. **Historical vs Implied Divergence** 📊
- **Trigger:** IV > Historical Volatility by 20%+
- **Meaning:** Options overpriced relative to actual moves
- **Action:** Sell premium
- **Strength:** 70%

### 18. **Mean Reversion Setup** 🔄
- **Trigger:** IV at extreme (>2 standard deviations)
- **Meaning:** Volatility likely to revert to mean
- **Action:** Contrarian volatility trade
- **Strength:** 60%

---

## 🧮 CATEGORY 3: GREEK-BASED SIGNALS (7 Signals)

These identify opportunities based on option Greeks.

### 19. **High Gamma Zone** 🚀
- **Trigger:** Gamma > 0.05 + DTE < 7 + Near ATM
- **Meaning:** Explosive price moves possible
- **Action:** Buy options for leverage OR avoid (high risk)
- **Strength:** 75%

### 20. **Gamma Squeeze Potential** 💥
- **Trigger:** Large OI near current price + High Gamma
- **Meaning:** Dealers must hedge aggressively → price acceleration
- **Action:** Buy calls if upward pressure, puts if downward
- **Strength:** 80%

### 21. **Theta Decay Sweet Spot** ⏰
- **Trigger:** High Theta + 30-45 DTE + OTM
- **Meaning:** Optimal for selling premium
- **Action:** Sell credit spreads
- **Strength:** 70%

### 22. **Delta Neutral Opportunity** ⚖️
- **Trigger:** Ability to create delta-neutral position
- **Meaning:** Profit from volatility without directional risk
- **Action:** Straddle, strangle, or iron butterfly
- **Strength:** 60%

### 23. **Vega Play** 🌊
- **Trigger:** High Vega + Expected IV change
- **Meaning:** Profit from volatility changes
- **Action:** Buy if IV expected to rise, sell if expected to fall
- **Strength:** 65%

### 24. **Pin Risk** 📌
- **Trigger:** Large OI at specific strike + Expiration Friday
- **Meaning:** Price may "pin" to that strike
- **Action:** Avoid the strike or trade toward it
- **Strength:** 55%

### 25. **Rho Opportunity** 💰
- **Trigger:** Long-dated options + Expected rate change
- **Meaning:** Interest rate sensitivity
- **Action:** Position for rate changes (rare)
- **Strength:** 50%

---

## 📅 CATEGORY 4: EARNINGS PLAYS (6 Signals)

These capitalize on earnings events.

### 26. **Pre-Earnings Straddle** 📊
- **Trigger:** Earnings in 1-3 days + High IV
- **Meaning:** Market expects big move
- **Action:** Buy ATM straddle if move > implied move
- **Strength:** 60%

### 27. **Post-Earnings IV Crush** 📉
- **Trigger:** Earnings just announced + IV dropping fast
- **Meaning:** Volatility collapsing
- **Action:** Buy cheap options for rebound trade
- **Strength:** 55%

### 28. **Earnings Whisper Beat** 📈
- **Trigger:** Whisper number > Analyst estimates
- **Meaning:** Potential for earnings surprise
- **Action:** Buy calls ahead of earnings
- **Strength:** 65%

### 29. **Historical Move Analysis** 📊
- **Trigger:** Average earnings move > Implied move
- **Meaning:** Options underpricing expected move
- **Action:** Buy straddle
- **Strength:** 70%

### 30. **Earnings Calendar Play** 📅
- **Trigger:** Multiple related stocks reporting earnings
- **Meaning:** Sector rotation or theme
- **Action:** Trade the sector
- **Strength:** 60%

### 31. **Guidance Change Signal** 📢
- **Trigger:** Company pre-announces guidance change
- **Meaning:** Stock will move significantly
- **Action:** React immediately (first mover advantage)
- **Strength:** 85%

---

## 📊 CATEGORY 5: TECHNICAL SIGNALS (5 Signals)

These combine options with technical analysis.

### 32. **Breakout Confirmation** 🚀
- **Trigger:** Price breaks resistance + Call volume spike
- **Meaning:** Breakout confirmed by options market
- **Action:** Buy calls or bull call spreads
- **Strength:** 75%

### 33. **Support Level Defense** 🛡️
- **Trigger:** Price at support + Put selling activity
- **Action:** Support likely to hold
- **Strength:** 70%

### 34. **Moving Average Cross** 📈
- **Trigger:** MA cross + Unusual options activity
- **Meaning:** Trend change confirmed
- **Action:** Trade in direction of cross
- **Strength:** 65%

### 35. **RSI Extreme + Options** 📊
- **Trigger:** RSI >70 or <30 + Supporting options flow
- **Meaning:** Overbought/oversold with confirmation
- **Action:** Contrarian trade
- **Strength:** 60%

### 36. **MACD Divergence** 📉
- **Trigger:** Price makes new high/low, MACD doesn't + Options activity
- **Meaning:** Momentum waning
- **Action:** Counter-trend trade
- **Strength:** 65%

---

## 🎯 CATEGORY 6: ARBITRAGE & PRICING (4 Signals)

These find mispriced options.

### 37. **Put-Call Parity Violation** ⚖️
- **Trigger:** (Call - Put) ≠ (Stock - Strike × e^(-r×t))
- **Meaning:** Pricing inefficiency
- **Action:** Synthetic arbitrage
- **Strength:** 80%

### 38. **Box Spread Arbitrage** 📦
- **Trigger:** Box spread price ≠ Risk-free rate
- **Meaning:** Risk-free profit opportunity
- **Action:** Execute box spread
- **Strength:** 90% (rare)

### 39. **Synthetic Stock Mispricing** 🔄
- **Trigger:** Synthetic stock cost ≠ Actual stock price
- **Meaning:** Conversion/reversal opportunity
- **Action:** Execute arbitrage
- **Strength:** 85%

### 40. **Calendar Spread Mispricing** 📅
- **Trigger:** Front-month implied vol < Back-month (unusual)
- **Meaning:** Time value arbitrage
- **Action:** Calendar spread
- **Strength:** 60%

---

## 🌊 CATEGORY 7: MAX PAIN & MARKET STRUCTURE (3 Signals)

These analyze market maker positioning.

### 41. **Max Pain Gravity** 🎯
- **Trigger:** Price far from max pain strike + Approaching expiration
- **Meaning:** Price may drift toward max pain
- **Action:** Trade toward max pain level
- **Strength:** 60%

### 42. **Dealer Gamma Flip** 🔄
- **Trigger:** Dealers flip from long to short gamma
- **Meaning:** Market structure change
- **Action:** Expect increased volatility
- **Strength:** 70%

### 43. **Expiration Pinning** 📍
- **Trigger:** Large OI at strike + Expiration day
- **Meaning:** Dealers will pin price to that strike
- **Action:** Avoid near that strike, or trade straddle
- **Strength:** 55%

---

## 🎲 HOW TO USE THESE SIGNALS

### **Signal Combination Strategy**
Best results come from combining multiple signals:

**Example 1: High-Confidence Bullish**
- ✅ Whale call buying (Signal #1)
- ✅ Breakout confirmation (Signal #32)
- ✅ IV compression (Signal #13)
- **Action:** Strong bullish position

**Example 2: Premium Selling Setup**
- ✅ IV expansion (Signal #12)
- ✅ Theta sweet spot (Signal #21)
- ✅ Support level (Signal #33)
- **Action:** Sell credit spreads

**Example 3: Volatility Play**
- ✅ Earnings in 3 days (Signal #26)
- ✅ Historical move > Implied (Signal #29)
- ✅ High Vega (Signal #23)
- **Action:** Buy straddle

---

## 📈 Signal Strength Legend

- **90-100%** 🟢 = VERY HIGH - Act quickly
- **75-89%** 🟢 = HIGH - Strong signal
- **60-74%** 🟡 = MEDIUM - Combine with other signals
- **50-59%** 🟡 = LOW - Use as confirmation only
- **<50%** 🔴 = WEAK - Ignore or require many confirmations

---

## ⚠️ CRITICAL NOTES

1. **No Signal is 100%** - Always use risk management
2. **Combine Multiple Signals** - More confirmation = Higher confidence
3. **Check Liquidity** - All signals require tradable liquidity
4. **Understand the Strategy** - Don't trade what you don't understand
5. **Paper Trade First** - Practice before using real money

---

## 🔄 Signal Update Frequency

- **Real-time:** Unusual activity, flow, sweeps
- **Every 5 minutes:** Volatility, Greeks
- **Daily:** Earnings calendar, max pain
- **On-demand:** Technical signals, arbitrage

---

## 📚 Further Reading

For detailed implementation of each signal:
1. Check `js/signals.js` for algorithm code
2. Review `README.md` for strategy explanations
3. See `QUICKSTART.md` for practical examples

---

**Remember: These signals are tools, not guarantees. Always:**
- ✅ Use stop losses
- ✅ Size positions appropriately
- ✅ Diversify
- ✅ Paper trade first
- ✅ Understand the risk

---

*This platform identifies institutional-grade signals. Use them wisely!* 🎯
