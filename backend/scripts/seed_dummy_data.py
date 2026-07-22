"""Seeds the local dev database with a large, realistic dummy dataset.

Goes through the real service layer (not raw SQL) so the data is exactly what
the app itself would produce: hashed passwords, computed GST splits, stock
movements from purchases/orders/returns, auto-generated order/purchase
numbers, etc. Covers every status value in every lifecycle (orders, invoices,
payments, purchases, returns, credit notes) so every screen has something
real to render.

Step 1 always CLEARS the existing dataset, then inserts the fresh seed.
Re-running always gives the same predictable dataset. Never point this at
anything but your local dev database.

Run with:
    cd backend
    source venv/bin/activate
    python -m scripts.seed_dummy_data

Skip the confirmation prompt with:
    python -m scripts.seed_dummy_data --yes
"""

import sys
from decimal import Decimal

from app.core.config import settings
from app.core.deps import Principal
from app.core.enums import ReturnReason, UserRole, WarehouseStatus
from app.db.session import SessionLocal
import app.models  # noqa: F401 - registers all models on Base.metadata
from app.models.audit_log import AuditLog
from app.models.brand import Brand
from app.models.category import Category
from app.models.credit_note import CreditNote
from app.models.customer import Customer
from app.models.delivery import Delivery
from app.models.inventory import Inventory, InventoryMovement
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.price_list import PriceList, PriceListItem
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.return_ import Return, ReturnItem
from app.models.route import Route
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.supplier import Supplier
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.warehouse import Warehouse
from app.schemas.brand import BrandCreate
from app.schemas.category import CategoryCreate
from app.schemas.customer import CustomerCreate
from app.schemas.delivery import DeliveryCompleteRequest, DeliveryCreate
from app.schemas.payment import PaymentCreate
from app.schemas.price_list import PriceListCreate, PriceListItemCreate
from app.schemas.product import ProductCreate
from app.schemas.purchase import PurchaseCreate, PurchaseItemCreate, PurchaseReceive, PurchaseReceiveItem
from app.schemas.return_ import ReturnCreate, ReturnItemCreate
from app.schemas.route import RouteCreate
from app.schemas.sales_order import (
    SalesOrderApproveItem,
    SalesOrderCreate,
    SalesOrderItemCreate,
    SalesOrderLoadItem,
)
from app.schemas.supplier import SupplierCreate
from app.schemas.user import UserCreate
from app.schemas.vehicle import VehicleCreate
from app.schemas.warehouse import WarehouseCreate
from app.services import brand as brand_service
from app.services import category as category_service
from app.services import credit_note as credit_note_service
from app.services import customer as customer_service
from app.services import delivery as delivery_service
from app.services import invoice as invoice_service
from app.services import payment as payment_service
from app.services import price_list as price_list_service
from app.services import product as product_service
from app.services import purchase as purchase_service
from app.services import return_ as return_service
from app.services import route as route_service
from app.services import sales_order as sales_order_service
from app.services import supplier as supplier_service
from app.services import user as user_service
from app.services import vehicle as vehicle_service
from app.services import warehouse as warehouse_service
from app.services.warehouse import set_warehouse_status

# Deletion order matters - children before parents.
WIPE_ORDER = [
    AuditLog,
    CreditNote,
    ReturnItem,
    Return,
    Payment,
    Delivery,
    Invoice,
    InventoryMovement,
    Inventory,
    SalesOrderItem,
    SalesOrder,
    PurchaseItem,
    Purchase,
    PriceListItem,
    Vehicle,
    Customer,  # before PriceList (price_list_id) and Route (route_id)
    PriceList,
    Product,
    Category,
    Brand,
    Route,
    Warehouse,
    Supplier,
    User,
]

# (key, full_name, mobile, email, role, password)
# Login identifier = email or mobile; password matches the account key.
STAFF_ACCOUNTS = [
    ("admin", "Admin User", "9000000001", "admin@dmsapp.example.in", UserRole.ADMIN, "admin"),
    ("user", "Default User", "9000000002", "user@dmsapp.example.in", UserRole.SALESMAN, "user"),
    ("salesman", "Ravi Kumar", "9000000003", "salesman@dmsapp.example.in", UserRole.SALESMAN, "salesman"),
    ("salesman2", "Anita Sharma", "9000000004", "salesman2@dmsapp.example.in", UserRole.SALESMAN, "salesman2"),
    ("salesman3", "Deepak Mehta", "9000000005", "salesman3@dmsapp.example.in", UserRole.SALESMAN, "salesman3"),
    ("driver", "Suresh Yadav", "9000000006", "driver@dmsapp.example.in", UserRole.DRIVER, "driver"),
    ("driver2", "Mohan Das", "9000000007", "driver2@dmsapp.example.in", UserRole.DRIVER, "driver2"),
    ("driver3", "Raju Patil", "9000000008", "driver3@dmsapp.example.in", UserRole.DRIVER, "driver3"),
    ("manager", "Priya Nair", "9000000009", "manager@dmsapp.example.in", UserRole.MANAGER, "manager"),
    ("dispatcher", "Vikram Singh", "9000000010", "dispatcher@dmsapp.example.in", UserRole.DISPATCHER, "dispatcher"),
    ("cashier", "Neha Joshi", "9000000011", "cashier@dmsapp.example.in", UserRole.CASHIER, "cashier"),
]

CUSTOMER_PASSWORD = "customer"

INDIAN_CITIES = [
    ("Mumbai", "Maharashtra", "400001"),
    ("Pune", "Maharashtra", "411001"),
    ("Nagpur", "Maharashtra", "440001"),
    ("Nashik", "Maharashtra", "422001"),
    ("Bangalore", "Karnataka", "560001"),
    ("Mysore", "Karnataka", "570001"),
    ("Chennai", "Tamil Nadu", "600001"),
    ("Coimbatore", "Tamil Nadu", "641001"),
    ("Hyderabad", "Telangana", "500001"),
    ("Delhi", "Delhi", "110001"),
    ("Gurugram", "Haryana", "122001"),
    ("Jaipur", "Rajasthan", "302001"),
    ("Ahmedabad", "Gujarat", "380001"),
    ("Surat", "Gujarat", "395001"),
    ("Kolkata", "West Bengal", "700001"),
    ("Lucknow", "Uttar Pradesh", "226001"),
    ("Indore", "Madhya Pradesh", "452001"),
    ("Bhopal", "Madhya Pradesh", "462001"),
    ("Chandigarh", "Chandigarh", "160001"),
    ("Kochi", "Kerala", "682001"),
]

SHOP_NAMES = [
    "General Store", "Kirana", "Supermart", "Traders", "Wholesale", "Mart",
    "Enterprises", "Stores", "Provisions", "Depot", "Bazaar", "Corner Shop",
    "Mini Mart", "Family Store", "Daily Needs", "Grocery Hub",
]

