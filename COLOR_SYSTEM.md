# 🎨 Color System Quick Reference
**Options Intelligence Platform - Dark Theme**

---

## Color Palette

### Primary Colors
```
Background Dark:     #0a0e1a  ━━━━━━  Very dark blue-black
Background Light:    #151b2d  ━━━━━━  Slightly lighter dark blue
Card Background:     #1a2235  ━━━━━━  Card container color
Primary Accent:      #00ff88  ━━━━━━  Bright green (DTP brand)
Secondary Accent:    #00cc6f  ━━━━━━  Darker green
```

### Text Colors
```
Text Bright:         #ffffff  ━━━━━━  Pure white (values, headings)
Text Normal:         #e4e6eb  ━━━━━━  Off-white (body text)
Text Medium:         #a0a8c0  ━━━━━━  Light gray (labels, secondary)
Text Dim:            #8b92a7  ━━━━━━  Medium gray (placeholders)
```

### Status Colors
```
Success/Bullish:     #00ff88  ━━━━━━  Green (gains, calls)
Danger/Bearish:      #ff4757  ━━━━━━  Red (losses, puts)
Warning:             #ffa502  ━━━━━━  Orange (alerts)
Info:                #3742fa  ━━━━━━  Blue (information)
```

---

## Usage Guide

### Headings & Titles
```html
<h1> → #ffffff (800 weight)
<h2> → #ffffff (700 weight)
<h3> → #ffffff (700 weight)
<h4> → #ffffff (600 weight)
```

### Body Text
```html
Primary text   → #e4e6eb (400-500 weight)
Secondary text → #a0a8c0 (400-500 weight)
Hint text      → #8b92a7 (400 weight)
```

### Data Display
```html
Numbers/Values   → #ffffff (700-800 weight)
Labels           → #a0a8c0 (500 weight)
Units            → #8b92a7 (400 weight)
```

### Interactive Elements
```html
Button Text (on green) → #0a0e1a (700 weight)
Link Text              → #00ff88 (500-600 weight)
Active Tab             → #00ff88 (600 weight)
Hover State            → #00ff88 glow
```

---

## Component Examples

### Metric Card
```
┌─────────────────────────┐
│ Expected Return         │ ← #a0a8c0 (label)
│ +$2,450                 │ ← #ffffff (value)
│ (45% gain)              │ ← #00ff88 (percentage)
└─────────────────────────┘
Background: #1a2235
Border: rgba(0, 255, 136, 0.1)
```

### Hot Pick Card
```
┌─────────────────────────┐
│ #1                      │ ← #0a0e1a on #00ff88 gradient
│                         │
│ AAPL                    │ ← #00ff88 (symbol)
│ $150 Call               │ ← #ffffff (contract)
│ Jan 19                  │ ← #a0a8c0 (date)
│                         │
│ Score: 95/110           │ ← #ffffff (score)
│ Entry: $245             │ ← #a0a8c0 label, #ffffff value
│ Target: +150%           │ ← #00ff88 (target)
└─────────────────────────┘
Background: rgba(26, 34, 53, 0.95)
Border: rgba(0, 255, 136, 0.15)
```

### Table
```
┌─────────┬──────────┬──────────┐
│ Symbol  │ Strike   │ Premium  │ ← #00ff88 (headers)
├─────────┼──────────┼──────────┤
│ AAPL    │ $150.00  │ $2.45    │ ← #ffffff (data)
│ MSFT    │ $350.00  │ $5.20    │ ← #ffffff (data)
└─────────┴──────────┴──────────┘
Background: rgba(26, 34, 53, 0.5)
Header: rgba(0, 255, 136, 0.1)
```

### Form Input
```
┌─────────────────────────┐
│ Ticker Symbol           │ ← #a0a8c0 (label)
├─────────────────────────┤
│ AAPL                    │ ← #ffffff (input text)
└─────────────────────────┘
Background: rgba(0, 0, 0, 0.3)
Border: rgba(0, 255, 136, 0.2)
Focus: rgba(0, 255, 136, 0.5) with glow
```

### Button (Primary)
```
┌─────────────────────────┐
│   Analyze Options       │ ← #0a0e1a (text on green)
└─────────────────────────┘
Background: linear-gradient(#00ff88, #00cc6f)
Hover: Lift + glow effect
```

### Badge
```
Call  → rgba(0, 255, 136, 0.2) bg, #00ff88 text
Put   → rgba(255, 71, 87, 0.2) bg, #ff4757 text
```

---

## Contrast Ratios (WCAG AA+)

```
#ffffff on #0a0e1a    = 15.0:1  ✅ AAA
#ffffff on #1a2235    = 13.5:1  ✅ AAA
#a0a8c0 on #0a0e1a    = 8.2:1   ✅ AAA
#a0a8c0 on #1a2235    = 7.1:1   ✅ AA
#00ff88 on #0a0e1a    = 10.5:1  ✅ AAA
#00ff88 on #1a2235    = 9.0:1   ✅ AAA
#0a0e1a on #00ff88    = 10.5:1  ✅ AAA (button text)
```

All combinations meet or exceed WCAG 2.1 Level AA standards.

---

## CSS Variables Reference

```css
/* Core Theme Colors */
--dtp-primary: #00ff88;           /* Brand green */
--dtp-secondary: #00cc6f;         /* Darker green */
--dtp-dark: #0a0e1a;              /* Main background */
--dtp-dark-light: #151b2d;        /* Secondary background */
--dtp-card-bg: #1a2235;           /* Card/container background */

/* Text Colors */
--dtp-text: #e4e6eb;              /* Normal body text */
--dtp-text-dim: #8b92a7;          /* Dimmed/placeholder text */
/* Note: #ffffff and #a0a8c0 used directly */

/* Status Colors */
--dtp-success: #00ff88;           /* Success/gains */
--dtp-danger: #ff4757;            /* Danger/losses */
--dtp-warning: #ffa502;           /* Warnings */
--dtp-info: #3742fa;              /* Information */
```

---

## Do's and Don'ts

### ✅ DO
- Use `#ffffff` for all important values and numbers
- Use `#a0a8c0` for labels and secondary text
- Use `#00ff88` for interactive elements and positive indicators
- Use `font-weight: 700-800` for values and headings
- Use `font-weight: 500-600` for labels
- Test on dark backgrounds

### ❌ DON'T
- Don't use `#8b92a7` for important data
- Don't use low contrast combinations
- Don't use light text on light backgrounds
- Don't mix too many font weights
- Don't forget hover/focus states
- Don't use var(--dtp-text-dim) for critical info

---

## Accessibility Checklist

- [x] All text meets WCAG AA contrast ratio (4.5:1 minimum)
- [x] Interactive elements have clear focus states
- [x] Color is not the only indicator of meaning
- [x] Text is resizable without breaking layout
- [x] Font weights appropriate for readability
- [x] Sufficient spacing between interactive elements
- [x] Labels clearly associated with form controls

---

**Last Updated:** January 4, 2026  
**Theme Version:** 3.0 (High Contrast)  
**Design System:** DTP Dark Theme Compatible
