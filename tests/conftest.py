import os
import asyncio
import tempfile
import pathlib
import importlib.util
import sys
import time

import pytest
from testcontainers.postgres import PostgresContainer
from alembic.config import Config
from alembic import command


def _run_alembic(alembic_ini_path: str, db_url: str):
    cfg = Config(alembic_ini_path)
    cfg.set_main_option("sqlalchemy.url", db_url)
    command.upgrade(cfg, "head")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def database_urls():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        yield {"database_url": db_url}
    else:
        with PostgresContainer("postgres:15-alpine") as pg:
            time.sleep(1)
            db_url = pg.get_connection_url().replace("postgresql://", "postgresql+asyncpg://")
            os.environ["DATABASE_URL"] = db_url
            os.environ["POSTGRES_USER"] = pg.USER
            os.environ["POSTGRES_PASSWORD"] = pg.PASSWORD
            os.environ["POSTGRES_DB"] = pg.DBNAME
            os.environ["POSTGRES_HOST"] = pg.get_container_host_ip()
            os.environ["POSTGRES_PORT"] = str(pg.get_exposed_port(5432))
            yield {"database_url": db_url}


@pytest.fixture(scope="session")
def run_migrations(database_urls, tmp_path_factory):
    db_url = database_urls["database_url"]
    # Run alembic for auth-service and reviews-service using their alembic.ini
    here = pathlib.Path(__file__).resolve().parents[1]
    auth_alembic = str(here / "services" / "auth_service" / "alembic.ini")
    reviews_alembic = str(here / "services" / "reviews_service" / "alembic.ini")

    _run_alembic(auth_alembic, db_url.replace("asyncpg://", "psycopg2://").replace("+asyncpg", ""))
    _run_alembic(reviews_alembic, db_url.replace("asyncpg://", "psycopg2://").replace("+asyncpg", ""))

    # small sleep to ensure DB ready
    time.sleep(0.5)
    return True