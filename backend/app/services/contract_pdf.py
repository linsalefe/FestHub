from datetime import datetime, timezone

from jinja2 import Template
from sqlalchemy.orm import Session, joinedload

from app.models.budget import Budget
from app.models.contract import Contract
from app.models.tenant_settings import TenantSettings
from app.services.budget_calculator import calculate_budget


CONTRACT_PDF_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E2247; font-size: 11px; line-height: 1.6; }
  .header { text-align: center; border-bottom: 3px solid {{ accent }}; padding-bottom: 16px; margin-bottom: 24px; }
  .company-name { font-size: 26px; font-weight: bold; color: {{ accent }}; margin-bottom: 4px; }
  .doc-title { font-size: 16px; font-weight: bold; color: #1E2247; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
  .contract-number { font-size: 12px; color: #7880A0; margin-top: 4px; }

  .parties { margin-bottom: 24px; }
  .party { background: #FAFBFE; border: 1px solid #E2E4EE; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
  .party-title { font-size: 12px; font-weight: bold; color: {{ accent }}; text-transform: uppercase; margin-bottom: 6px; }
  .party-info { font-size: 11px; line-height: 1.8; }

  .clause { margin-bottom: 16px; page-break-inside: avoid; }
  .clause-title { font-size: 12px; font-weight: bold; color: {{ accent }}; margin-bottom: 6px; text-transform: uppercase; }
  .clause-body { font-size: 11px; line-height: 1.7; text-align: justify; }

  .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .items-table th { background: {{ accent }}; color: white; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
  .items-table td { padding: 6px 10px; border-bottom: 1px solid #E2E4EE; font-size: 11px; }
  .items-table tr:nth-child(even) { background: #FAFBFE; }
  .text-right { text-align: right; }

  .payment-box { background: #FAFBFE; border: 1px solid #E2E4EE; border-radius: 8px; padding: 14px 16px; margin: 8px 0; }
  .payment-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
  .payment-total { font-size: 14px; font-weight: bold; color: {{ accent }}; border-top: 2px solid {{ accent }}; padding-top: 8px; margin-top: 8px; }

  .signatures { margin-top: 48px; display: flex; justify-content: space-between; gap: 60px; }
  .signature-box { flex: 1; text-align: center; }
  .signature-line { border-top: 1px solid #1E2247; margin-top: 60px; padding-top: 8px; font-size: 11px; }
  .signature-name { font-weight: bold; font-size: 12px; }
  .signature-doc { font-size: 10px; color: #7880A0; }

  .footer { margin-top: 32px; text-align: center; font-size: 9px; color: #7880A0; border-top: 1px solid #E2E4EE; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{ company_name }}</div>
    {% if company_phone or company_instagram %}
    <div style="font-size: 10px; color: #7880A0;">
      {% if company_phone %}{{ company_phone }}{% endif %}
      {% if company_instagram %} &middot; {{ company_instagram }}{% endif %}
    </div>
    {% endif %}
    <div class="doc-title">Contrato de Prestacao de Servicos de Decoracao</div>
    <div class="contract-number">Contrato N. {{ contract.contract_number }}</div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">Contratante</div>
      <div class="party-info">
        <strong>{{ client_name }}</strong><br>
        {% if contract.client_document %}CPF/CNPJ: {{ contract.client_document }}<br>{% endif %}
        {% if contract.client_address %}Endereco: {{ contract.client_address }}{% endif %}
      </div>
    </div>
    <div class="party">
      <div class="party-title">Contratada</div>
      <div class="party-info">
        <strong>{{ company_name }}</strong><br>
        {% if company_phone %}Telefone: {{ company_phone }}<br>{% endif %}
        {% if company_instagram %}Instagram: {{ company_instagram }}{% endif %}
      </div>
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Clausula 1 - Do Objeto</div>
    <div class="clause-body">
      A CONTRATADA se compromete a realizar a decoracao do evento conforme itens descritos no orcamento
      n. {{ contract.budget_id }}, nos termos deste contrato.
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Clausula 2 - Da Data e Local</div>
    <div class="clause-body">
      <strong>Data do Evento:</strong> {{ event_date }}<br>
      {% if contract.event_time %}<strong>Horario:</strong> {{ contract.event_time.strftime('%H:%M') if contract.event_time else '' }}<br>{% endif %}
      {% if contract.event_address %}<strong>Endereco:</strong> {{ contract.event_address }}<br>{% endif %}
      {% if contract.event_duration %}<strong>Duracao prevista:</strong> {{ contract.event_duration }}{% endif %}
    </div>
  </div>

  {% if contract.montage_time or contract.demontage_time %}
  <div class="clause">
    <div class="clause-title">Clausula 3 - Da Montagem e Desmontagem</div>
    <div class="clause-body">
      {% if contract.montage_time %}<strong>Montagem:</strong> {{ contract.montage_time.strftime('%H:%M') }}<br>{% endif %}
      {% if contract.demontage_time %}<strong>Desmontagem:</strong> {{ contract.demontage_time.strftime('%H:%M') }}{% endif %}
    </div>
  </div>
  {% endif %}

  {% if items %}
  <div class="clause">
    <div class="clause-title">Clausula 4 - Dos Servicos</div>
    <div class="clause-body">
      A CONTRATADA fornecera os seguintes itens e servicos:
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Quantidade</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>{{ item.name }}</td>
          <td class="text-right">{{ item.quantity }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>
  {% endif %}

  <div class="clause">
    <div class="clause-title">Clausula 5 - Do Valor e Pagamento</div>
    <div class="clause-body">
      <div class="payment-box">
        <div class="payment-row payment-total">
          <span>VALOR TOTAL</span>
          <span>R$ {{ "%.2f"|format(contract.total_value) }}</span>
        </div>
        {% if contract.down_payment and contract.down_payment > 0 %}
        <div class="payment-row">
          <span>Sinal/Entrada{% if contract.down_payment_date %} (ate {{ contract.down_payment_date.strftime('%d/%m/%Y') }}){% endif %}</span>
          <span>R$ {{ "%.2f"|format(contract.down_payment) }}</span>
        </div>
        {% endif %}
        {% if contract.remaining_value and contract.remaining_value > 0 %}
        <div class="payment-row">
          <span>Restante{% if contract.remaining_payment_date %} (ate {{ contract.remaining_payment_date.strftime('%d/%m/%Y') }}){% endif %}</span>
          <span>R$ {{ "%.2f"|format(contract.remaining_value) }}</span>
        </div>
        {% endif %}
        {% if contract.payment_method %}
        <div class="payment-row">
          <span>Forma de pagamento</span>
          <span>{{ contract.payment_method }}</span>
        </div>
        {% endif %}
      </div>
    </div>
  </div>

  {% if contract.cancellation_policy %}
  <div class="clause">
    <div class="clause-title">Clausula 6 - Do Cancelamento</div>
    <div class="clause-body">{{ contract.cancellation_policy }}</div>
  </div>
  {% endif %}

  {% if contract.additional_clauses %}
  <div class="clause">
    <div class="clause-title">Clausula 7 - Das Disposicoes Gerais</div>
    <div class="clause-body">{{ contract.additional_clauses }}</div>
  </div>
  {% endif %}

  <div class="clause">
    <div class="clause-title">Clausula {{ '8' if contract.additional_clauses else '7' }} - Do Foro</div>
    <div class="clause-body">
      Fica eleito o foro da comarca local para dirimir quaisquer duvidas oriundas do presente contrato.
    </div>
  </div>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-name">{{ client_name }}</div>
        <div class="signature-doc">CONTRATANTE</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-name">{{ company_name }}</div>
        <div class="signature-doc">CONTRATADA</div>
      </div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #7880A0;">
    {{ now }}
  </div>

  <div class="footer">
    Contrato gerado por <strong>{{ company_name }}</strong> &middot; {{ now }}
  </div>
</body>
</html>
"""


def generate_contract_pdf(contract: Contract, db: Session) -> bytes:
    settings = db.query(TenantSettings).filter(TenantSettings.tenant_id == contract.tenant_id).first()

    accent = settings.pdf_accent_color if settings else "#4A5BA8"
    company_name = settings.company_name if settings else "Ile Magique"
    company_phone = settings.company_phone if settings else None
    company_instagram = settings.company_instagram if settings else None

    # Load budget items
    items = []
    if contract.budget_id:
        budget = (
            db.query(Budget)
            .options(joinedload(Budget.items))
            .filter(Budget.id == contract.budget_id)
            .first()
        )
        if budget:
            items = budget.items

    client_name = contract.client.name if contract.client else "N/A"
    event_date = contract.event_date.strftime("%d/%m/%Y") if contract.event_date else "N/A"

    template = Template(CONTRACT_PDF_TEMPLATE)
    html = template.render(
        contract=contract,
        items=items,
        accent=accent,
        company_name=company_name,
        company_phone=company_phone,
        company_instagram=company_instagram,
        client_name=client_name,
        event_date=event_date,
        now=datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
    )

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return pdf_bytes
    except ImportError:
        return html.encode("utf-8")
