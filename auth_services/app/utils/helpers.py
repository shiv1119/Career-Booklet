import random
import string
from sqlalchemy.orm import Session
from app.models.user import User

def generate_otp(length=6):
    length = 6
    otp = ''.join(random.choices(string.digits, k=length))
    return otp


def mask_email(email):
    local_part, domain = email.split("@")
    masked_local = local_part[:3] + "****"
    masked_email = f"{masked_local}@{domain}"
    return masked_email


def generate_unique_old_email(email: str, db: Session):
    base_email = f"old_Career_booklet_{email}"
    unique_email = base_email
    count = 1
    while db.query(User).filter(User.email == unique_email).first():
        unique_email = f"{count}_{base_email}"
        count += 1

    return unique_email


