from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from app.db.session import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirm
)
from app.schemas.token import Token
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User, UserRole

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Registers a new researcher user with the platform.
    """
    auth_service = AuthService(db)
    user, token = auth_service.register_user(user_in)
    
    # Dev Helper Log: (Prints token to console since there is no live SMTP configured)
    print(f"\n[DEV SECURITY NOTICE] Registration successful for {user.email}.")
    print(f"[VERIFICATION LINK]: http://localhost:8000/api/v1/auth/verify-email?token={token}\n")
    
    return user

@router.post("/login", response_model=Token)
@router.post("/token", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, retrieve access and refresh tokens.
    """
    auth_service = AuthService(db)
    return auth_service.authenticate_user(form_data.username, form_data.password)

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token_str: str, db: Session = Depends(get_db)) -> Any:
    """
    Generates a new access token and refresh token pair using an active refresh token.
    """
    auth_service = AuthService(db)
    return auth_service.refresh_access_token(refresh_token_str)

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)) -> Any:
    """
    Verifies a user's email address using a secret code registration link.
    """
    auth_service = AuthService(db)
    auth_service.verify_email(token)
    return {"message": "Email address successfully verified. You can now login to ResearchOS."}

@router.post("/reset-password/initiate")
def initiate_password_reset(
    payload: PasswordResetRequest, db: Session = Depends(get_db)
) -> Any:
    """
    Initiates a password recovery request and generates a temporary reset token.
    """
    auth_service = AuthService(db)
    token = auth_service.initiate_password_reset(payload.email)
    
    if token:
        # Dev Helper Log
        print(f"\n[DEV SECURITY NOTICE] Password reset initiated for {payload.email}.")
        print(f"[RESET TOKEN]: {token}\n")
        
    return {
        "message": "If this email is registered in our database, password reset instructions will be delivered."
    }

@router.post("/reset-password/confirm")
def confirm_password_reset(
    payload: PasswordResetConfirm, db: Session = Depends(get_db)
) -> Any:
    """
    Resets user account password using verification token validation.
    """
    auth_service = AuthService(db)
    auth_service.confirm_password_reset(payload.token, payload.new_password)
    return {"message": "Password updated successfully. You can now login using your new credentials."}

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    """
    Retrieves the currently authenticated user session.
    """
    return current_user

@router.post("/register-default-project", response_model=Any)
def register_default_project(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Any:
    """
    Creates or retrieves a default workspace project for the current authenticated user.
    """
    from app.models.project import Project
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        project = Project(
            user_id=current_user.id,
            title="Autonomous Visual-Semantic Research Lab",
            description="Workspace project analyzing deep-learning models, spatial indices, and visual-semantic parsing."
        )
        db.add(project)
        db.commit()
        db.refresh(project)
    return {
        "id": str(project.id),
        "title": project.title,
        "description": project.description
    }

# Admin-only test route to verify RBAC
@router.get("/admin-only-panel")
def read_admin_panel(
    admin_user: User = Depends(RoleChecker([UserRole.ADMIN]))
) -> Any:
    """
    Sample administrative route protected by Role-Based Access Control.
    """
    return {"message": f"Welcome back, administrator {admin_user.full_name}."}
