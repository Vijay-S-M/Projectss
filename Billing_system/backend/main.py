from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, Base, engine
from models import (
    RestaurantTable,
    Food,
    TableSession,
    Order,
    OrderItem
)

from schemas import (
    TableResponse,
    FoodResponse,
    OrderCreate,
    OrderResponse
)

from fastapi.middleware.cors import CORSMiddleware


# ===============================
# DATABASE TABLE CREATION
# ===============================

Base.metadata.create_all(bind=engine)


# ===============================
# FASTAPI APP
# ===============================

app = FastAPI(
    title="Restaurant POS System",
    description="Food Ordering, Kitchen and Billing System",
    version="1.0.0"
)


# ===============================
# CORS
# ===============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===============================
# HOME
# ===============================

@app.get("/")
def home():
    return {
        "message": "Restaurant POS Backend is running!"
    }


# ===============================
# HEALTH
# ===============================

@app.get("/health")
def health():
    return {
        "status": "OK"
    }


# ===============================
# GET TABLES
# ===============================

@app.get(
    "/tables",
    response_model=list[TableResponse]
)
def get_tables(
    db: Session = Depends(get_db)
):
    tables = db.query(
        RestaurantTable
    ).all()

    return tables


# ===============================
# GET FOODS
# ===============================

@app.get(
    "/foods",
    response_model=list[FoodResponse]
)
def get_foods(
    db: Session = Depends(get_db)
):
    foods = db.query(
        Food
    ).filter(
        Food.available == True
    ).all()

    return foods


# ===============================
# GET SINGLE FOOD
# ===============================

@app.get(
    "/foods/{food_id}",
    response_model=FoodResponse
)
def get_food(
    food_id: int,
    db: Session = Depends(get_db)
):

    food = db.query(
        Food
    ).filter(
        Food.id == food_id,
        Food.available == True
    ).first()

    if not food:
        raise HTTPException(
            status_code=404,
            detail="Food not found"
        )

    return food


# ===============================
# CREATE ORDER
# ===============================

@app.post(
    "/orders",
    response_model=OrderResponse
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):

    # -------------------------------
    # CHECK TABLE
    # -------------------------------

    table = db.query(
        RestaurantTable
    ).filter(
        RestaurantTable.id == order_data.table_id
    ).first()

    if not table:
        raise HTTPException(
            status_code=404,
            detail="Table not found"
        )


    # -------------------------------
    # CHECK FOOD ITEMS
    # -------------------------------

    if not order_data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one food item"
        )


    # -------------------------------
    # FIND OPEN SESSION
    # -------------------------------

    session = db.query(
        TableSession
    ).filter(
        TableSession.table_id == table.id,
        TableSession.status == "OPEN"
    ).first()


    # -------------------------------
    # CREATE NEW SESSION
    # -------------------------------

    if not session:

        session = TableSession(
            table_id=table.id,
            status="OPEN"
        )

        db.add(session)
        db.flush()


    # -------------------------------
    # CREATE ORDER
    # -------------------------------

    order = Order(
        session_id=session.id,
        status="NEW",
        total_amount=0
    )

    db.add(order)
    db.flush()


    # -------------------------------
    # ADD ORDER ITEMS
    # -------------------------------

    total_amount = 0

    for item in order_data.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than 0"
            )


        food = db.query(
            Food
        ).filter(
            Food.id == item.food_id,
            Food.available == True
        ).first()


        if not food:
            raise HTTPException(
                status_code=404,
                detail=f"Food ID {item.food_id} not found"
            )


        item_total = (
            food.price * item.quantity
        )

        total_amount += item_total


        order_item = OrderItem(
            order_id=order.id,
            food_id=food.id,
            quantity=item.quantity,
            price=food.price
        )

        db.add(order_item)


    # -------------------------------
    # UPDATE ORDER TOTAL
    # -------------------------------

    order.total_amount = total_amount


    # -------------------------------
    # UPDATE TABLE STATUS
    # -------------------------------

    table.status = "OCCUPIED"


    # -------------------------------
    # SAVE
    # -------------------------------

    db.commit()

    db.refresh(order)

    return order


