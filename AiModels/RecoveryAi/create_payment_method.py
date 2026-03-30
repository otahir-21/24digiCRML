import stripe
import os
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Use a test token provided by Stripe
payment_method = stripe.PaymentMethod.create(
    type="card",
    card={"token": "tok_visa"}  # Use Stripe's test token
)

print(f"Payment Method ID: {payment_method.id}")
