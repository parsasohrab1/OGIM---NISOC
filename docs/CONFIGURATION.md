# Configuration & Secret Management

## Environment Profiles

The `config/` folder contains sample files for different environments:

- `config/development.env.example`
- `config/production.env.example`

To use:

```bash
cp config/development.env.example config/development.env
cp config/production.env.example config/production.env
```

Then set the `OGIM_ENV_FILE` variable to the path of the appropriate file, or set the `ENVIRONMENT` variable so that the file is loaded automatically:

```bash
export OGIM_ENV_FILE=config/development.env
# or
export ENVIRONMENT=production  # automatically looks for config/production.env
```

If no file matching the chosen name exists, the application uses `.env` in the project root.

## Secret Management

In Production environments it is recommended to inject sensitive values from an external Secret Manager:

- **Docker/Kubernetes**: Use Docker secrets or Kubernetes Secrets and mount them as a file or environment variable.
- **Cloud Vaults**: Azure Key Vault, AWS Secrets Manager or HashiCorp Vault.

Example for Kubernetes:

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: ogim-secrets
        key: database-url
```

In CI/CD (GitHub Actions) you can also define Secrets in the repository Settings and inject them at run time (`secrets.DATABASE_URL`).

## Default Values

For local development, the file `development.env.example` contains default values (local Postgres/Kafka/Redis). Before committing, rename these files back to `.example` so that real secrets do not enter the repository.