OWNER_FIRST = [
    "Ramesh", "Jayesh", "Anil", "Srinivas", "Lakshmi", "Gurpreet", "Bimal",
    "Kiran", "Suresh", "Meena", "Arjun", "Pooja", "Vijay", "Sunita", "Amit",
    "Neha", "Rahul", "Kavita", "Sanjay", "Divya", "Imran", "Fatima", "Rohan",
    "Priya", "Nikhil", "Asha", "Farhan", "Sneha", "Yogesh", "Rekha",
]

OWNER_LAST = [
    "Sharma", "Patel", "Gupta", "Reddy", "Iyer", "Singh", "Das", "Mehta",
    "Khan", "Nair", "Joshi", "Verma", "Rao", "Pillai", "Banerjee", "Chopra",
]


def log(message: str) -> None:
    print(f"  {message}")


def wipe(db) -> None:
    print("Step 1/14: Clearing existing dataset...")
    for model in WIPE_ORDER:
        deleted = db.query(model).delete()
        log(f"{model.__tablename__}: removed {deleted} row(s)")
    db.commit()
    print("  Existing data cleared.\n")


def seed_users(db) -> dict:
    print("Step 2/14: Creating staff accounts...")
    users = {}
    for key, full_name, mobile, email, role, password in STAFF_ACCOUNTS:
        user = user_service.create_user(
            db,
            UserCreate(full_name=full_name, mobile=mobile, email=email, password=password, role=role),
        )
        users[key] = user
        log(f"{key:12} -> {email:35} / password: {password}")
    return users


def seed_warehouses(db) -> dict:
    print("Step 3/14: Creating warehouses...")
    # Only Mumbai stays active so sales-order fulfilment (first active warehouse)
    # stays deterministic and uses the stock we receive there.
    specs = [
        ("mumbai", "Mumbai Central Warehouse", "Plot 12, MIDC, Andheri East", "Maharashtra", True),
        ("pune", "Pune Distribution Hub", "Plot 8, Ranjangaon MIDC", "Maharashtra", False),
        ("bangalore", "Bangalore Warehouse", "44 Industrial Layout, Peenya", "Karnataka", False),
        ("delhi", "Delhi NCR Warehouse", "Sector 15, Okhla Industrial Area", "Delhi", False),
        ("chennai", "Chennai Warehouse", "SIPCOT Industrial Park, Irungattukottai", "Tamil Nadu", False),
    ]
    warehouses = {}
    for key, name, address, state, active in specs:
        wh = warehouse_service.create_warehouse(
            db, WarehouseCreate(name=name, address=address, state=state)
        )
        if not active:
            set_warehouse_status(db, wh.id, WarehouseStatus.INACTIVE)
        warehouses[key] = wh
        log(f"{'active' if active else 'inactive'}: {name} ({state})")
    return warehouses


def seed_suppliers(db) -> list:
    print("Step 4/14: Creating suppliers...")
    specs = [
        ("SUP-001", "Reliable Distributors Pvt Ltd", "9111100001", "Warehouse Road, Bhiwandi, Mumbai"),
        ("SUP-002", "Global FMCG Traders", "9111100002", "Sector 5, Industrial Area, Gurugram"),
        ("SUP-003", "Metro Wholesale Supply", "9111100003", "APMC Market Yard, Pune"),
        ("SUP-004", "Deccan Agro Foods", "9111100004", "MIDC, Aurangabad"),
        ("SUP-005", "Southern Packers & Traders", "9111100005", "Guindy Industrial Estate, Chennai"),
        ("SUP-006", "Eastern Consumer Goods", "9111100006", "Howrah Industrial Belt, Kolkata"),
        ("SUP-007", "North Star Distributors", "9111100007", "GT Road, Ludhiana"),
        ("SUP-008", "Western Edge Wholesale", "9111100008", "Vatva GIDC, Ahmedabad"),
        ("SUP-009", "Coastal Supply Chain", "9111100010", "Mangalore Port Road"),
        ("SUP-010", "Heartland FMCG Hub", "9111100011", "Indore Mandi Road"),
        ("SUP-011", "Prime Retail Partners", "9111100012", "Whitefield, Bangalore"),
        ("SUP-012", "Unity Merchants LLP", "9111100013", "Sanath Nagar, Hyderabad"),
    ]
    suppliers = []
    for code, name, mobile, address in specs:
        supplier = supplier_service.create_supplier(
            db, SupplierCreate(supplier_code=code, name=name, mobile=mobile, address=address)
        )
        suppliers.append(supplier)
        log(name)
    return suppliers


def seed_routes(db, users: dict) -> dict:
    print("Step 5/14: Creating routes...")
    specs = [
        ("route1", "Mumbai South Route", "salesman"),
        ("route2", "Mumbai North Route", "user"),
        ("route3", "Pune City Route", "salesman2"),
        ("route4", "Pune-Nashik Route", "salesman2"),
        ("route5", "Bangalore East Route", "salesman3"),
        ("route6", "Chennai Central Route", "salesman3"),
        ("route7", "Delhi NCR Route", "salesman"),
        ("route8", "Ahmedabad Route", "user"),
    ]
    routes = {}
    for key, name, salesman_key in specs:
        route = route_service.create_route(db, RouteCreate(name=name, salesman_id=users[salesman_key].id))
        routes[key] = route
        log(f"{name} -> {users[salesman_key].full_name}")
    return routes


def seed_categories(db) -> dict:
    print("Step 6/14: Creating categories...")
    beverages = category_service.create_category(db, CategoryCreate(name="Beverages"))
    soft_drinks = category_service.create_category(db, CategoryCreate(name="Soft Drinks", parent_id=beverages.id))
    juices = category_service.create_category(db, CategoryCreate(name="Juices", parent_id=beverages.id))
    snacks = category_service.create_category(db, CategoryCreate(name="Snacks"))
    chips = category_service.create_category(db, CategoryCreate(name="Chips", parent_id=snacks.id))
    biscuits = category_service.create_category(db, CategoryCreate(name="Biscuits", parent_id=snacks.id))
    dairy = category_service.create_category(db, CategoryCreate(name="Dairy"))
    staples = category_service.create_category(db, CategoryCreate(name="Staples"))
    oils = category_service.create_category(db, CategoryCreate(name="Edible Oils", parent_id=staples.id))
    household = category_service.create_category(db, CategoryCreate(name="Household"))
    personal_care = category_service.create_category(db, CategoryCreate(name="Personal Care"))
    oral_care = category_service.create_category(db, CategoryCreate(name="Oral Care", parent_id=personal_care.id))
    confectionery = category_service.create_category(db, CategoryCreate(name="Confectionery"))
    instant_food = category_service.create_category(db, CategoryCreate(name="Instant Food"))

    categories = {
        "soft_drinks": soft_drinks,
        "juices": juices,
        "chips": chips,
        "biscuits": biscuits,
        "snacks": snacks,
        "dairy": dairy,
        "staples": staples,
        "oils": oils,
        "household": household,
        "personal_care": personal_care,
        "oral_care": oral_care,
        "confectionery": confectionery,
        "instant_food": instant_food,
    }
    for c in categories.values():
        log(c.name)
    return categories


