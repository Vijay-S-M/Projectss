from pydantic import BaseModel
from decimal import Decimal


class TableResponse(BaseModel):
    id: int
    table_number: str
    status: str

    class Config:
        from_attributes = True


class FoodResponse(BaseModel):
    id: int
    name: str
    category: str
    price: Decimal
    image: str | None = None
    available: bool

    class Config:
        from_attributes = True


# ===============================
# ORDER SCHEMAS
# ===============================

class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int


class OrderCreate(BaseModel):
    table_id: int
    items: list[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: int
    food_id: int
    quantity: int
    price: Decimal

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    session_id: int
    status: str
    total_amount: Decimal
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True