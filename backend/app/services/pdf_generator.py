from datetime import datetime, timezone
from io import BytesIO

from jinja2 import Template
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.tenant_settings import TenantSettings
from app.services.budget_calculator import calculate_budget

PDF_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E2247; font-size: 12px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid {{ accent }}; padding-bottom: 16px; margin-bottom: 24px; }
  .company-name { font-size: 24px; font-weight: bold; color: {{ accent }}; }
  .company-info { font-size: 10px; color: #7880A0; text-align: right; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 14px; font-weight: bold; color: {{ accent }}; border-bottom: 1px solid #E2E4EE; padding-bottom: 4px; margin-bottom: 8px; }
  .info-grid { display: flex; gap: 24px; flex-wrap: wrap; }
  .info-item { min-width: 150px; }
  .info-label { font-size: 10px; color: #7880A0; text-transform: uppercase; }
  .info-value { font-size: 13px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: {{ accent }}; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #E2E4EE; font-size: 12px; }
  tr:nth-child(even) { background: #FAFBFE; }
  .text-right { text-align: right; }
  .summary { margin-top: 16px; margin-left: auto; width: 280px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .summary-total { font-size: 18px; font-weight: bold; color: {{ accent }}; border-top: 2px solid {{ accent }}; padding-top: 8px; margin-top: 8px; }
  .conditions { background: #FAFBFE; border: 1px solid #E2E4EE; border-radius: 8px; padding: 16px; margin-top: 16px; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #7880A0; border-top: 1px solid #E2E4EE; padding-top: 12px; }
  .theme-badge { display: inline-block; background: #EEF0F8; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">{{ company_name or 'Île Magique' }}</div>
      {% if company_phone or company_instagram %}
      <div style="font-size: 11px; color: #7880A0; margin-top: 4px;">
        {% if company_phone %}{{ company_phone }}{% endif %}
        {% if company_instagram %} · {{ company_instagram }}{% endif %}
      </div>
      {% endif %}
    </div>
    <div class="company-info">
      <div>Orçamento #{{ budget.id }}</div>
      <div>Emitido: {{ now }}</div>
      <div>Validade: {{ validity_days }} dias</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Cliente</div>
        <div class="info-value">{{ client_name or 'Não definido' }}</div>
      </div>
      {% if client_phone %}
      <div class="info-item">
        <div class="info-label">Telefone</div>
        <div class="info-value">{{ client_phone }}</div>
      </div>
      {% endif %}
      {% if event_date %}
      <div class="info-item">
        <div class="info-label">Data do Evento</div>
        <div class="info-value">{{ event_date }}</div>
      </div>
      {% endif %}
      {% if event_address %}
      <div class="info-item">
        <div class="info-label">Local</div>
        <div class="info-value">{{ event_address }}</div>
      </div>
      {% endif %}
    </div>
    {% if theme_name %}
    <div style="margin-top: 8px;">
      <span class="theme-badge">{{ theme_emoji }} {{ theme_name }}</span>
    </div>
    {% endif %}
  </div>

  <div class="section">
    <div class="section-title">Itens do Orçamento</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Qtd</th>
          <th class="text-right">Valor Unit.</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>{{ item.name }}</td>
          <td class="text-right">{{ item.quantity }}</td>
          <td class="text-right">R$ {{ "%.2f"|format(item.price) }}</td>
          <td class="text-right">R$ {{ "%.2f"|format(item.price * item.quantity) }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>R$ {{ "%.2f"|format(calc.subtotal) }}</span>
    </div>
    <div class="summary-row">
      <span>Impostos ({{ calc.tax_rate }}%)</span>
      <span>R$ {{ "%.2f"|format(calc.tax_value) }}</span>
    </div>
    {% if calc.discount > 0 %}
    <div class="summary-row" style="color: #DC2626;">
      <span>Desconto</span>
      <span>- R$ {{ "%.2f"|format(calc.discount) }}</span>
    </div>
    {% endif %}
    <div class="summary-row summary-total">
      <span>TOTAL</span>
      <span>R$ {{ "%.2f"|format(calc.total) }}</span>
    </div>
  </div>

  <div class="conditions">
    <div style="font-weight: bold; margin-bottom: 4px;">Condições de Pagamento</div>
    <div>{{ payment_condition }}</div>
  </div>

  {% if notes %}
  <div class="section" style="margin-top: 16px;">
    <div class="section-title">Observações</div>
    <p>{{ notes }}</p>
  </div>
  {% endif %}

  <div class="footer">
    Orçamento gerado por <strong>{{ company_name or 'Île Magique' }}</strong> · {{ now }}
  </div>
</body>
</html>
"""


def generate_budget_pdf(budget: Budget, db: Session) -> bytes:
    calc = calculate_budget(budget, db)
    settings = db.query(TenantSettings).filter(TenantSettings.tenant_id == budget.tenant_id).first()

    accent = settings.pdf_accent_color if settings else "#4A5BA8"
    company_name = settings.company_name if settings else "Île Magique"
    company_phone = settings.company_phone if settings else None
    company_instagram = settings.company_instagram if settings else None

    template = Template(PDF_TEMPLATE)
    html = template.render(
        budget=budget,
        items=budget.items,
        calc=calc,
        accent=accent,
        company_name=company_name,
        company_phone=company_phone,
        company_instagram=company_instagram,
        client_name=budget.client.name if budget.client else None,
        client_phone=budget.client.phone if budget.client else None,
        event_date=budget.event_date.strftime("%d/%m/%Y") if budget.event_date else None,
        event_address=budget.event_address,
        theme_name=budget.theme.name if budget.theme else None,
        theme_emoji=budget.theme.emoji if budget.theme else "",
        payment_condition=budget.payment_condition,
        validity_days=budget.validity_days,
        notes=budget.notes,
        now=datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
    )

    # Try WeasyPrint, fall back to HTML
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return pdf_bytes
    except ImportError:
        return html.encode("utf-8")
