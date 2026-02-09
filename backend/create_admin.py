from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user_models import User
from app.services.auth_service import get_password_hash
import sys

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def create_admin_user(email, password, full_name):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User {email} already exists.")
            return

        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_admin=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Admin user {email} created successfully.")
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <email> <password> [full_name]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Admin User"
    
    create_admin_user(email, password, full_name)
