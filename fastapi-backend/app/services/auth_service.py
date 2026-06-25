from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.token import Token
from app.repositories.user_repo import UserRepository
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    generate_random_token
)

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_in: UserCreate) -> Tuple[User, str]:
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists in the system."
            )
        
        verification_token = generate_random_token()
        user = self.user_repo.create(user_in, verification_token=verification_token)
        
        # Auto-verify in development (no SMTP configured)
        user.is_verified = True
        self.user_repo.save(user)
        
        print(f"\n[DEV] Registration successful for {user.email}. Auto-verified.\n")
        return user, verification_token

    def authenticate_user(self, email: str, plain_password: str) -> Token:
        user = self.user_repo.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
        
        if not verify_password(plain_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user account has been deactivated."
            )

        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)
        
        return Token(access_token=access_token, refresh_token=refresh_token)

    def refresh_access_token(self, refresh_token: str) -> Token:
        from jose import jwt, JWTError
        from app.core.config import settings
        
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            token_type = payload.get("type")
            if token_type != "refresh":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing user identity.")
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials.")
            
        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

        access_token = create_access_token(user.id, user.role.value)
        new_refresh_token = create_refresh_token(user.id)
        return Token(access_token=access_token, refresh_token=new_refresh_token)

    def verify_email(self, token: str) -> User:
        user = self.user_repo.get_by_verification_token(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token.")
        user.is_verified = True
        user.verification_token = None
        return self.user_repo.save(user)

    def initiate_password_reset(self, email: str) -> Optional[str]:
        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        reset_token = generate_random_token()
        user.reset_token = reset_token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        self.user_repo.save(user)
        return reset_token

    def confirm_password_reset(self, token: str, new_password: str) -> User:
        user = self.user_repo.get_by_reset_token(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset token.")
        if user.reset_token_expires:
            expires_at = user.reset_token_expires
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired.")
        from app.core.security import get_password_hash
        user.password_hash = get_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        return self.user_repo.save(user)
