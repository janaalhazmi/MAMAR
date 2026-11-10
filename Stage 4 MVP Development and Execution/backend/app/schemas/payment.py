from datetime import datetime

from pydantic import BaseModel, Field


class PaymentStart(BaseModel):
    # The pages PayPal sends the contractor back to. Both must be on the MAMAR site.
    return_url: str = Field(max_length=500)
    cancel_url: str = Field(max_length=500)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "return_url": "https://mammar-blush.vercel.app/payment/return",
                    "cancel_url": "https://mammar-blush.vercel.app/payment/cancel",
                }
            ]
        }
    }


class PaymentResponse(BaseModel):
    payment_id: int
    project_id: int
    quote_id: int
    amount: float
    currency: str
    charged_amount: float
    charged_currency: str
    paypal_order_id: str
    status: str
    created_at: datetime
    paid_at: datetime | None


class PaymentStarted(BaseModel):
    payment: PaymentResponse
    # Open this page so the contractor pays on PayPal.
    approve_url: str
