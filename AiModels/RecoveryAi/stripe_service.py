import stripe
from config import settings
from typing import Dict, Any
from datetime import datetime

stripe.api_key = settings.STRIPE_SECRET_KEY

SUBSCRIPTION_PRICES = {
    "temporary": {
        "amount": 10.00,
        "currency": "AED",
        "interval": "month"
    },
    "permanent": {
        "amount": 20.00,
        "currency": "AED",
        "interval": "month"
    }
}

def create_customer(email: str, name: str) -> str:
    """Create a Stripe customer"""
    customer = stripe.Customer.create(
        email=email,
        name=name
    )
    return customer.id

def create_subscription(
    customer_id: str,
    payment_method_id: str,
    plan_type: str
) -> Dict[str, Any]:
    """Create a Stripe subscription"""
    
    # Attach payment method to customer
    stripe.PaymentMethod.attach(
        payment_method_id,
        customer=customer_id
    )
    
    # Set as default payment method
    stripe.Customer.modify(
        customer_id,
        invoice_settings={"default_payment_method": payment_method_id}
    )
    
    # Create price if doesn't exist (or use existing price ID)
    price_data = SUBSCRIPTION_PRICES[plan_type]
    
    # For demo, create price on-the-fly. In production, create these once and store IDs
    price = stripe.Price.create(
        unit_amount=int(price_data["amount"] * 100),  # Convert to cents
        currency=price_data["currency"].lower(),
        recurring={"interval": price_data["interval"]},
        product_data={"name": f"{plan_type.capitalize()} Recovery Plan"}
    )
    
    # Create subscription
    subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{"price": price.id}],
        payment_settings={
            "payment_method_types": ["card"],
            "save_default_payment_method": "on_subscription"
        },
        expand=["latest_invoice.payment_intent"]
    )
    
    return {
        "subscription_id": subscription.id,
        "status": subscription.status,
        "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
        "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
        "amount": price_data["amount"],
        "currency": price_data["currency"]
    }

def cancel_subscription(subscription_id: str) -> Dict[str, Any]:
    """Cancel a Stripe subscription at period end"""
    subscription = stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=True
    )
    return {
        "subscription_id": subscription.id,
        "status": subscription.status,
        "cancel_at_period_end": subscription.cancel_at_period_end,
        "canceled_at": datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None
    }

def reactivate_subscription(subscription_id: str) -> Dict[str, Any]:
    """Reactivate a cancelled subscription"""
    subscription = stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=False
    )
    return {
        "subscription_id": subscription.id,
        "status": subscription.status,
        "cancel_at_period_end": subscription.cancel_at_period_end
    }

def update_subscription_plan(
    subscription_id: str,
    new_plan_type: str
) -> Dict[str, Any]:
    """Upgrade or downgrade subscription plan"""
    
    subscription = stripe.Subscription.retrieve(subscription_id)
    price_data = SUBSCRIPTION_PRICES[new_plan_type]
    
    # Create new price
    price = stripe.Price.create(
        unit_amount=int(price_data["amount"] * 100),
        currency=price_data["currency"].lower(),
        recurring={"interval": price_data["interval"]},
        product_data={"name": f"{new_plan_type.capitalize()} Recovery Plan"}
    )
    
    # Update subscription
    updated_subscription = stripe.Subscription.modify(
        subscription_id,
        items=[{
            "id": subscription["items"]["data"][0].id,
            "price": price.id
        }],
        proration_behavior="create_prorations"
    )
    
    return {
        "subscription_id": updated_subscription.id,
        "status": updated_subscription.status,
        "current_period_start": datetime.fromtimestamp(updated_subscription.current_period_start),
        "current_period_end": datetime.fromtimestamp(updated_subscription.current_period_end),
        "amount": price_data["amount"],
        "currency": price_data["currency"]
    }

def update_payment_method(
    customer_id: str,
    payment_method_id: str
) -> Dict[str, Any]:
    """Update customer's payment method"""
    
    # Attach new payment method
    stripe.PaymentMethod.attach(
        payment_method_id,
        customer=customer_id
    )
    
    # Set as default
    stripe.Customer.modify(
        customer_id,
        invoice_settings={"default_payment_method": payment_method_id}
    )
    
    return {"success": True, "message": "Payment method updated successfully"}

def get_subscription_status(subscription_id: str) -> Dict[str, Any]:
    """Get current subscription status"""
    subscription = stripe.Subscription.retrieve(subscription_id)
    
    return {
        "subscription_id": subscription.id,
        "status": subscription.status,
        "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
        "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
        "cancel_at_period_end": subscription.cancel_at_period_end
    }

def handle_webhook_event(payload: bytes, sig_header: str) -> Dict[str, Any]:
    """Handle Stripe webhook events"""
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise ValueError("Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid signature")
    
    # Handle different event types
    if event.type == "invoice.payment_succeeded":
        # Payment successful, subscription active
        return {"event": "payment_succeeded", "data": event.data.object}
    
    elif event.type == "invoice.payment_failed":
        # Payment failed
        return {"event": "payment_failed", "data": event.data.object}
    
    elif event.type == "customer.subscription.deleted":
        # Subscription cancelled
        return {"event": "subscription_deleted", "data": event.data.object}
    
    elif event.type == "customer.subscription.updated":
        # Subscription updated
        return {"event": "subscription_updated", "data": event.data.object}
    
    return {"event": event.type, "data": event.data.object}
