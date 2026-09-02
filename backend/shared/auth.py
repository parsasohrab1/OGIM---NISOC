"""
Authentication and authorization dependencies shared across services.
"""

from typing import Dict, Iterable, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .security import decode_token
from .permissions import role_has_permission

bearer_scheme = HTTPBearer(auto_error=False)


def require_authentication(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """
    Ensure a valid Bearer token is provided and return its payload.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return payload


def require_roles(allowed_roles: Iterable[str]):
    """
    Dependency factory that enforces membership in the allowed role set.
    """

    allowed = set(allowed_roles)

    def verifier(
        payload: Dict[str, Any] = Depends(require_authentication),
    ) -> Dict[str, Any]:
        role = payload.get("role")
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return payload

    return verifier


def require_permission(permission: str):
    """
    Dependency factory that enforces the caller's role carries the given
    permission (see shared/permissions.py for the role -> permission map).
    """

    def verifier(
        payload: Dict[str, Any] = Depends(require_authentication),
    ) -> Dict[str, Any]:
        role = payload.get("role")
        if not role_has_permission(role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}",
            )
        return payload

    return verifier