def seed_brands(db) -> dict:
    print("Step 7/14: Creating brands...")
    names = [
        "Coca-Cola", "PepsiCo", "Nestle", "Amul", "Britannia", "Parle", "HUL",
        "ITC", "Colgate", "Dabur", "Godrej", "Marico", "Patanjali", "Mondelez",
        "Haldiram", "Mother Dairy", "Sunfeast", "Kissan", "Tropicana", "Bisleri",
    ]
    brands = {}
    for name in names:
        brand = brand_service.create_brand(db, BrandCreate(name=name))
        brands[name] = brand
        log(name)
    return brands


def seed_products(db, categories: dict, brands: dict) -> dict:
    print("Step 8/14: Creating products...")
    # (key, sku, barcode, name, category, brand, unit, packing, mrp, price, gst, min_stock)
    specs = [
        ("coke", "SKU-BEV-001", "8901000000011", "Coca-Cola 500ml", "soft_drinks", "Coca-Cola", "bottle", "12 x 500ml", "40.00", "35.00", "18.00", 50),
        ("coke_1l", "SKU-BEV-002", "8901000000028", "Coca-Cola 1L", "soft_drinks", "Coca-Cola", "bottle", "12 x 1L", "60.00", "52.00", "18.00", 40),
        ("sprite", "SKU-BEV-003", "8901000000035", "Sprite 500ml", "soft_drinks", "Coca-Cola", "bottle", "12 x 500ml", "40.00", "35.00", "18.00", 50),
        ("thums_up", "SKU-BEV-004", "8901000000042", "Thums Up 500ml", "soft_drinks", "Coca-Cola", "bottle", "12 x 500ml", "40.00", "35.00", "18.00", 50),
        ("pepsi", "SKU-BEV-005", "8901000000059", "Pepsi 500ml", "soft_drinks", "PepsiCo", "bottle", "12 x 500ml", "40.00", "34.00", "18.00", 50),
        ("mirinda", "SKU-BEV-006", "8901000000066", "Mirinda Orange 500ml", "soft_drinks", "PepsiCo", "bottle", "12 x 500ml", "40.00", "34.00", "18.00", 40),
        ("7up", "SKU-BEV-007", "8901000000073", "7UP 500ml", "soft_drinks", "PepsiCo", "bottle", "12 x 500ml", "40.00", "34.00", "18.00", 40),
        ("tropicana", "SKU-BEV-008", "8901000000080", "Tropicana Orange 1L", "juices", "Tropicana", "carton", "12 x 1L", "110.00", "95.00", "12.00", 30),
        ("real_juice", "SKU-BEV-009", "8901000000097", "Real Mixed Fruit 1L", "juices", "Dabur", "carton", "12 x 1L", "100.00", "88.00", "12.00", 30),
        ("bisleri", "SKU-BEV-010", "8901000000103", "Bisleri Water 1L", "soft_drinks", "Bisleri", "bottle", "12 x 1L", "20.00", "16.00", "0.00", 100),
        ("lays", "SKU-SNK-001", "8901000000110", "Lay's Classic 52g", "chips", "PepsiCo", "packet", "48 x 52g", "20.00", "18.00", "12.00", 100),
        ("lays_magic", "SKU-SNK-002", "8901000000127", "Lay's Magic Masala 52g", "chips", "PepsiCo", "packet", "48 x 52g", "20.00", "18.00", "12.00", 100),
        ("kurkure", "SKU-SNK-003", "8901000000134", "Kurkure Masala Munch 55g", "chips", "PepsiCo", "packet", "48 x 55g", "20.00", "18.00", "12.00", 100),
        ("uncle_chips", "SKU-SNK-004", "8901000000141", "Uncle Chipps Spicy 55g", "chips", "PepsiCo", "packet", "48 x 55g", "20.00", "18.00", "12.00", 80),
        ("haldiram_bhujia", "SKU-SNK-005", "8901000000158", "Haldiram Bhujia 200g", "snacks", "Haldiram", "packet", "24 x 200g", "55.00", "48.00", "12.00", 60),
        ("haldiram_mixture", "SKU-SNK-006", "8901000000165", "Haldiram Mixture 200g", "snacks", "Haldiram", "packet", "24 x 200g", "55.00", "48.00", "12.00", 60),
        ("parle_g", "SKU-BIS-001", "8901000000172", "Parle-G Biscuit 200g", "biscuits", "Parle", "packet", "96 x 200g", "25.00", "22.00", "5.00", 80),
        ("monaco", "SKU-BIS-002", "8901000000189", "Parle Monaco 200g", "biscuits", "Parle", "packet", "72 x 200g", "30.00", "26.00", "5.00", 70),
        ("good_day", "SKU-BIS-003", "8901000000196", "Britannia Good Day 100g", "biscuits", "Britannia", "packet", "72 x 100g", "30.00", "27.00", "5.00", 80),
        ("marie_gold", "SKU-BIS-004", "8901000000202", "Britannia Marie Gold 250g", "biscuits", "Britannia", "packet", "48 x 250g", "40.00", "35.00", "5.00", 70),
        ("bourbon", "SKU-BIS-005", "8901000000219", "Britannia Bourbon 120g", "biscuits", "Britannia", "packet", "60 x 120g", "35.00", "30.00", "5.00", 60),
        ("sunfeast", "SKU-BIS-006", "8901000000226", "Sunfeast Dark Fantasy 75g", "biscuits", "Sunfeast", "packet", "48 x 75g", "40.00", "35.00", "5.00", 60),
        ("amul_milk", "SKU-DRY-001", "8901000000233", "Amul Milk 500ml", "dairy", "Amul", "pouch", "20 x 500ml", "30.00", "28.00", "0.00", 40),
        ("amul_milk_1l", "SKU-DRY-002", "8901000000240", "Amul Milk 1L", "dairy", "Amul", "pouch", "12 x 1L", "56.00", "52.00", "0.00", 40),
        ("amul_butter", "SKU-DRY-003", "8901000000257", "Amul Butter 500g", "dairy", "Amul", "pack", "24 x 500g", "250.00", "230.00", "12.00", 20),
        ("amul_cheese", "SKU-DRY-004", "8901000000264", "Amul Cheese Slices 200g", "dairy", "Amul", "pack", "24 x 200g", "120.00", "110.00", "12.00", 20),
        ("amul_ghee", "SKU-DRY-005", "8901000000271", "Amul Ghee 1L", "dairy", "Amul", "tin", "12 x 1L", "620.00", "580.00", "12.00", 15),
        ("mother_curd", "SKU-DRY-006", "8901000000288", "Mother Dairy Curd 400g", "dairy", "Mother Dairy", "cup", "24 x 400g", "35.00", "30.00", "0.00", 30),
        ("maggi", "SKU-INS-001", "8901000000295", "Nestle Maggi Noodles 70g", "instant_food", "Nestle", "packet", "72 x 70g", "14.00", "12.00", "12.00", 150),
        ("maggi_4", "SKU-INS-002", "8901000000301", "Nestle Maggi 4-Pack", "instant_food", "Nestle", "pack", "36 x 4", "55.00", "48.00", "12.00", 80),
        ("yippee", "SKU-INS-003", "8901000000318", "Sunfeast Yippee 70g", "instant_food", "Sunfeast", "packet", "72 x 70g", "14.00", "12.00", "12.00", 100),
        ("milkmaid", "SKU-STP-001", "8901000000325", "Nestle Milkmaid 400g", "staples", "Nestle", "tin", "24 x 400g", "90.00", "82.00", "12.00", 30),
        ("atta", "SKU-STP-002", "8901000000332", "Aashirvaad Atta 5kg", "staples", "ITC", "bag", "6 x 5kg", "250.00", "230.00", "5.00", 30),
        ("atta_10", "SKU-STP-003", "8901000000349", "Aashirvaad Atta 10kg", "staples", "ITC", "bag", "4 x 10kg", "480.00", "450.00", "5.00", 20),
        ("rice", "SKU-STP-004", "8901000000356", "India Gate Basmati 1kg", "staples", "ITC", "pack", "20 x 1kg", "180.00", "165.00", "5.00", 40),
        ("sugar", "SKU-STP-005", "8901000000363", "Madhur Sugar 1kg", "staples", "Patanjali", "pack", "20 x 1kg", "48.00", "42.00", "0.00", 50),
        ("salt", "SKU-STP-006", "8901000000370", "Tata Salt 1kg", "staples", "ITC", "pack", "24 x 1kg", "28.00", "24.00", "0.00", 80),
        ("fortune_oil", "SKU-OIL-001", "8901000000387", "Fortune Sunflower Oil 1L", "oils", "ITC", "bottle", "12 x 1L", "160.00", "145.00", "5.00", 40),
        ("saffola", "SKU-OIL-002", "8901000000394", "Saffola Gold 1L", "oils", "Marico", "bottle", "12 x 1L", "210.00", "190.00", "5.00", 30),
        ("parachute", "SKU-OIL-003", "8901000000400", "Parachute Coconut Oil 500ml", "oils", "Marico", "bottle", "24 x 500ml", "230.00", "210.00", "18.00", 40),
        ("surf_excel", "SKU-HH-001", "8901000000417", "Surf Excel 1kg", "household", "HUL", "pack", "12 x 1kg", "180.00", "165.00", "18.00", 25),
        ("surf_excel_5", "SKU-HH-002", "8901000000424", "Surf Excel 5kg", "household", "HUL", "pack", "4 x 5kg", "750.00", "700.00", "18.00", 15),
        ("vim", "SKU-HH-003", "8901000000431", "Vim Dishwash Bar", "household", "HUL", "piece", "100 x 1", "20.00", "18.00", "18.00", 200),
        ("vim_liq", "SKU-HH-004", "8901000000448", "Vim Liquid 500ml", "household", "HUL", "bottle", "24 x 500ml", "110.00", "98.00", "18.00", 40),
        ("lizol", "SKU-HH-005", "8901000000455", "Lizol Floor Cleaner 500ml", "household", "HUL", "bottle", "24 x 500ml", "110.00", "98.00", "18.00", 40),
        ("harpic", "SKU-HH-006", "8901000000462", "Harpic Toilet Cleaner 500ml", "household", "HUL", "bottle", "24 x 500ml", "95.00", "85.00", "18.00", 40),
        ("godrej_aer", "SKU-HH-007", "8901000000479", "Godrej Aer Pocket", "household", "Godrej", "piece", "48 x 1", "55.00", "48.00", "18.00", 50),
        ("dove", "SKU-PC-001", "8901000000486", "Dove Soap 100g", "personal_care", "HUL", "piece", "72 x 100g", "55.00", "50.00", "18.00", 100),
        ("lux", "SKU-PC-002", "8901000000493", "Lux Soap 100g", "personal_care", "HUL", "piece", "72 x 100g", "40.00", "35.00", "18.00", 100),
        ("lifebuoy", "SKU-PC-003", "8901000000509", "Lifebuoy Soap 100g", "personal_care", "HUL", "piece", "72 x 100g", "30.00", "26.00", "18.00", 120),
        ("clinic_plus", "SKU-PC-004", "8901000000516", "Clinic Plus Shampoo 180ml", "personal_care", "HUL", "bottle", "36 x 180ml", "120.00", "105.00", "18.00", 50),
        ("sunsilk", "SKU-PC-005", "8901000000523", "Sunsilk Shampoo 180ml", "personal_care", "HUL", "bottle", "36 x 180ml", "130.00", "115.00", "18.00", 50),
        ("colgate", "SKU-ORL-001", "8901000000530", "Colgate Toothpaste 200g", "oral_care", "Colgate", "tube", "48 x 200g", "150.00", "140.00", "18.00", 60),
        ("colgate_100", "SKU-ORL-002", "8901000000547", "Colgate Toothpaste 100g", "oral_care", "Colgate", "tube", "72 x 100g", "75.00", "68.00", "18.00", 80),
        ("pepsodent", "SKU-ORL-003", "8901000000554", "Pepsodent Toothpaste 150g", "oral_care", "HUL", "tube", "48 x 150g", "95.00", "85.00", "18.00", 60),
        ("closeup", "SKU-ORL-004", "8901000000561", "Closeup Toothpaste 150g", "oral_care", "HUL", "tube", "48 x 150g", "95.00", "85.00", "18.00", 60),
        ("dabur_red", "SKU-ORL-005", "8901000000578", "Dabur Red Toothpaste 200g", "oral_care", "Dabur", "tube", "48 x 200g", "110.00", "98.00", "18.00", 50),
        ("dairy_milk", "SKU-CNF-001", "8901000000585", "Cadbury Dairy Milk 45g", "confectionery", "Mondelez", "bar", "72 x 45g", "40.00", "35.00", "18.00", 100),
        ("5star", "SKU-CNF-002", "8901000000592", "Cadbury 5 Star 40g", "confectionery", "Mondelez", "bar", "72 x 40g", "20.00", "18.00", "18.00", 100),
        ("perk", "SKU-CNF-003", "8901000000608", "Cadbury Perk 28g", "confectionery", "Mondelez", "bar", "96 x 28g", "10.00", "9.00", "18.00", 150),
        ("kissan_jam", "SKU-CNF-004", "8901000000615", "Kissan Mixed Fruit Jam 500g", "confectionery", "Kissan", "jar", "24 x 500g", "160.00", "145.00", "12.00", 30),
        ("patanjali_honey", "SKU-CNF-005", "8901000000622", "Patanjali Honey 500g", "confectionery", "Patanjali", "jar", "24 x 500g", "180.00", "160.00", "5.00", 30),
    ]
    products = {}
    for key, sku, barcode, name, cat_key, brand_key, unit, packing, mrp, price, gst, min_stock in specs:
        product = product_service.create_product(
            db,
            ProductCreate(
                sku=sku,
                barcode=barcode,
                name=name,
                category_id=categories[cat_key].id,
                brand_id=brands[brand_key].id,
                unit=unit,
                packing=packing,
                mrp=Decimal(mrp),
                selling_price=Decimal(price),
                gst_rate=Decimal(gst),
                minimum_stock=min_stock,
            ),
        )
        products[key] = product

    loose_item = product_service.create_product(
        db,
        ProductCreate(
            sku="SKU-MISC-001",
            barcode="8901000000999",
            name="Loose Item - Miscellaneous",
            unit="piece",
            packing="1 x 1",
            mrp=Decimal("10.00"),
            selling_price=Decimal("10.00"),
            gst_rate=Decimal("0.00"),
            minimum_stock=0,
        ),
    )
    products["loose_item"] = loose_item
    log(f"{len(products)} products created")
    return products


