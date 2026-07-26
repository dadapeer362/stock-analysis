# Stock Analysis Dashboard - Indian NSE Stocks

Personal stock analysis dashboard for **Indian NSE (National Stock Exchange)** stocks with real-time data, technical indicators, fundamental analysis, and AI-powered insights.

## Features

- 🇮🇳 **Indian NSE stocks**: Search by company name or symbol - live autocomplete
- 🔍 **Smart search**: Type "Reliance", "HDFC Bank", "Ather Energy" - finds any NSE stock dynamically
- � **Indian Rupee (₹) display**: All prices shown in INR with Indian number formatting
- �📈 Real-time stock price data (via Yahoo Finance - no API key needed!)
- 📊 **Comprehensive technical analysis**: RSI, MACD, Bollinger Bands, Moving Averages, Support/Resistance
- 💼 **Detailed fundamental analysis**:
  - **Valuation Ratios**: P/E, P/B, PEG, Book Value
  - **Profitability**: EPS, ROE, Market Cap
  - **Financial Health**: Debt-to-Equity, Beta, Face Value
  - **Dividends**: Yield, Dividend Rate
  - **Performance**: 52-week High/Low, Quarterly & Yearly Growth
- 🤖 **AI-powered insights** (via Groq LLM):
  - Buy/Sell/Hold recommendations with confidence scores
  - **Industry insights**: Sector classification, industry PE ranges, typical ROE
  - **Competitor identification**: AI identifies top 3-5 competitors automatically
  - **Competitor comparison**: Strengths, weaknesses, and relative pricing vs peers
  - **Industry trends**: Current market trends in the sector
- 📰 Latest news and analyst ratings
- 🎯 Support & resistance levels
- 📉 Interactive 90-day price charts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **APIs**: yfinance, Alpha Vantage, Finnhub, Groq

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Initialize database:
```bash
npm run db:push
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## API Keys (Free)

- **Groq**: https://console.groq.com/keys
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
- **Finnhub**: https://finnhub.io/register

## Default Login

Username: `admin` (set in .env)
Password: `your-password` (set in .env)

## Supported Indian NSE Stocks

**Popular Stocks - Just type the symbol:**

**Banking & Finance**
- HDFC, ICICI, SBIN (State Bank), AXISBANK, KOTAKBANK, HDFCLIFE, BAJFINANCE

**IT Services**
- TCS, INFY (Infosys), WIPRO, HCLTECH, TECHM (Tech Mahindra), LTI

**Energy & Resources**
- RELIANCE, ONGC, NTPC, POWERGRID, COALINDIA, ADANIGREEN

**Automotive**
- TATAMOTORS, MARUTI, M&M (Mahindra), BAJAJ-AUTO, EICHERMOT, HEROMOTOCO

**Pharmaceuticals**
- SUNPHARMA, DRREDDY, CIPLA, DIVISLAB, BIOCON

**Consumer Goods**
- ITC, HINDUNILVR, BRITANNIA, NESTLEIND, DABUR, MARICO

**Infrastructure & Industrials**
- TATASTEEL, HINDALCO, JSWSTEEL, ULTRACEMCO, BHARTIARTL

**How it works:**
- Type `HDFC` → Auto-resolves to `HDFCBANK.NS`
- Type `RELIANCE` → Auto-resolves to `RELIANCE.NS`
- Type `TCS` → Auto-resolves to `TCS.NS`

No need to add `.NS` suffix - it's automatic!

📖 **See [NSE-STOCKS.md](NSE-STOCKS.md) for a comprehensive list of supported stocks**
