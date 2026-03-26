from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from dependencies import get_db
from dependencies import get_current_user
from models.user import User
from schemas.portfolio import (
    SummaryResponse, PerformanceResponse, RiskResponse,
    CorrelationResponse, SectorsResponse, RollingResponse
)
from services.portfolio_engine import PortfolioEngine
from services.report_service import generate_csv_report

router = APIRouter()
engine = PortfolioEngine()

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await engine.compute_summary(db, current_user.id)

@router.get("/performance", response_model=PerformanceResponse)
async def get_performance(
    from_date: date = Query(default_factory=lambda: date.today() - timedelta(days=90)),
    to_date: date = Query(default_factory=date.today),
    interval: str = Query("daily"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await engine.compute_performance(db, current_user.id, from_date, to_date)

@router.get("/risk", response_model=RiskResponse)
async def get_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await engine.compute_risk(db, current_user.id)

@router.get("/correlation", response_model=CorrelationResponse)
async def get_correlation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await engine.compute_correlation(db, current_user.id)

@router.get("/sectors", response_model=SectorsResponse)
async def get_sectors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await engine.compute_sectors(db, current_user.id)

@router.get("/rolling", response_model=RollingResponse)
async def get_rolling(
    window: int = Query(30, ge=5, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await engine.compute_rolling(db, current_user.id, window)

@router.get("/heatmap")
async def get_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await engine.compute_heatmap(db, current_user.id)
    # Rename 'return' key to avoid JSON issues
    for item in result.get("data", []):
        if "return" in item:
            item["return_val"] = item.pop("return")
    return result

@router.get("/report")
async def get_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csv_data = await generate_csv_report(db, current_user.id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=portfolio_report.csv"}
    )