def seed_price_lists(db, products: dict) -> dict:
    print("Step 9/14: Creating price lists...")
    wholesale = price_list_service.create_price_list(
        db, PriceListCreate(name="Wholesale", description="10% off select fast-moving items")
    )
    retail = price_list_service.create_price_list(
        db, PriceListCreate(name="Retail", description="Standard pricing, no discount")
    )
    institutional = price_list_service.create_price_list(
        db, PriceListCreate(name="Institutional", description="15% off for bulk institutional buyers")
    )
    premium = price_list_service.create_price_list(
        db, PriceListCreate(name="Premium Retail", description="5% off premium assortment")
    )

    wholesale_keys = [
        "coke", "sprite", "pepsi", "lays", "kurkure", "parle_g", "maggi",
        "atta", "surf_excel", "dove", "colgate", "dairy_milk",
    ]
    for key in wholesale_keys:
        price_list_service.create_price_list_item(
            db, wholesale.id, PriceListItemCreate(product_id=products[key].id, discount_percent=Decimal("10.00"))
        )

    institutional_keys = list(products.keys())[:25]
    for key in institutional_keys:
        if key == "loose_item":
            continue
        price_list_service.create_price_list_item(
            db,
            institutional.id,
            PriceListItemCreate(product_id=products[key].id, discount_percent=Decimal("15.00")),
        )

    premium_keys = ["tropicana", "amul_ghee", "saffola", "surf_excel_5", "sunsilk", "dairy_milk"]
    for key in premium_keys:
        price_list_service.create_price_list_item(
            db, premium.id, PriceListItemCreate(product_id=products[key].id, discount_percent=Decimal("5.00"))
        )

    log(f"{wholesale.name}: 10% off {len(wholesale_keys)} products")
    log(f"{retail.name}: no items (base price)")
    log(f"{institutional.name}: 15% off ~{len(institutional_keys)} products")
    log(f"{premium.name}: 5% off {len(premium_keys)} products")
    return {
        "wholesale": wholesale,
        "retail": retail,
        "institutional": institutional,
        "premium": premium,
    }


