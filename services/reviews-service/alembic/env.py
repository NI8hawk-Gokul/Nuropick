import os
from logging.config import fileConfig
from sqlalchemy import pool
from alembic import context

config = context.config
fileConfig(config.config_file_name)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    os.getenv(
        "DATABASE_URL_REVIEWS",
        f"postgresql+asyncpg://{os.getenv('POSTGRES_USER','neuro_user')}:{os.getenv('POSTGRES_PASSWORD','neuro_pass')}@{os.getenv('POSTGRES_HOST','db')}:{os.getenv('POSTGRES_PORT','5432')}/{os.getenv('POSTGRES_DB','neuro_db')}"
    ),
)

config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Import targets metadata
try:
    from services.reviews_service_app.models import Base  # try standard import
    target_metadata = Base.metadata
except Exception:
    import importlib.util, sys, pathlib
    here = pathlib.Path(__file__).resolve().parents[2] / "app" / "models.py"
    spec = importlib.util.spec_from_file_location("reviews_models", str(here))
    mod = importlib.util.module_from_spec(spec)
    sys.modules["reviews_models"] = mod
    spec.loader.exec_module(mod)
    target_metadata = mod.Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"}
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    from sqlalchemy import create_engine
    connectable = create_engine(config.get_main_option("sqlalchemy.url"))
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()