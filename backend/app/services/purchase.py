import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.enums import MovementType, PurchaseStatus
from app.db.mixins import generate_uuid7
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.schemas.purchase import PurchaseCreate, PurchaseReceive, PurchaseUpdate
from app.services.inventory import record_movement


class ProductNotFoundError(Exception):
    """Raised when a purchase line references a product that doesn't exist."""


class PurchaseNotEditableError(Exception):
    """Raised when editing/cancelling a purchase that isn't still draft."""


class PurchaseNotReceivableError(Exception):
    """Raised when receiving a purchase that isn't still draft."""


def _build_items(db: Session, items_data) -> tuple[list[PurchaseItem], Decimal, Decimal, Decimal, Decimal]:
    items = []
    subtotal = Decimal("0")
    cgst_total = Decimal("0")
    sgst_total = Decimal("0")

    for item_data in items_data:
        product = db.query(Product).filter(
            Product.id == item_data.product_id, Product.deleted_at.is_(None)
        ).first()
        if product is None:
            raise ProductNotFoundError(f"Product {item_data.product_id} not found")

        line_amount = item_data.purchase_price * item_data.quantity
        gst_amount = line_amount * product.gst_rate / 100
        cgst = gst_amount / 2
        sgst = gst_amount / 2
        line_total = line_amount + gst_amount

        items.append(
            PurchaseItem(
                product_id=product.id,
                quantity=item_data.quantity,
                purchase_price=item_data.purchase_price,
                gst_rate=product.gst_rate,
                cgst=cgst,
                sgst=sgst,
                igst=Decimal("0"),
                total=line_total,
            )
        )
        subtotal += line_amount
        cgst_total += cgst
        sgst_total += sgst

    return items, subtotal, cgst_total, sgst_total, Decimal("0")


def create_purchase(db: Session, data: PurchaseCreate, user_id: uuid.UUID) -> Purchase:
    items, subtotal, cgst, sgst, igst = _build_items(db, data.items)
    total = subtotal + cgst + sgst + igst

    purchase = Purchase(
        supplier_id=data.supplier_id,
        warehouse_id=data.warehouse_id,
        purchase_number=f"PO-{generate_uuid7().hex[:12].upper()}",
        status=PurchaseStatus.DRAFT,
        subtotal=subtotal,
        cgst=cgst,
        sgst=sgst,
        igst=igst,
        total=total,
        created_by=user_id,
        items=items,
    )
    if data.purchase_date is not None:
        purchase.purchase_date = data.purchase_date

    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


<<<<<<< HEAD
def list_purchases(db: Session, page: int, page_size: int) -> tuple[list[Purchase], int]:
    query = (
        db.query(Purchase)
        .filter(Purchase.deleted_at.is_(None))
        .order_by(Purchase.purchase_date.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total
=======
def list_purchases(db: Session) -> list[Purchase]:
    return db.query(Purchase).filter(Purchase.deleted_at.is_(None)).all()
>>>>>>> phase-1


def get_purchase(db: Session, purchase_id: uuid.UUID) -> Purchase | None:
    return db.query(Purchase).filter(
        Purchase.id == purchase_id, Purchase.deleted_at.is_(None)
    ).first()


def update_purchase(
    db: Session, purchase_id: uuid.UUID, data: PurchaseUpdate, user_id: uuid.UUID
) -> Purchase | None:
    purchase = get_purchase(db, purchase_id)
    if purchase is None:
        return None

    if purchase.status != PurchaseStatus.DRAFT:
        raise PurchaseNotEditableError("Only draft purchases can be edited")

    if data.supplier_id is not None:
        purchase.supplier_id = data.supplier_id
    if data.warehouse_id is not None:
        purchase.warehouse_id = data.warehouse_id
    if data.purchase_date is not None:
        purchase.purchase_date = data.purchase_date

    if data.items is not None:
        items, subtotal, cgst, sgst, igst = _build_items(db, data.items)
        purchase.items = items
        purchase.subtotal = subtotal
        purchase.cgst = cgst
        purchase.sgst = sgst
        purchase.igst = igst
        purchase.total = subtotal + cgst + sgst + igst

    purchase.updated_by = user_id
    db.commit()
    db.refresh(purchase)
    return purchase


def receive_purchase(
    db: Session, purchase_id: uuid.UUID, data: PurchaseReceive, user_id: uuid.UUID
) -> Purchase | None:
    purchase = get_purchase(db, purchase_id)
    if purchase is None:
        return None

    if purchase.status != PurchaseStatus.DRAFT:
        raise PurchaseNotReceivableError("Only draft purchases can be received")

    items_by_id = {item.id: item for item in purchase.items}
    for received in data.items:
        item = items_by_id.get(received.item_id)
        if item is None:
            raise ProductNotFoundError(f"Purchase item {received.item_id} not found on this purchase")

        record_movement(
            db,
            warehouse_id=purchase.warehouse_id,
            product_id=item.product_id,
            movement_type=MovementType.PURCHASE_IN,
            quantity=int(received.received_qty),
            reference_type="purchase",
            reference_id=purchase.id,
            user_id=user_id,
        )

    purchase.status = PurchaseStatus.RECEIVED
    purchase.updated_by = user_id
    db.commit()
    db.refresh(purchase)
    return purchase


def cancel_purchase(db: Session, purchase_id: uuid.UUID, user_id: uuid.UUID) -> Purchase | None:
    purchase = get_purchase(db, purchase_id)
    if purchase is None:
        return None

    if purchase.status != PurchaseStatus.DRAFT:
        raise PurchaseNotEditableError("Only draft purchases can be cancelled")

    purchase.status = PurchaseStatus.CANCELLED
    purchase.updated_by = user_id
    db.commit()
    db.refresh(purchase)
    return purchase
