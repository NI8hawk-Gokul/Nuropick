## Local dev after package conversion

1. Ensure `.env` exists and contains:
   - POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST=db, POSTGRES_PORT=5432
   - JWT_SECRET
   - ENV=development

2. Build and run services:
   docker-compose build
   docker-compose up

   The entrypoint scripts will run Alembic migrations automatically in development for services that include alembic (auth_service, reviews_service).

3. Seed admin (dev):
   # run inside auth_service container or locally with same env
   docker-compose exec auth_service python /app/scripts/seed_admin.py --email admin@local.test --username admin --password adminpass

4. Login:
   POST http://localhost:8001/login (form fields: username, password) to get Bearer token.

5. Use admin token to access moderation endpoints:
   GET http://localhost:8003/moderation/reviews
   POST http://localhost:8003/moderation/reviews/{id}/approve

Notes:
- For production, prefer running Alembic migrations from CI/CD instead of entrypoint.
- Make sure JWT_SECRET is consistent across services.