def seed_customers(db, routes: dict, price_lists: dict) -> tuple[dict, dict]:
    """Returns (customers, customers_by_salesman_key).

    Salesmen may only place orders for customers on their own routes, so we
    also return a salesman_key -> [customer_key] map for order seeding.
    """
    print("Step 10/14: Creating customers...")
    # (route_key, salesman_key) — must match seed_routes.
    route_salesmen = [
        ("route1", "salesman"),
        ("route2", "user"),
        ("route3", "salesman2"),
        ("route4", "salesman2"),
        ("route5", "salesman3"),
        ("route6", "salesman3"),
        ("route7", "salesman"),
        ("route8", "user"),
    ]
    pl_keys = ["wholesale", "retail", "institutional", "premium", None]
    customers = {}
    customers_by_salesman = {key: [] for key in ["salesman", "salesman2", "salesman3", "user"]}
    self_order_customers = []

    for i in range(1, 41):
        city, state, pincode = INDIAN_CITIES[(i - 1) % len(INDIAN_CITIES)]
        shop = SHOP_NAMES[(i - 1) % len(SHOP_NAMES)]
        first = OWNER_FIRST[(i - 1) % len(OWNER_FIRST)]
        last = OWNER_LAST[(i - 1) % len(OWNER_LAST)]
        business = f"{last} {shop}"
        owner = f"{first} {last}"
        code = f"CUST-{i:03d}"
        mobile = f"98000{i:05d}"
        # Every 5th customer has no route (self-order only).
        if i % 5 == 0:
            route_key, salesman_key = None, None
        else:
            route_key, salesman_key = route_salesmen[(i - 1) % len(route_salesmen)]
        pl_key = pl_keys[(i - 1) % len(pl_keys)]
        credit_limit = Decimal(str(15000 + (i % 10) * 10000))
        terms = [7, 15, 30, 45][(i - 1) % 4]
        customer_key = f"c{i}"

        customer = customer_service.create_customer(
            db,
            CustomerCreate(
                customer_code=code,
                business_name=business,
                owner_name=owner,
                mobile=mobile,
                address=f"{10 + i} Market Road, Sector {(i % 12) + 1}",
                city=city,
                state=state,
                pincode=pincode,
                credit_limit=credit_limit,
                payment_terms=terms,
                route_id=routes[route_key].id if route_key else None,
                price_list_id=price_lists[pl_key].id if pl_key else None,
                password=CUSTOMER_PASSWORD,
            ),
        )
        customers[customer_key] = customer
        if salesman_key:
            customers_by_salesman[salesman_key].append(customer_key)
        else:
            self_order_customers.append(customer_key)

    customers_by_salesman["self"] = self_order_customers
    log(f"{len(customers)} customers created (password for all: {CUSTOMER_PASSWORD})")
    log("sample logins: 9800000001 / customer, 9800000005 / customer, ...")
    return customers, customers_by_salesman


def seed_vehicles(db, users: dict, warehouses: dict) -> dict:
    print("Step 11/14: Creating vehicles...")
    specs = [
        ("v1", "MH-01-AB-1234", "driver", "mumbai", "2.5"),
        ("v2", "MH-02-CD-5678", "driver2", "mumbai", "5.0"),
        ("v3", "MH-12-EF-9012", "driver3", "pune", "3.5"),
        ("v4", "MH-14-GH-3456", None, "pune", "4.0"),
        ("v5", "KA-05-IJ-7890", None, "bangalore", "3.0"),
        ("v6", "DL-01-KL-2345", None, "delhi", "4.5"),
        ("v7", "TN-09-MN-6789", None, "chennai", "2.0"),
        ("v8", "MH-04-OP-0123", "driver", "mumbai", "6.0"),
    ]
    vehicles = {}
    for key, number, driver_key, wh_key, capacity in specs:
        vehicle = vehicle_service.create_vehicle(
            db,
            VehicleCreate(
                vehicle_number=number,
                driver_id=users[driver_key].id if driver_key else None,
                warehouse_id=warehouses[wh_key].id,
                capacity=Decimal(capacity),
            ),
        )
        vehicles[key] = vehicle
        log(f"{number} ({vehicle.status})")
    return vehicles


