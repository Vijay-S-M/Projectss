from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(10), unique=True, nullable=False)
    status = Column(String(20), default="AVAILABLE")

    sessions = relationship(
        "TableSession",
        back_populates="table"
    )


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    image = Column(String(255))
    available = Column(Boolean, default=True)

    order_items = relationship(
        "OrderItem",
        back_populates="food"
    )


class TableSession(Base):
    __tablename__ = "table_sessions"

    id = Column(Integer, primary_key=True, index=True)

    table_id = Column(
        Integer,
        ForeignKey("restaurant_tables.id"),
        nullable=False
    )

    status = Column(
        String(20),
        default="OPEN"
    )

    table = relationship(
        "RestaurantTable",
        back_populates="sessions"
    )

    orders = relationship(
        "Order",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(
        Integer,
        ForeignKey("table_sessions.id"),
        nullable=False
    )

    status = Column(
        String(20),
        default="NEW"
    )

    total_amount = Column(
        Numeric(10, 2),
        default=0
    )

    session = relationship(
        "TableSession",
        back_populates="orders"
    )

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    food_id = Column(
        Integer,
        ForeignKey("foods.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    price = Column(
        Numeric(10, 2),
        nullable=False
    )

    order = relationship(
        "Order",
        back_populates="items"
    )

    food = relationship(
        "Food",
        back_populates="order_items"
    )