# ===============================
# GET ORDERS
# ===============================

@app.get("/orders")
def get_orders(
    db: Session = Depends(get_db)
):

    orders = db.query(
        Order
    ).all()

    return orders


# ===============================
# GET ORDERS FOR TABLE
# ===============================

@app.get("/orders/table/{table_id}")
def get_table_orders(
    table_id: int,
    db: Session = Depends(get_db)
):

    session = db.query(
        TableSession
    ).filter(
        TableSession.table_id == table_id,
        TableSession.status == "OPEN"
    ).first()

    if not session:
        return []

    orders = db.query(
        Order
    ).filter(
        Order.session_id == session.id
    ).all()

    return orders


# =========================
# CHEF / KITCHEN APIs
# =========================

@app.get("/chef/orders")
def get_chef_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.id.desc()).all()

    result = []

    for order in orders:
        session = db.query(TableSession).filter(
            TableSession.id == order.session_id
        ).first()

        table = None

        if session:
            table = db.query(RestaurantTable).filter(
                RestaurantTable.id == session.table_id
            ).first()

        items = []

        for item in order.items:
            food = db.query(Food).filter(
                Food.id == item.food_id
            ).first()

            items.append({
                "food_id": item.food_id,
                "food_name": food.name if food else "Unknown",
                "quantity": item.quantity,
                "price": float(item.price)
            })

        result.append({
            "order_id": order.id,
            "table_number": table.table_number if table else "Unknown",
            "status": order.status,
            "total_amount": float(order.total_amount),
            "items": items
        })

    return result


@app.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    allowed_statuses = [
        "NEW",
        "PREPARING",
        "READY",
        "DELIVERED"
    ]

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    order.status = status

    db.commit()
    db.refresh(order)

    return {
        "message": "Order status updated successfully",
        "order_id": order.id,
        "status": order.status
    }

# =========================================
# ADMIN / CASH COUNTER APIs
# =========================================


# -----------------------------------------
# GET ALL TABLES FOR ADMIN
# -----------------------------------------

@app.get("/admin/tables")
def admin_get_tables(
    db: Session = Depends(get_db)
):
    tables = db.query(RestaurantTable).order_by(
        RestaurantTable.id
    ).all()

    result = []

    for table in tables:

        # Find active/open session
        session = db.query(TableSession).filter(
            TableSession.table_id == table.id,
            TableSession.status == "OPEN"
        ).first()

        orders = []

        total_amount = 0

        if session:

            orders = db.query(Order).filter(
                Order.session_id == session.id
            ).all()

            total_amount = sum(
                float(order.total_amount)
                for order in orders
            )

        result.append({
            "table_id": table.id,
            "table_number": table.table_number,
            "status": table.status,
            "session_id": session.id if session else None,
            "order_count": len(orders),
            "total_amount": total_amount
        })

    return result


# -----------------------------------------
# GET ORDERS FOR ONE TABLE
# -----------------------------------------

@app.get("/admin/table/{table_id}/orders")
def admin_get_table_orders(
    table_id: int,
    db: Session = Depends(get_db)
):

    # Check table
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id
    ).first()

    if not table:
        raise HTTPException(
            status_code=404,
            detail="Table not found"
        )

    # Find active session
    session = db.query(TableSession).filter(
        TableSession.table_id == table_id,
        TableSession.status == "OPEN"
    ).first()

    if not session:
        return {
            "table_id": table.id,
            "table_number": table.table_number,
            "session_id": None,
            "orders": [],
            "total_amount": 0
        }

    # Get orders
    orders = db.query(Order).filter(
        Order.session_id == session.id
    ).order_by(
        Order.id.asc()
    ).all()

    order_list = []

    grand_total = 0

    for order in orders:

        items = []

        for item in order.items:

            food = db.query(Food).filter(
                Food.id == item.food_id
            ).first()

            item_total = float(
                item.price * item.quantity
            )

            items.append({
                "food_id": item.food_id,
                "food_name": food.name if food else "Unknown",
                "quantity": item.quantity,
                "price": float(item.price),
                "item_total": item_total
            })

        order_total = float(order.total_amount)

        grand_total += order_total

        order_list.append({
            "order_id": order.id,
            "status": order.status,
            "total_amount": order_total,
            "items": items
        })

    return {
        "table_id": table.id,
        "table_number": table.table_number,
        "session_id": session.id,
        "orders": order_list,
        "total_amount": grand_total
    }


