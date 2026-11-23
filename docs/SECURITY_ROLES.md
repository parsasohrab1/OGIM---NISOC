# Roles and permissions in OGIM

| Role            | Short description                              | Access (services)                                                                                                |
|-----------------|------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `system_admin`  | System administrator with full access          | All services, user management, command management, catalog management, connection management, running migrations |
| `data_engineer` | In charge of data and analysis                 | View/manage ingestion, view alerts, manage tags (without full delete), access to ML models                       |
| `field_operator`| Field operator                                 | View alerts, create commands (without approve), use inference, view ingestion data                               |
| `operator`      | Control operator                               | Create limited control commands, view the command list                                                           |
| `viewer`        | Read-only access                               | View the dashboard and reports through the API Gateway (read-only endpoints only)                                |

## General policies
- All requests must present a valid Bearer token; the role and `sub` are extracted from the token and checked in the gateway and services.
- Sensitive operations (creating/approving commands, Tag management, connection settings, role changes) require `system_admin` or a designated role.
- Audit records are kept for command operations, alert creation, and user management; logs are stored in JSON format.
- The rate of failed login attempts is limited, and a security alert is recorded if the threshold of 5 attempts per hour is exceeded.

## Related paths
- Authentication: `auth-service` (`/token`, `/refresh`, `/users`).
- Role control in the gateway: file `backend/api-gateway/main.py` (`SERVICE_ROLE_REQUIREMENTS`).
- Role dependencies in each service:
  - `alert-service/main.py`: `require_alert_read/write/admin`  
  - `command-control-service/main.py`: `require_command_read/admin`  
  - `tag-catalog-service/main.py`: `require_tag_read/write/admin`  
  - `data-ingestion-service/main.py`: `require_ingest_read/admin`

To add or modify roles, first update the policy in this document, then apply and test the mapping in the gateway and the relevant service.*** End Patch

