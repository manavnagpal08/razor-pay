from pydantic import BaseModel
from typing import Optional

class SupabaseUser(BaseModel):
    id: str
    email: str
    role: Optional[str] = "customer"

def verify_token(token: str) -> SupabaseUser:
    """
    Placeholder for Supabase token verification.
    Phase 02 does not implement full auth verification.
    """
    return SupabaseUser(id="test_user_id", email="test@example.com")