def seed_purchases(db, users: dict, suppliers: list, warehouses: dict, products: dict) -> None:
    print("Step 12/14: Creating purchases...")
    admin_id = users["admin"].id
    product_keys = [k for k in products.keys() if k != "loose_item"]
    mumbai = warehouses["mumbai"]
    pune = warehouses["pune"]

    # Large received purchases to stock Mumbai and Pune.
    batches = [
        (suppliers[0], mumbai, product_keys[0:12], Decimal("400")),
        (suppliers[1], mumbai, product_keys[12:24], Decimal("350")),
        (suppliers[2], mumbai, product_keys[24:36], Decimal("300")),
        (suppliers[3], mumbai, product_keys[36:48], Decimal("250")),
        (suppliers[4], mumbai, product_keys[48:], Decimal("200")),
        (suppliers[5], pune, product_keys[0:15], Decimal("200")),
        (suppliers[6], pune, product_keys[15:30], Decimal("180")),
        (suppliers[7], pune, product_keys[30:45], Decimal("160")),
    ]

    for idx, (supplier, warehouse, keys, qty) in enumerate(batches, start=1):
        items = [
            PurchaseItemCreate(
                product_id=products[key].id,
                quantity=qty,
                purchase_price=(products[key].selling_price * Decimal("0.80")).quantize(Decimal("0.01")),
            )
            for key in keys
        ]
        purchase = purchase_service.create_purchase(
            db,
            PurchaseCreate(supplier_id=supplier.id, warehouse_id=warehouse.id, items=items),
            admin_id,
        )
        purchase_service.receive_purchase(
            db,
            purchase.id,
            PurchaseReceive(
                items=[PurchaseReceiveItem(item_id=item.id, received_qty=item.quantity) for item in purchase.items]
            ),
            admin_id,
        )
        log(f"{purchase.purchase_number}: received ({len(items)} lines) @ {warehouse.name}")

    # A few draft / not-received purchases for UI coverage.
    for supplier, warehouse, key in [
        (suppliers[8], mumbai, "coke"),
        (suppliers[9], pune, "maggi"),
        (suppliers[10], mumbai, "atta"),
    ]:
        purchase = purchase_service.create_purchase(
            db,
            PurchaseCreate(
                supplier_id=supplier.id,
                warehouse_id=warehouse.id,
                items=[
                    PurchaseItemCreate(
                        product_id=products[key].id,
                        quantity=Decimal("100"),
                        purchase_price=Decimal("20.00"),
                    )
                ],
            ),
            admin_id,
        )
        log(f"{purchase.purchase_number}: left as draft")


def _place_order(db, principal: Principal, customer_id, items: list, remarks: str) -> SalesOrder:
    return sales_order_service.create_sales_order(
        db,
        SalesOrderCreate(
            customer_id=customer_id,
            remarks=remarks,
            items=[SalesOrderItemCreate(product_id=pid, ordered_qty=Decimal(qty)) for pid, qty in items],
        ),
        principal,
    )


def _approve_and_load(db, order: SalesOrder, staff_id, load_too: bool = True) -> SalesOrder:
    order = sales_order_service.approve_sales_order(
        db,
        order.id,
        [SalesOrderApproveItem(item_id=item.id, approved_qty=item.ordered_qty) for item in order.items],
        approved_by=staff_id,
    )
    if load_too:
        order = sales_order_service.load_sales_order(
            db,
            order.id,
            [SalesOrderLoadItem(item_id=item.id, loaded_qty=item.approved_qty) for item in order.items],
            loaded_by=staff_id,
        )
    return order


def _deliver_order(db, order: SalesOrder, invoice: Invoice, vehicle_id, driver_id, cash_fraction: Decimal) -> Delivery:
    delivery = delivery_service.create_delivery(
        db, DeliveryCreate(invoice_id=invoice.id, vehicle_id=vehicle_id, driver_id=driver_id)
    )
    delivery_service.start_delivery(db, delivery.id, None)
    delivery_service.mark_arrived(db, delivery.id, Decimal("19.0760"), Decimal("72.8777"))
    delivery, _payment, _status = delivery_service.complete_delivery(
        db,
        delivery.id,
        DeliveryCompleteRequest(
            status="delivered",
            latitude=Decimal("19.0760"),
            longitude=Decimal("72.8777"),
            remarks="Delivered to shop, signed by owner.",
            cash_received=(invoice.total * cash_fraction).quantize(Decimal("0.01")),
            upi_received=Decimal("0"),
        ),
    )
    return delivery


