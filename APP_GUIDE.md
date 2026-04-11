# 📦 Inventory Management System - User Guide & Walkthrough

Welcome to the **Inventory Management System**. This guide provides a comprehensive walkthrough of the application's features, role-based access, and operational workflows.

---

1. Getting Started & Authentication

### Login
1. Navigate to the login page.
2. Enter your email and password.
3. Upon successful login, you will be redirected to your specific **Dashboard** based on your role.

### Role-Based Access Control (RBAC)
The system uses four main roles:
- **SUPER_ADMIN**: Full system access, including permission overrides and audit logs.
- **ADMIN**: Manage everything from products to employees and permissions.
- **MANAGER**: Full operational access (inventory, sales, purchases) but limited system configuration.
- **SELLER**: Access to POS, Sales Dashboard, and product viewing.

---

## 📊 2. Dashboards

There are three specialized dashboards:
- **Admin Dashboard**: High-level overview of revenue, expenses, and system stats.
- **Manager Dashboard**: Focuses on stock levels, daily sales, and operational efficiency.
- **Seller Dashboard**: Quick links to POS, personal sales stats, and low-stock alerts.

---

## 🍎 3. Inventory Management

### Product Management
- **Add New Product**: Go to `Products > New Product`. You can define the SKU, category, unit, and attributes.
- **Variants**: Create multiple variants (e.g., Size: M, Color: Red) for a single product. Each variant has its own stock tracking and pricing.
- **Attributes**: Manage standard attributes like Size, Color, or Material under `Products > Attributes`.

### Categories & Units
- **Categories**: Organize products into logical groups (e.g., Electronics, Apparel).
- **Units**: Define measurement units (e.g., Pcs, Kg, Box) under `Products > Units`.

### Stock Tracking
- **Stock Movement**: Every sale or purchase automatically updates stock levels.
- **Manual Adjustment**: (Admin/Manager only) Manually adjust stock for damages, returns, or corrections.
- **Low Stock Alerts**: Real-time alerts when variants fall below their `Reorder Level`.

---

## 💰 4. Sales & POS

### POS (Point of Sale)
- **Fast Checkout**: Use the POS interface for quick sales.
- **Barcode Scanning**: Supports USB/Bluetooth barcode scanners for rapid item lookup.
- **Customer Selection**: Link sales to existing customers or create new ones on the fly.

### Orders, Invoices & Quotations
- **Orders**: View and manage all sales history.
- **Invoices**: Generate professional PDF invoices for every completed sale.
- **Quotations**: Create and send quotes to customers. These can be converted into Orders with one click once accepted.

---

## 🛒 5. Purchase & Suppliers

- **Supplier Directory**: Manage your network of suppliers, including contact info and product history.
- **Purchase Orders**: Standardize your ordering process. Create POs, track delivery status, and automatically update stock upon receipt.

---

## 💸 6. Expense Tracking

- **Categories**: Group expenses (e.g., Rent, Utilities, Salaries).
- **Records**: Log every business cost to maintain an accurate Net Revenue calculation on the Dashboard.

---

## 👥 7. Employee & Permissions

- **Employee List**: Manage your staff, assign roles, and activate/deactivate accounts.
- **Permission Groups**: Define specific permission sets and assign them to roles or individual users.
- **Audit Logs**: (Admin only) Track every sensitive action (permission changes, stock adjustments) for full accountability.

---

## 🛡 8. Troubleshooting & FAQ

- **"Permission Denied"**: Ensure your role has the necessary permissions for the resource (User, Product, Sale, etc.).
- **Missing Stock**: Check the `Stock Movements` log to see where items were allocated.
- **PDF Generation**: Ensure your browser allows pop-ups if the invoice preview doesn't appear.

---
*Last Updated: April 2026*
