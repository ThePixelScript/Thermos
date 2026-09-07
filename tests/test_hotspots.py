"""Tests for hotspot detection, ranking, and detailed dossiers."""
from backend.app.data.repository import repository


def test_hotspot_ranking_order():
    hotspots = repository.list_hotspots(min_risk_score=0.0)
    assert len(hotspots) >= 5

    # Check rank numbers are 1, 2, 3...
    ranks = [h.rank for h in hotspots]
    assert ranks == list(range(1, len(hotspots) + 1))

    # Check risk scores are strictly descending or equal
    scores = [h.risk_score for h in hotspots]
    assert scores == sorted(scores, reverse=True)


def test_hotspot_filter_by_score():
    all_hotspots = repository.list_hotspots(min_risk_score=0.0)
    filtered = repository.list_hotspots(min_risk_score=60.0)
    assert len(filtered) <= len(all_hotspots)
    for h in filtered:
        assert h.risk_score >= 60.0


def test_hotspot_dominant_driver_reported():
    hotspots = repository.list_hotspots(min_risk_score=50.0)
    assert len(hotspots) > 0
    top_hotspot = hotspots[0]
    assert top_hotspot.dominant_driver != ""
    assert top_hotspot.dominant_driver_pct > 0.0
    assert len(top_hotspot.center_coords) == 2


def test_hotspot_detail_compilation():
    hotspots = repository.list_hotspots(min_risk_score=50.0)
    target_id = hotspots[0].zone_id

    detail = repository.get_hotspot_detail(target_id)
    assert detail is not None
    assert detail.zone.id == target_id
    assert detail.risk_assessment.risk_score.score == hotspots[0].risk_score
    assert len(detail.recommended_interventions) > 0
    assert detail.ai_executive_brief is not None
    assert len(detail.ai_executive_brief) > 20
