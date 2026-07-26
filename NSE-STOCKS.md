# 🇮🇳 Indian NSE Stock Symbols

This dashboard is configured for **NSE (National Stock Exchange of India)** stocks only.

## How It Works

Just type the stock name or symbol - the system automatically:
1. Adds `.NS` suffix for NSE
2. Handles common variations (e.g., HDFC → HDFCBANK)
3. Tries alternative formats if needed

**No need to type .NS suffix!**

---

## Popular NSE Stocks

### 💰 Banking & Finance

| Symbol | Company Name |
|--------|-------------|
| HDFC or HDFCBANK | HDFC Bank |
| ICICI or ICICIBANK | ICICI Bank |
| SBIN | State Bank of India |
| AXISBANK | Axis Bank |
| KOTAKBANK | Kotak Mahindra Bank |
| INDUSINDBK | IndusInd Bank |
| BAJFINANCE | Bajaj Finance |
| HDFCLIFE | HDFC Life Insurance |
| SBILIFE | SBI Life Insurance |
| ICICIGI | ICICI Lombard General Insurance |

### 💻 IT Services

| Symbol | Company Name |
|--------|-------------|
| TCS | Tata Consultancy Services |
| INFY | Infosys |
| WIPRO | Wipro |
| HCLTECH | HCL Technologies |
| TECHM | Tech Mahindra |
| LTI | Larsen & Toubro Infotech |
| MINDTREE | Mindtree |
| MPHASIS | Mphasis |
| PERSISTENT | Persistent Systems |

### ⚡ Energy & Resources

| Symbol | Company Name |
|--------|-------------|
| RELIANCE | Reliance Industries |
| ONGC | Oil and Natural Gas Corporation |
| NTPC | NTPC Limited |
| POWERGRID | Power Grid Corporation |
| COALINDIA | Coal India |
| IOC | Indian Oil Corporation |
| BPCL | Bharat Petroleum |
| ADANIGREEN | Adani Green Energy |
| ADANIPORTS | Adani Ports |
| ADANIENT | Adani Enterprises |

### 🚗 Automotive

| Symbol | Company Name |
|--------|-------------|
| TATAMOTORS | Tata Motors |
| MARUTI | Maruti Suzuki |
| M&M | Mahindra & Mahindra |
| BAJAJ-AUTO | Bajaj Auto |
| EICHERMOT | Eicher Motors |
| HEROMOTOCO | Hero MotoCorp |
| TVS | TVS Motor Company |
| ASHOKLEY | Ashok Leyland |
| BOSCHLTD | Bosch India |

### 💊 Pharmaceuticals

| Symbol | Company Name |
|--------|-------------|
| SUNPHARMA | Sun Pharmaceutical |
| DRREDDY | Dr. Reddy's Laboratories |
| CIPLA | Cipla |
| DIVISLAB | Divi's Laboratories |
| BIOCON | Biocon |
| AUROPHARMA | Aurobindo Pharma |
| LUPIN | Lupin |
| TORNTPHARM | Torrent Pharmaceuticals |
| ALKEM | Alkem Laboratories |

### 🛒 Consumer Goods (FMCG)

| Symbol | Company Name |
|--------|-------------|
| ITC | ITC Limited |
| HINDUNILVR | Hindustan Unilever |
| BRITANNIA | Britannia Industries |
| NESTLEIND | Nestlé India |
| DABUR | Dabur India |
| MARICO | Marico |
| GODREJCP | Godrej Consumer Products |
| COLPAL | Colgate-Palmolive India |
| PGHH | Procter & Gamble Hygiene |

### 🏗️ Infrastructure & Industrials

| Symbol | Company Name |
|--------|-------------|
| TATASTEEL | Tata Steel |
| HINDALCO | Hindalco Industries |
| JSWSTEEL | JSW Steel |
| ULTRACEMCO | UltraTech Cement |
| LT | Larsen & Toubro |
| BHARTIARTL | Bharti Airtel |
| GRASIM | Grasim Industries |
| VEDL | Vedanta |
| HINDZINC | Hindustan Zinc |

### 🏦 Conglomerates

| Symbol | Company Name |
|--------|-------------|
| TATAMOTORS | Tata Motors (Part of Tata Group) |
| TCS | TCS (Part of Tata Group) |
| RELIANCE | Reliance Industries |
| ITC | ITC Limited |
| LT | Larsen & Toubro |
| ADANIENT | Adani Enterprises |
| VEDL | Vedanta |

---

## Common Symbol Patterns

### Banks
Most bank names need `BANK` suffix:
- HDFC → **HDFCBANK.NS**
- ICICI → **ICICIBANK.NS**
- AXIS → **AXISBANK.NS**
- KOTAK → **KOTAKBANK.NS**

Exception: `SBIN` (State Bank of India) doesn't need BANK suffix

### Company Abbreviations
- M&M = Mahindra & Mahindra
- LT = Larsen & Toubro
- INFY = Infosys
- TECHM = Tech Mahindra

---

## Nifty 50 Index Components

All Nifty 50 stocks are supported. Popular ones include:

**Top 10 by Market Cap (approx):**
1. RELIANCE - Reliance Industries
2. TCS - Tata Consultancy Services
3. HDFCBANK - HDFC Bank
4. INFY - Infosys
5. ICICIBANK - ICICI Bank
6. HINDUNILVR - Hindustan Unilever
7. KOTAKBANK - Kotak Mahindra Bank
8. BHARTIARTL - Bharti Airtel
9. ITC - ITC Limited
10. SBIN - State Bank of India

---

## Usage Tips

### ✅ Do This
- Type: `RELIANCE` → System finds `RELIANCE.NS`
- Type: `HDFC` → System finds `HDFCBANK.NS`
- Type: `TCS` → System finds `TCS.NS`

### ❌ Avoid
- Adding `.NS` manually (system does it automatically)
- Using BSE symbols (this dashboard is NSE-only)
- Using incorrect abbreviations

---

## Verifying Symbols

**NSE India Official Site:**
https://www.nseindia.com/

**Yahoo Finance (with .NS):**
https://finance.yahoo.com/quote/RELIANCE.NS

**Moneycontrol:**
https://www.moneycontrol.com/

---

## Not Finding Your Stock?

1. **Check the exact NSE symbol** on NSE India website
2. **Try the full company name** (e.g., HDFCBANK instead of HDFC)
3. **Add .NS manually** if auto-detection fails
4. **Ensure it's listed on NSE** (not BSE-only)

---

**Note:** This dashboard uses Yahoo Finance API which requires the `.NS` suffix for NSE stocks. The auto-detection feature handles this for you!