def seed_sales_orders(db, users: dict, customers: dict, customers_by_salesman: dict, products: dict) -> dict:
    print("Step 13/14: Creating sales orders, invoices, payments, deliveries, returns...")
    salesman = Principal(type="user", user=users["salesman"])
    salesman2 = Principal(type="user", user=users["salesman2"])
    salesman3 = Principal(type="user", user=users["salesman3"])
    user_principal = Principal(type="user", user=users["user"])

    def as_customer(customer):
        return Principal(type="customer", customer=customer)

    def pick_customer(salesman_key: str, index: int = 0):
        keys = customers_by_salesman[salesman_key]
        return customers[keys[index % len(keys)]]

    product_list = [p for k, p in products.items() if k != "loose_item"]
    orders = {}

    # --- Lifecycle coverage orders ---
    # salesman owns route1/route7 customers; user owns route2/route8; etc.
    c_salesman_a = pick_customer("salesman", 0)
    c_salesman_b = pick_customer("salesman", 1)
    c_user = pick_customer("user", 0)
    c_salesman2 = pick_customer("salesman2", 0)
    c_self_a = customers[customers_by_salesman["self"][0]]
    c_self_b = customers[customers_by_salesman["self"][1]]
    c_self_c = customers[customers_by_salesman["self"][2]]

    orders["pending_1"] = _place_order(
        db, salesman, c_salesman_a.id,
        [(products["coke"].id, 24), (products["lays"].id, 10)], "Regular weekly order",
    )
    orders["pending_2"] = _place_order(
        db, as_customer(c_self_a), None,
        [(products["parle_g"].id, 20), (products["maggi"].id, 15)], "Self-placed order via app",
    )
    orders["pending_3"] = _place_order(
        db, user_principal, c_user.id,
        [(products["atta"].id, 8), (products["sugar"].id, 10)], "Follow-up order",
    )

    orders["approved_1"] = _place_order(
        db, salesman, c_salesman_b.id,
        [(products["amul_milk"].id, 30), (products["amul_butter"].id, 10)], "",
    )
    orders["approved_1"] = _approve_and_load(db, orders["approved_1"], users["salesman"].id, load_too=False)

    orders["approved_2"] = _place_order(
        db, as_customer(c_self_b), None,
        [(products["surf_excel"].id, 15), (products["vim"].id, 30)], "",
    )
    orders["approved_2"] = _approve_and_load(db, orders["approved_2"], users["admin"].id, load_too=False)

    orders["loaded_1"] = _place_order(
        db, salesman2, c_salesman2.id,
        [(products["atta"].id, 20), (products["dove"].id, 25)], "",
    )
    orders["loaded_1"] = _approve_and_load(db, orders["loaded_1"], users["salesman2"].id)

    orders["loaded_2"] = _place_order(
        db, as_customer(c_self_c), None,
        [(products["colgate"].id, 20), (products["good_day"].id, 15)], "",
    )
    orders["loaded_2"] = _approve_and_load(db, orders["loaded_2"], users["admin"].id)

    orders["deliver_1"] = _place_order(
        db, salesman, c_salesman_a.id,
        [(products["pepsi"].id, 24), (products["kurkure"].id, 20)], "",
    )
    orders["deliver_1"] = _approve_and_load(db, orders["deliver_1"], users["salesman"].id)

    orders["deliver_2"] = _place_order(
        db, as_customer(c_self_a), None,
        [(products["milkmaid"].id, 10), (products["amul_cheese"].id, 8)], "",
    )
    orders["deliver_2"] = _approve_and_load(db, orders["deliver_2"], users["admin"].id)

    orders["deliver_3"] = _place_order(
        db, salesman, c_salesman_b.id,
        [(products["coke"].id, 12), (products["sprite"].id, 12)], "",
    )
    orders["deliver_3"] = _approve_and_load(db, orders["deliver_3"], users["salesman"].id)

    orders["cancelled_1"] = _place_order(
        db, salesman, c_salesman_a.id, [(products["vim"].id, 10)], ""
    )
    orders["cancelled_1"] = sales_order_service.cancel_sales_order(db, orders["cancelled_1"].id, salesman)

    # Bulk extra orders across statuses for volume — always respect route ownership.
    staff_keys = ["salesman", "salesman2", "salesman3", "user"]
    staff_principals = {
        "salesman": salesman,
        "salesman2": salesman2,
        "salesman3": salesman3,
        "user": user_principal,
    }
    for i in range(1, 31):
        p1 = product_list[i % len(product_list)]
        p2 = product_list[(i * 3) % len(product_list)]
        items = [(p1.id, 5 + (i % 10)), (p2.id, 3 + (i % 8))]

        if i % 4 == 0:
            customer = customers[customers_by_salesman["self"][i % len(customers_by_salesman["self"])]]
            principal = as_customer(customer)
            customer_id = None
        else:
            salesman_key = staff_keys[i % len(staff_keys)]
            principal = staff_principals[salesman_key]
            customer = pick_customer(salesman_key, i)
            customer_id = customer.id

        order = _place_order(db, principal, customer_id, items, f"Bulk seed order #{i}")

        if i % 5 == 0:
            order = sales_order_service.cancel_sales_order(db, order.id, principal)
            orders[f"bulk_cancelled_{i}"] = order
        elif i % 5 == 1:
            orders[f"bulk_pending_{i}"] = order
        elif i % 5 == 2:
            orders[f"bulk_approved_{i}"] = _approve_and_load(db, order, users["admin"].id, load_too=False)
        else:
            orders[f"bulk_loaded_{i}"] = _approve_and_load(db, order, users["admin"].id)

    log(f"{len(orders)} orders created across pending/approved/loaded/cancelled")
    return orders


def seed_invoices_payments_deliveries(db, orders: dict, users: dict, vehicles: dict) -> dict:
    invoices = {}

    invoices["approved_1"] = invoice_service.generate_invoice(db, orders["approved_1"].id)
    log(f"{invoices['approved_1'].invoice_number}: unpaid, no delivery yet")

    invoices["loaded_1"] = invoice_service.generate_invoice(db, orders["loaded_1"].id)
    half = (invoices["loaded_1"].total / 2).quantize(Decimal("0.01"))
    payment = payment_service.record_payment(
        db,
        PaymentCreate(invoice_id=invoices["loaded_1"].id, cash_amount=half, reference_number="MANUAL-ADV-001"),
        created_by=users["cashier"].id,
    )
    payment_service.verify_payment(db, payment.id)
    log(f"{invoices['loaded_1'].invoice_number}: partially paid via manual record + verify")

    invoices["deliver_1"] = invoice_service.generate_invoice(db, orders["deliver_1"].id)
    _deliver_order(db, orders["deliver_1"], invoices["deliver_1"], vehicles["v1"].id, users["driver"].id, Decimal("1"))
    log(f"{invoices['deliver_1'].invoice_number}: delivered, fully paid")

    invoices["deliver_2"] = invoice_service.generate_invoice(db, orders["deliver_2"].id)
    _deliver_order(db, orders["deliver_2"], invoices["deliver_2"], vehicles["v2"].id, users["driver2"].id, Decimal("0.6"))
    log(f"{invoices['deliver_2'].invoice_number}: delivered, partially paid")

    invoices["deliver_3"] = invoice_service.generate_invoice(db, orders["deliver_3"].id)
    _deliver_order(db, orders["deliver_3"], invoices["deliver_3"], vehicles["v1"].id, users["driver"].id, Decimal("1"))
    log(f"{invoices['deliver_3'].invoice_number}: delivered, fully paid")

    # Extra invoices + deliveries from bulk loaded orders.
    bulk_loaded = [k for k in orders if k.startswith("bulk_loaded_")]
    drivers = [("v1", "driver"), ("v2", "driver2"), ("v3", "driver3"), ("v8", "driver")]
    for idx, key in enumerate(bulk_loaded[:12]):
        invoice = invoice_service.generate_invoice(db, orders[key].id)
        invoices[key] = invoice
        if idx < 8:
            vehicle_key, driver_key = drivers[idx % len(drivers)]
            fraction = Decimal("1") if idx % 2 == 0 else Decimal("0.5")
            _deliver_order(
                db, orders[key], invoice, vehicles[vehicle_key].id, users[driver_key].id, fraction
            )
            log(f"{invoice.invoice_number}: delivered ({'full' if fraction == 1 else 'partial'} pay)")
        elif idx < 10:
            half = (invoice.total / 2).quantize(Decimal("0.01"))
            payment = payment_service.record_payment(
                db,
                PaymentCreate(
                    invoice_id=invoice.id,
                    cash_amount=half,
                    reference_number=f"MANUAL-ADV-{idx:03d}",
                ),
                created_by=users["cashier"].id,
            )
            payment_service.verify_payment(db, payment.id)
            log(f"{invoice.invoice_number}: partial manual payment")
        else:
            log(f"{invoice.invoice_number}: unpaid")

    return invoices


