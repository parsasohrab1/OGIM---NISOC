# Database Migration Guide with Alembic

This document describes the process of applying database changes from development to production.

## Environments
- **Development (local/dev cluster)**: Where model changes and new migrations are produced.
- **Staging**: An integrated test environment with semi-realistic data; the generated migration must first be applied and verified here.
- **Production**: The operational environment. No change is applied without passing through staging.

## Migration workflow
1. **Developing a migration**
   ```bash
   cd backend
   alembic revision --autogenerate -m "describe change"
   ```
   - Review the new file in `backend/migrations/versions/`; only the necessary changes should be present.
   - Tests:
     ```bash
     pytest backend/tests
     alembic upgrade head  # on the local database
     alembic downgrade -1  # to make sure rollback works
     ```

2. **Deploying to Staging**
   - In the CI/CD Pipeline:
     ```bash
     alembic upgrade head --sql > migrations.sql  # generate the script
     # After approval, apply it to the staging database:
     alembic -x db_url=<STAGING_DB_URL> upgrade head
     ```
   - Check the health of the services (health check, smoke test).

3. **Deploying to Production**
   - After QA approval, the same SQL script or the `alembic upgrade head` command is run with the production URL.
   - In case of an error, the `alembic downgrade -1` command is ready, but it is recommended that migration scripts support rollback.

## Variables and settings
- The file `backend/alembic.ini` uses the environment variable `SQLALCHEMY_DATABASE_URL` or `DATABASE_URL`.
- For TimescaleDB or other databases, define separate environment sections if needed (e.g. `alembic_ts.ini`).

## Notes:
- The generated migration must be reviewed by Peer Review.
- Avoid running `alembic revision --autogenerate` on the production or staging database; only in the dev environment.
- The SQL script generated for production must be stored in version control (or attached to a written Release).

## Useful Commands
- View the migration status: `alembic current`
- View the history: `alembic history`
- Run a specific migration: `alembic upgrade <revision>`

By following this workflow, the team can move database changes between environments in a controlled and traceable way.*** End Patch

