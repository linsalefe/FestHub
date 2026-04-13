from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.fixed_cost import FixedCost
from app.models.tenant_settings import TenantSettings


def calculate_budget(budget: Budget, db: Session) -> dict:
    settings = db.query(TenantSettings).filter(TenantSettings.tenant_id == budget.tenant_id).first()
    if not settings:
        tax_rate = Decimal("6")
        events_per_month = 8
    else:
        tax_rate = Decimal(str(settings.tax_rate))
        events_per_month = settings.events_per_month or 8

    fixed_costs = db.query(FixedCost).filter(FixedCost.tenant_id == budget.tenant_id).all()
    total_fixed = sum(Decimal(str(fc.value)) for fc in fixed_costs)
    fixed_cost_per_event = total_fixed / Decimal(str(events_per_month)) if events_per_month > 0 else Decimal("0")

    items_total = sum(Decimal(str(item.price)) * Decimal(str(item.quantity)) for item in budget.items)
    items_cost = sum(Decimal(str(item.cost)) * Decimal(str(item.quantity)) for item in budget.items)
    variable_total = sum(Decimal(str(vc.value)) for vc in budget.variable_costs)

    total_cost = items_cost + variable_total + fixed_cost_per_event

    subtotal = items_total
    discount = Decimal(str(budget.discount or 0))
    tax_value = subtotal * (tax_rate / Decimal("100"))
    total = subtotal + tax_value - discount

    profit = total - total_cost - tax_value
    margin_real = (profit / total * Decimal("100")) if total > 0 else Decimal("0")

    return {
        "items_total": float(items_total),
        "items_cost": float(items_cost),
        "variable_total": float(variable_total),
        "fixed_cost_per_event": float(round(fixed_cost_per_event, 2)),
        "total_fixed_costs": float(total_fixed),
        "total_cost": float(round(total_cost, 2)),
        "subtotal": float(subtotal),
        "tax_rate": float(tax_rate),
        "tax_value": float(round(tax_value, 2)),
        "discount": float(discount),
        "total": float(round(total, 2)),
        "profit": float(round(profit, 2)),
        "margin_real": float(round(margin_real, 2)),
    }
