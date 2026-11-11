
"""
Risk Scorer — Combines ML, threat intelligence, and rule-based signals.
"""

WEIGHT_ML = 0.50
WEIGHT_THREAT_INTEL = 0.35
WEIGHT_RULES = 0.15


def compute_risk_score(
    ml_score: float,
    threat_intel_results: list,
    signal_count: int,
    max_signals: int = 8
) -> dict:
    """Calculate a weighted risk score between 0.0 and 1.0."""

    # Keep ML scores within the valid range.
    ml_score = max(0.0, min(float(ml_score), 1.0))
    ml_component = ml_score * WEIGHT_ML

    # Threat-intelligence contribution.
    threat_flagged = any(
        result.get("flagged", False)
        for result in threat_intel_results
    )
    threat_component = (
        WEIGHT_THREAT_INTEL if threat_flagged else 0.0
    )

    # Count only rule-based signals when calling this function.
    max_signals = max(int(max_signals), 1)
    signal_count = max(int(signal_count), 0)
    rule_score = min(signal_count / max_signals, 1.0)
    rule_component = rule_score * WEIGHT_RULES

    # A confirmed threat receives a phishing verdict.
    final_score = min(
        ml_component + threat_component + rule_component, 1.0
    )
    final_score = round(final_score, 4)

    verdict, confidence, explanation = _get_verdict(
        final_score, threat_flagged
    )

    return {
        "risk_score": final_score,
        "verdict": verdict,
        "confidence": confidence,
        "threat_intel_flagged": threat_flagged,
        "explanation": explanation,
        "score_breakdown": {
            "ml_contribution": round(ml_component, 3),
            "threat_intel_contribution": round(threat_component, 3),
            "rules_contribution": round(rule_component, 3),
        },
    }


def _get_verdict(score: float, threat_flagged: bool) -> tuple:
    """Convert risk score into a verdict."""

    if threat_flagged:
        return (
            "phishing",
            "high",
            "This URL was flagged by a threat-intelligence source. "
            "Do not proceed without further investigation.",
        )

    if score >= 0.60:
        return (
            "phishing",
            "high" if score >= 0.80 else "medium",
            "This URL has a high estimated phishing risk.",
        )

    if score >= 0.30:
        return (
            "suspicious",
            "medium",
            "This URL looks suspicious. Verify the source carefully.",
        )

    return (
        "safe",
        "high" if score <= 0.10 else "medium",
        "No major threats were detected by the available checks. "
        "This does not guarantee that the URL is safe.",
    )
