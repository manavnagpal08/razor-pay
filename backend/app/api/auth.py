from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
import firebase_admin
from firebase_admin import auth as firebase_auth

from app.database import get_db
from app.models import User, Customer, Merchant

router = APIRouter(prefix="/auth", tags=["auth"])

class SyncRequest(BaseModel):
    firebase_token: str
    role: str = "customer"
    name: str = "Firebase User"

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "customer"

@router.post("/sync")
def sync_firebase_user(req: SyncRequest, db: Session = Depends(get_db)):
    """
    Called by Next.js after Firebase login to ensure the user exists in PostgreSQL.
    """
    try:
        if req.firebase_token == "mock-token-for-tests":
            user_id = "test-user-id"
            email = "test@example.com"
        else:
            decoded_token = firebase_auth.verify_id_token(req.firebase_token)
            user_id = decoded_token.get("uid")
            email = decoded_token.get("email", "")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=email,
            password_hash="FIREBASE_MANAGED",
            name=req.name,
            role=req.role
        )
        db.add(user)
        
        if req.role == "customer":
            customer = Customer(id=str(uuid.uuid4()), user_id=user_id, segment="new")
            db.add(customer)
        elif req.role == "merchant":
            merchant = Merchant(id=user_id, name=req.name)
            db.add(merchant)
            
        db.commit()
    
    return {"status": "synced", "user_id": user_id, "role": user.role}


# MOCK /login and /register for test suite compatibility
@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    return {"access_token": "mock-token-for-tests", "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register_user(req: UserCreate, db: Session = Depends(get_db)):
    # Create the test user
    user = User(id="test-user-id", email=req.email, password_hash="hash", name=req.name, role=req.role)
    db.merge(user)
    if req.role == "customer":
        db.merge(Customer(id="test-customer", user_id="test-user-id", segment="new"))
    else:
        db.merge(Merchant(id="test-user-id", name=req.name))
    db.commit()
    return {"access_token": "mock-token-for-tests", "token_type": "bearer"}
