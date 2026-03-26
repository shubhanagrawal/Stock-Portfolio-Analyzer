# 🚀 Stock Portfolio Analyzer

### Full-Stack Financial Analytics Platform (Performance • Risk • Benchmarking)

---

## 📌 Overview

Most retail investors track their portfolios but **don’t understand performance, risk, or whether they’re beating the market**.

This project solves that.

**Stock Portfolio Analyzer** is a full-stack web application that:

* Tracks user investments using transaction-level data
* Computes **real financial metrics (not just charts)**
* Benchmarks performance against market indices (NIFTY 50)
* Provides actionable insights into **risk and portfolio health**

---

## 🎯 Why This Project Stands Out

Unlike typical CRUD-based student projects, this system implements:

* 📊 **Quantitative Finance Metrics**

  * Sharpe Ratio
  * Volatility (Standard Deviation)
  * Maximum Drawdown

* 📈 **Benchmarking Engine**

  * Compare portfolio vs NIFTY 50
  * Alpha generation (outperformance analysis)

* 🧠 **Time-Series Analysis**

  * Portfolio value tracking over time
  * Daily returns computation

* ⚙️ **Real Market Data Integration**

  * Live + historical stock prices via APIs

👉 This is closer to a **mini Bloomberg terminal for retail investors** than a basic web app.

---

## 🏗️ System Architecture

Frontend (React) → Backend API (FastAPI / Node.js) → PostgreSQL → External Market APIs

---

## 🔥 Features

### 🧾 Portfolio Management

* Add/edit/delete transactions
* Supports multiple stocks
* Historical tracking (not just current holdings)

---

### 📊 Performance Analytics

* Total Investment
* Current Portfolio Value
* Profit/Loss
* Return (%)
* Cumulative Returns

---

### 📉 Risk Metrics

* Volatility
* Sharpe Ratio
* Maximum Drawdown

---

### 📈 Benchmark Comparison

* Compare with NIFTY 50
* Performance vs market
* Alpha calculation

---

### 📊 Interactive Dashboard

* Portfolio value over time
* Asset allocation (pie chart)
* Stock-wise contribution
* Drawdown visualization

---

### ⚠️ Risk Insights

* Concentration analysis
* Volatility alerts
* Portfolio health indicators

---

## 🧠 Key Concepts Implemented

* Prefix-sum style time series aggregation
* Statistical modeling of returns
* Risk-adjusted performance evaluation
* Financial data normalization

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Chart.js / Recharts

### Backend

* FastAPI (Python) / Node.js (Express)

### Database

* PostgreSQL

### Data Sources

* Yahoo Finance API (`yfinance`)

---

## ⚙️ Core Algorithms

### 📌 Portfolio Return

```python
return ((current_value - invested_value) / invested_value) * 100
```

### 📌 Sharpe Ratio

```python
(np.mean(returns - risk_free_rate) / np.std(returns))
```

### 📌 Max Drawdown

```python
max((peak - value) / peak)
```

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/your-username/portfolio-analyzer.git
cd portfolio-analyzer
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
portfolio-analyzer/
│
├── frontend/
├── backend/
├── database/
└── README.md
```

---

## 📊 Sample Use Case

1. User logs in
2. Adds stock transactions
3. System fetches historical data
4. Computes:

   * Returns
   * Risk metrics
   * Benchmark comparison
5. Displays insights via dashboard

---

## 📌 Future Enhancements

* 📈 Strategy Backtesting (Moving Average, RSI)
* 🤖 ML-based Price Forecasting
* 📊 Portfolio Optimization (Modern Portfolio Theory)
* 🔔 Smart Alerts & Notifications

---

## 🧠 What I Learned

* Real-world financial data handling
* Designing scalable backend APIs
* Implementing quantitative finance models
* Bridging **data science + full-stack engineering**

---

## 📬 Contact

If you're a recruiter or collaborator interested in this project:

* GitHub: https://github.com/your-username
* LinkedIn: https://linkedin.com/in/your-profile

---

## ⭐ If you found this useful, consider starring the repo!
