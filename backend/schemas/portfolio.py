from pydantic import BaseModel
from typing import List, Optional

class HoldingOut(BaseModel):
    ticker: str
    quantity: float
    avg_buy_price: float
    current_price: float
    value: float
    return_pct: float

class SummaryResponse(BaseModel):
    total_invested: float
    current_value: float
    profit_loss: float
    return_pct: float
    holdings: List[HoldingOut]

class DailyPerformance(BaseModel):
    date: str
    value: float
    daily_return: Optional[float]
    cumulative_return: Optional[float]
    drawdown: Optional[float] = None

class PerformanceResponse(BaseModel):
    portfolio: List[DailyPerformance]
    benchmark: List[DailyPerformance]
    alpha: Optional[float]
    correlation: Optional[float]

class DrawdownPeriod(BaseModel):
    start: Optional[str]
    end: Optional[str]

class ConcentrationItem(BaseModel):
    ticker: str
    weight_pct: float

class AlertItem(BaseModel):
    type: str
    message: str
    severity: str

class RiskResponse(BaseModel):
    sharpe_ratio: Optional[float]
    sortino_ratio: Optional[float]
    beta: Optional[float]
    var_95: Optional[float]
    volatility_annual: Optional[float]
    max_drawdown: Optional[float]
    max_drawdown_period: DrawdownPeriod
    concentration: List[ConcentrationItem]
    alerts: List[AlertItem]

# ── New response models ──────────────────────────────────────────────────

class CorrelationResponse(BaseModel):
    tickers: List[str]
    matrix: List[List[float]]

class SectorItem(BaseModel):
    sector: str
    value: float
    weight_pct: float

class SectorsResponse(BaseModel):
    sectors: List[SectorItem]

class RollingResponse(BaseModel):
    dates: List[str]
    rolling_volatility: List[float]
    rolling_sharpe: List[float]

class HeatmapPoint(BaseModel):
    date: str
    return_val: float  # renamed from 'return' (reserved word)
    month: str
    day: int
    weekday: int

class HeatmapResponse(BaseModel):
    data: List[HeatmapPoint]
