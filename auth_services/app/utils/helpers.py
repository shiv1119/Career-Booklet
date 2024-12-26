import random
import string

def generate_otp(length=6):
    length = 6
    otp = ''.join(random.choices(string.digits, k=length))
    return otp


def mask_email(email):
    local_part, domain = email.split("@")
    masked_local = local_part[:3] + "****"
    masked_email = f"{masked_local}@{domain}"
    return masked_email