# -----------------------------------------
# GET FINAL BILL
# -----------------------------------------

@app.get("/admin/table/{table_id}/bill")
def admin_get_bill(
    table_id: int,
    db: Session = Depends(get_db)
):

    # Check table
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id
    ).first()

    if not table:
        raise HTTPException(
            status_code=404,
            detail="Table not found"
        )

    # Find active session
    session = db.query(TableSession).filter(
        TableSession.table_id == table_id,
        TableSession.status == "OPEN"
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active session for this table"
        )

    # Get all orders
    orders = db.query(Order).filter(
        Order.session_id == session.id
    ).order_by(
        Order.id.asc()
    ).all()

    if not orders:
        raise HTTPException(
            status_code=404,
            detail="No orders found for this table"
        )

    bill_items = []

    subtotal = 0

    for order in orders:

        for item in order.items:

            food = db.query(Food).filter(
                Food.id == item.food_id
            ).first()

            item_total = float(
                item.price * item.quantity
            )

            subtotal += item_total

            bill_items.append({
                "order_id": order.id,
                "food_name": food.name if food else "Unknown",
                "quantity": item.quantity,
                "price": float(item.price),
                "total": item_total
            })

    # Currently no tax/service charge
    tax = 0
    service_charge = 0

    grand_total = subtotal + tax + service_charge

    return {
        "table_id": table.id,
        "table_number": table.table_number,
        "session_id": session.id,
        "items": bill_items,
        "subtotal": subtotal,
        "tax": tax,
        "service_charge": service_charge,
        "grand_total": grand_total
    }


# -----------------------------------------
# CHECKOUT TABLE
# -----------------------------------------

@app.post("/admin/checkout/{table_id}")
def admin_checkout(
    table_id: int,
    payment_method: str,
    db: Session = Depends(get_db)
):

    # Check payment method
    allowed_payment_methods = [
        "CASH",
        "CARD",
        "UPI"
    ]

    payment_method = payment_method.upper()

    if payment_method not in allowed_payment_methods:
        raise HTTPException(
            status_code=400,
            detail="Payment method must be CASH, CARD or UPI"
        )

    # Check table
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id
    ).first()

    if not table:
        raise HTTPException(
            status_code=404,
            detail="Table not found"
        )

    # Find active session
    session = db.query(TableSession).filter(
        TableSession.table_id == table_id,
        TableSession.status == "OPEN"
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active session for this table"
        )

    # Get orders
    orders = db.query(Order).filter(
        Order.session_id == session.id
    ).all()

    if not orders:
        raise HTTPException(
            status_code=400,
            detail="No orders found for this table"
        )

    # Make sure every order is delivered
    pending_orders = []

    for order in orders:

        if order.status != "DELIVERED":
            pending_orders.append({
                "order_id": order.id,
                "status": order.status
            })

    if pending_orders:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Cannot checkout. All orders must be DELIVERED.",
                "pending_orders": pending_orders
            }
        )

    # Calculate final amount
    grand_total = sum(
        float(order.total_amount)
        for order in orders
    )

    # Close session
    session.status = "CLOSED"

    # Release table
    table.status = "AVAILABLE"

    # Save changes
    db.commit()

    return {
        "message": "Checkout completed successfully",
        "table_number": table.table_number,
        "session_id": session.id,
        "payment_method": payment_method,
        "total_amount": grand_total,
        "table_status": table.status
    }