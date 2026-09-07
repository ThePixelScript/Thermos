"""Portfolio Optimization Engine: Budget and spatial constraint allocation."""
from typing import List, Dict
from pydantic import BaseModel, Field
from backend.app.schemas.intervention import InterventionEstimate, PlanningConstraints
from backend.app.schemas.common import DataClassification


class PortfolioAllocation(BaseModel):
    """Allocated intervention recommendation within budget limits."""
    zone_id: str
    intervention: InterventionEstimate
    allocated_budget_usd: float
    expected_cooling_c: float


class OptimizationResult(BaseModel):
    """Output of budget portfolio optimization algorithm."""
    status: str = "OPTIMAL_GREEDY_SOLVED"
    total_budget_usd: float
    total_cost_usd: float
    unallocated_budget_usd: float
    portfolio: List[PortfolioAllocation]
    aggregate_cooling_impact_c: float
    classification: DataClassification = Field(default=DataClassification.SIMULATED)


def optimize_cooling_portfolio(
    candidate_estimates_by_zone: Dict[str, List[InterventionEstimate]],
    constraints: PlanningConstraints,
) -> OptimizationResult:
    """Solve multi-zone intervention allocation under budget constraints using greedy heuristic."""
    max_budget = constraints.max_budget_usd or 1_000_000.0
    spent = 0.0
    portfolio: List[PortfolioAllocation] = []

    # Flatten candidates and score by cooling ROI: expected_cooling / cost
    flat_candidates = []
    for zone_id, estimates in candidate_estimates_by_zone.items():
        for est in estimates:
            cost = max(1.0, est.estimated_total_cost_usd)
            roi = (est.expected_local_lst_reduction_c * est.suitability_score) / (cost / 10_000.0)
            flat_candidates.append((roi, zone_id, est))

    # Sort descending by ROI
    flat_candidates.sort(key=lambda x: x[0], reverse=True)

    for roi, zone_id, est in flat_candidates:
        if spent + est.estimated_total_cost_usd <= max_budget:
            spent += est.estimated_total_cost_usd
            portfolio.append(
                PortfolioAllocation(
                    zone_id=zone_id,
                    intervention=est,
                    allocated_budget_usd=est.estimated_total_cost_usd,
                    expected_cooling_c=est.expected_local_lst_reduction_c,
                )
            )

    aggregate_cooling = sum(p.expected_cooling_c for p in portfolio)
    return OptimizationResult(
        total_budget_usd=max_budget,
        total_cost_usd=round(spent, 2),
        unallocated_budget_usd=round(max_budget - spent, 2),
        portfolio=portfolio,
        aggregate_cooling_impact_c=round(aggregate_cooling, 2),
        classification=DataClassification.SIMULATED,
    )
