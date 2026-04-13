import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models import (
    Tenant, TenantSettings, User, Client, CatalogItem, Theme, FixedCost
)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Tenant
    tenant = Tenant(name="Île Magique Demo", slug="demo", is_active=True)
    db.add(tenant)
    db.flush()

    # TenantSettings
    ts = TenantSettings(
        tenant_id=tenant.id,
        tax_rate=6,
        profit_margin=40,
        events_per_month=8,
        company_name="Île Magique",
    )
    db.add(ts)

    # User admin
    admin = User(
        tenant_id=tenant.id,
        name="Administrador",
        email="admin@ilemagique.com",
        password_hash=hash_password("ilemagique2026"),
        role="admin",
    )
    db.add(admin)

    # Catalog Items
    items = [
        ("Mesa decorada", "Decoração", 120, 280),
        ("Arco de balões", "Balões", 80, 220),
        ("Painel de fundo", "Decoração", 150, 350),
        ("Kit mesa de doces", "Decoração", 60, 150),
        ("Lembrancinhas", "Brindes", 5, 15),
        ("Centro de mesa", "Decoração", 25, 65),
        ("Balões metálicos", "Balões", 35, 90),
        ("Toalhas e capas", "Tecidos", 40, 100),
        ("Faixa de parabéns", "Decoração", 30, 75),
        ("Iluminação LED", "Iluminação", 45, 120),
    ]
    for name, cat, cost, price in items:
        db.add(CatalogItem(tenant_id=tenant.id, name=name, category=cat, cost=cost, price=price))

    # Themes
    themes = [
        ("Safari", "#E8A030", "🦁"),
        ("Fundo do Mar", "#0284C7", "🐠"),
        ("Circo", "#DC2626", "🎪"),
        ("Princesas", "#DB2777", "👑"),
        ("Super-heróis", "#7C3AED", "⚡"),
        ("Fazendinha", "#16A34A", "🐄"),
        ("Unicórnio", "#D946EF", "🦄"),
        ("Astronauta", "#1D4ED8", "🚀"),
    ]
    for name, color, emoji in themes:
        db.add(Theme(tenant_id=tenant.id, name=name, color=color, emoji=emoji))

    # Fixed Costs
    fixed = [
        ("Aluguel", 800),
        ("Seguro", 250),
        ("Internet", 150),
        ("Manutenção", 200),
    ]
    for name, value in fixed:
        db.add(FixedCost(tenant_id=tenant.id, name=name, value=value))

    # Clients
    c1 = Client(tenant_id=tenant.id, name="Maria Silva", phone="(83) 99999-1234", email="maria@email.com", city="Campina Grande")
    c2 = Client(tenant_id=tenant.id, name="Ana Souza", phone="(83) 98888-5678", email="ana@email.com", city="João Pessoa")
    db.add(c1)
    db.add(c2)

    db.commit()
    print("✅ Seed executado com sucesso!")
except Exception as e:
    db.rollback()
    print(f"❌ Erro no seed: {e}")
    raise
finally:
    db.close()
