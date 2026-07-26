# Quick Setup Guide

## ✅ Project Created Successfully!

Your stock analysis dashboard is ready. Follow these steps to get started:

## 1. Get API Keys (All FREE!)

### Required: Groq API Key (LLM Analysis)
1. Go to: https://console.groq.com/keys
2. Sign up/login (free)
3. Create a new API key
4. Copy the key

### Optional but Recommended: Finnhub API Key (Better Fundamentals)
1. Go to: https://finnhub.io/register
2. Sign up (free tier: 60 calls/min)
3. Copy your API key from the dashboard

## 2. Configure Environment Variables

Edit the `.env` file in the project root:

```env
# Change these credentials!
ADMIN_USERNAME="your-username"
ADMIN_PASSWORD="your-secure-password"

# Add your Groq API key (required for AI analysis)
GROQ_API_KEY="your-groq-api-key-here"

# Optional: Add Finnhub key for better fundamentals
FINNHUB_API_KEY="your-finnhub-key-here"

# Generate a secure secret (run: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret-here"
```

### Generate NEXTAUTH_SECRET:
```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or use online tool: https://generate-secret.vercel.app/32
```

## 3. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser

## 4. Login

Use the credentials you set in `.env`:
- Username: (from ADMIN_USERNAME)
- Password: (from ADMIN_PASSWORD)

## 5. Start Analyzing!

The dashboard supports **all NSE (National Stock Exchange)** stocks with **intelligent live search**!

### 🔍 How to Search:

**Just start typing** - the search bar shows live suggestions as you type!

**Search by company name:**
- Type "Reliance" → See Reliance Industries
- Type "HDFC" → See HDFC Bank, HDFC Life, etc.
- Type "Tata" → See all Tata companies (TCS, Tata Motors, Tata Steel, etc.)
- Type "Ather" → See Ather Energy (if listed)
- Type "Adani" → See all Adani companies

**Or search by ticker symbol:**
- RELIANCE, TCS, HDFCBANK, INFY, WIPRO, etc.

**The system automatically:**
- Searches across all 1000+ NSE stocks
- Shows matching companies as you type
- Provides suggestions if exact match not found
- No need to remember exact symbols!

### Popular Examples:

**Popular NSE Stocks:**

**💰 Banking & Finance**
- HDFC → HDFC Bank
- ICICI → ICICI Bank
- SBIN → State Bank of India
- AXISBANK, KOTAKBANK, HDFCLIFE, BAJFINANCE

**💻 IT Services**
- TCS → Tata Consultancy Services
- INFY → Infosys
- WIPRO, HCLTECH, TECHM, LTI

**⚡ Energy & Resources**
- RELIANCE → Reliance Industries
- ONGC, NTPC, POWERGRID, COALINDIA, ADANIGREEN

**🚗 Automotive**
- TATAMOTORS, MARUTI, M&M, BAJAJ-AUTO, EICHERMOT

**💊 Pharmaceuticals**
- SUNPHARMA, DRREDDY, CIPLA, DIVISLAB, BIOCON

**🛒 Consumer Goods**
- ITC, HINDUNILVR, BRITANNIA, NESTLEIND

**🏗️ Infrastructure**
- TATASTEEL, HINDALCO, JSWSTEEL, ULTRACEMCO, BHARTIARTL

### How it works:
The system automatically adds `.NS` suffix and handles bank name variations:
- Type `HDFC` → Finds `HDFCBANK.NS`
- Type `RELIANCE` → Finds `RELIANCE.NS`
- Type `TCS` → Finds `TCS.NS`

If you know the exact NSE symbol, you can also use it with `.NS`:
- `HDFCBANK.NS`
- `RELIANCE.NS`
- `TCS.NS`

## Features Available:

✅ Real-time NSE stock prices in Indian Rupees (₹) with Indian number formatting
✅ Live autocomplete search - find any NSE stock by company name
✅ **Comprehensive Fundamental Analysis:**
   - Valuation Ratios: P/E, P/B, PEG, Book Value
   - Profitability: EPS, ROE (Return on Equity), Market Cap
   - Financial Health: Debt-to-Equity, Beta, Face Value
   - Dividends: Yield %, Dividend Rate
   - 52-Week High/Low tracking
   - Quarterly & Yearly Growth metrics
✅ **AI-Powered Intelligence (via Groq LLM):**
   - Buy/Sell/Hold recommendations with reasoning
   - Industry insights: Sector, Industry PE, typical ROE
   - Competitor identification: Automatically finds top competitors
   - Competitor comparison: Strengths, weaknesses, relative pricing
   - Industry trends and market context
   - Face value estimation based on industry standards
✅ Technical indicators (RSI, MACD, Moving Averages, Bollinger Bands)
✅ Support & Resistance levels
✅ Interactive 90-day price charts
✅ Entry points, target prices, stop loss suggestions
✅ Latest news (with Finnhub key)

## Troubleshooting:

### "AI analysis unavailable"
- Check that GROQ_API_KEY is set in .env
- Verify the API key is valid at https://console.groq.com/keys

### "Fundamentals not available"
- Add FINNHUB_API_KEY to .env
- Some stocks may not have complete fundamental data

### Login not working
- Make sure ADMIN_USERNAME and ADMIN_PASSWORD are set in .env
- Check NEXTAUTH_SECRET is generated and set

### Stock not found
- The auto-detection tries common NSE symbol variations automatically
- For banks, try the full name: HDFCBANK, ICICIBANK, AXISBANK
- Verify the symbol on NSE India: https://www.nseindia.com/
- Or check Yahoo Finance with .NS suffix: https://finance.yahoo.com/quote/RELIANCE.NS
- If still not found, try with explicit .NS suffix (e.g., HDFCBANK.NS)

## Next Steps:

- Add watchlist feature
- Add stock comparison
- Add portfolio tracking
- Add alerts for price targets
- Deploy to Vercel (free!)

## Deployment to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Remember to add environment variables in Vercel dashboard!

---

**Need help?** Check the README.md or create an issue.

Enjoy your stock analysis dashboard! 📈