def seed_returns_and_credit_notes(db, invoices: dict, warehouses: dict, users: dict, products: dict) -> None:
    admin = users["admin"]
    wh_id = warehouses["mumbai"].id

    return_service.create_return(
        db,
        ReturnCreate(
            invoice_id=invoices["deliver_2"].id,
            warehouse_id=wh_id,
            reason=ReturnReason.NOT_NEEDED,
            remarks="Customer over-ordered",
            items=[ReturnItemCreate(product_id=products["milkmaid"].id, quantity=Decimal("2"), reason=ReturnReason.NOT_NEEDED)],
        ),
        created_by=admin.id,
    )
    log(f"return on {invoices['deliver_2'].invoice_number}: requested")

    r2 = return_service.create_return(
        db,
        ReturnCreate(
            invoice_id=invoices["deliver_1"].id,
            warehouse_id=wh_id,
            reason=ReturnReason.DAMAGED,
            remarks="Crushed packets",
            items=[ReturnItemCreate(product_id=products["kurkure"].id, quantity=Decimal("5"), reason=ReturnReason.DAMAGED)],
        ),
        created_by=admin.id,
    )
    return_service.approve_return(db, r2.id)
    log(f"return on {invoices['deliver_1'].invoice_number}: approved")

    r3 = return_service.create_return(
        db,
        ReturnCreate(
            invoice_id=invoices["deliver_1"].id,
            warehouse_id=wh_id,
            reason=ReturnReason.EXPIRED,
            remarks="Claimed expired",
            items=[ReturnItemCreate(product_id=products["pepsi"].id, quantity=Decimal("2"), reason=ReturnReason.EXPIRED)],
        ),
        created_by=admin.id,
    )
    return_service.reject_return(db, r3.id, "Photo evidence did not show an expiry date")
    log(f"return on {invoices['deliver_1'].invoice_number}: rejected")

    r4 = return_service.create_return(
        db,
        ReturnCreate(
            invoice_id=invoices["deliver_3"].id,
            warehouse_id=wh_id,
            reason=ReturnReason.WRONG_ITEM,
            remarks="Wrong flavour delivered",
            items=[ReturnItemCreate(product_id=products["sprite"].id, quantity=Decimal("3"), reason=ReturnReason.WRONG_ITEM)],
        ),
        created_by=admin.id,
    )
    return_service.approve_return(db, r4.id)
    _, _, credit_note_4 = return_service.complete_return(db, r4.id, completed_by=admin.id)
    log(f"return on {invoices['deliver_3'].invoice_number}: completed, credit note pending ({credit_note_4.amount})")

    r5 = return_service.create_return(
        db,
        ReturnCreate(
            invoice_id=invoices["deliver_3"].id,
            warehouse_id=wh_id,
            reason=ReturnReason.NOT_NEEDED,
            remarks="Duplicate order line",
            items=[ReturnItemCreate(product_id=products["coke"].id, quantity=Decimal("2"), reason=ReturnReason.NOT_NEEDED)],
        ),
        created_by=admin.id,
    )
    return_service.approve_return(db, r5.id)
    _, _, credit_note_5 = return_service.complete_return(db, r5.id, completed_by=admin.id)
    credit_note_service.approve_credit_note(db, credit_note_5.id, admin)
    log(f"return on {invoices['deliver_3'].invoice_number}: completed, credit note approved")

    r6 = return_service.create_return(
        db,
        ReturnCreate(
            invoice_id=invoices["deliver_2"].id,
            warehouse_id=wh_id,
            reason=ReturnReason.DAMAGED,
            remarks="Torn packaging",
            items=[ReturnItemCreate(product_id=products["amul_cheese"].id, quantity=Decimal("2"), reason=ReturnReason.DAMAGED)],
        ),
        created_by=admin.id,
    )
    return_service.approve_return(db, r6.id)
    _, _, credit_note_6 = return_service.complete_return(db, r6.id, completed_by=admin.id)
    credit_note_service.reject_credit_note(db, credit_note_6.id, admin)
    log(f"return on {invoices['deliver_2'].invoice_number}: completed, credit note rejected")


def seed_audit_log(db, users: dict, products: dict, warehouses: dict) -> None:
    print("Step 14/14: Adding audit log entries...")
    entries = [
        (users["admin"].id, "create", "warehouses", warehouses["mumbai"].id, {"name": warehouses["mumbai"].name}),
        (users["admin"].id, "create", "products", products["coke"].id, {"sku": products["coke"].sku}),
        (users["salesman"].id, "approve", "sales_orders", None, {"note": "approved pending order"}),
        (users["cashier"].id, "verify", "payments", None, {"note": "verified manual payment"}),
        (users["admin"].id, "approve", "credit_notes", None, {"note": "approved customer credit note"}),
        (users["manager"].id, "update", "price_lists", None, {"note": "reviewed wholesale discounts"}),
        (users["dispatcher"].id, "assign", "deliveries", None, {"note": "assigned vehicles for route"}),
        (users["user"].id, "create", "sales_orders", None, {"note": "created follow-up order"}),
    ]
    for user_id, action, entity_type, entity_id, new_values in entries:
        db.add(
            AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                new_values=new_values,
            )
        )
    db.commit()
    log(f"{len(entries)} audit log entries")


def print_credentials() -> None:
    print("\n" + "=" * 72)
    print("Seed complete. Login credentials:")
    print("=" * 72)
    print("\nStaff (identifier = email or mobile):")
    for key, _name, mobile, email, role, password in STAFF_ACCOUNTS:
        print(f"  {key:12}  {email:35}  mobile {mobile}  password: {password}  [{role.value}]")
    print("\nCustomers (identifier = mobile):")
    print(f"  password for every customer: {CUSTOMER_PASSWORD}")
    print("  e.g. 9800000001 / customer, 9800000005 / customer, 9800000020 / customer")
    print("=" * 72)


def main() -> None:
    if "test" in settings.database_url or "prod" in settings.database_url:
        print(f"Refusing to run against {settings.database_url!r} - point this at your local dev DB only.")
        sys.exit(1)

    print(f"Target database: {settings.database_url}")
    print("This script will CLEAR all existing data, then insert a fresh seed dataset.")
    if "--yes" not in sys.argv:
        confirm = input("Type 'yes' to continue: ")
        if confirm.strip().lower() != "yes":
            print("Aborted.")
            sys.exit(1)

    db = SessionLocal()
    try:
        wipe(db)
        users = seed_users(db)
        warehouses = seed_warehouses(db)
        suppliers = seed_suppliers(db)
        routes = seed_routes(db, users)
        categories = seed_categories(db)
        brands = seed_brands(db)
        products = seed_products(db, categories, brands)
        price_lists = seed_price_lists(db, products)
        customers, customers_by_salesman = seed_customers(db, routes, price_lists)
        vehicles = seed_vehicles(db, users, warehouses)
        seed_purchases(db, users, suppliers, warehouses, products)
        orders = seed_sales_orders(db, users, customers, customers_by_salesman, products)
        invoices = seed_invoices_payments_deliveries(db, orders, users, vehicles)
        seed_returns_and_credit_notes(db, invoices, warehouses, users, products)
        seed_audit_log(db, users, products, warehouses)
    finally:
        db.close()

    print_credentials()


if __name__ == "__main__":
    main()
