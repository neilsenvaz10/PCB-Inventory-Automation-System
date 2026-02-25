# PCB Component Inventory Management System

A full-stack web application for managing PCB (Printed Circuit Board) component inventory, Bill of Materials (BOM), production tracking, and procurement insights — built for manufacturing operations teams.

---

## Tech Stack

| Layer           | Technology                                |
| --------------- | ----------------------------------------- |
| **Frontend**    | React 18, React Router v6, ExcelJS, Axios |
| **Backend**     | Node.js, Express.js, express-validator    |
| **Database**    | PostgreSQL                                |
| **Auth**        | JWT (jsonwebtoken + bcrypt)               |
| **File Upload** | Multer (Excel .xlsx)                      |
| **Styling**     | Vanilla CSS (custom design system)        |

---

## Project Structure

```
JR-50-Invictus/
├── pcb-frontend/              # React SPA
│   ├── src/
│   │   ├── api.js             # Centralized API helper (fetch + field mappers)
│   │   ├── api/apiClient.js   # Axios instance with JWT interceptors
│   │   ├── components/        # Navbar, Sidebar, ProtectedRoute
│   │   ├── pages/             # Dashboard, Inventory, Production, PCBMapping, etc.
│   │   └── index.css          # Global styles
│   └── package.json
│
├── pcb-inventory-backend/     # Express API
│   ├── config/db.js           # PostgreSQL pool
│   ├── controllers/           # Business logic
│   ├── middleware/             # authMiddleware, validate, errorHandler
│   ├── routes/                # Route definitions
│   ├── sql/schema.sql         # Database schema
│   ├── .env                   # Environment variables
│   └── server.js              # Entry point (auto-schema init + health check)
│
└── README.md
```

---

## Backend Setup

### Prerequisites

- Node.js ≥ 16
- PostgreSQL ≥ 13

### Installation

```bash
cd pcb-inventory-backend
npm install
```

### Database

Create the database in PostgreSQL:

```sql
CREATE DATABASE pcb_inventory;
```

The schema is auto-initialized on first startup — if the `components` table doesn't exist, `server.js` will execute `sql/schema.sql` automatically.

### Start Server

```bash
node server.js
```

Server runs on **http://localhost:5000** by default.

---

## Frontend Setup

### Installation

```bash
cd pcb-frontend
npm install
```

### Start Dev Server

```bash
npm start
```

Frontend runs on **http://localhost:3000** and proxies API calls to port 5000.

### Default Login

| Email                | Password   |
| -------------------- | ---------- |
| `admin@invictus.com` | `admin123` |

---

## Environment Variables

Create a `.env` file in `pcb-inventory-backend/`:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pcb_inventory
JWT_SECRET=your_jwt_secret
```

---

## API Endpoints

### Health & Root

| Method | Endpoint  | Auth | Description              |
| ------ | --------- | ---- | ------------------------ |
| `GET`  | `/`       | ✗    | Server status            |
| `GET`  | `/health` | ✗    | DB connectivity + uptime |

### Authentication

| Method | Endpoint      | Auth | Description               |
| ------ | ------------- | ---- | ------------------------- |
| `POST` | `/auth/login` | ✗    | Login → returns JWT token |

### Components

| Method   | Endpoint          | Auth | Description         |
| -------- | ----------------- | ---- | ------------------- |
| `GET`    | `/components`     | ✓    | List all components |
| `POST`   | `/components`     | ✓    | Add a component     |
| `PUT`    | `/components/:id` | ✓    | Update a component  |
| `DELETE` | `/components/:id` | ✓    | Delete a component  |

### PCBs & BOM

| Method   | Endpoint               | Auth | Description               |
| -------- | ---------------------- | ---- | ------------------------- |
| `GET`    | `/pcbs`                | ✓    | List all PCBs with BOM    |
| `POST`   | `/pcbs`                | ✓    | Create a PCB              |
| `DELETE` | `/pcbs/:id`            | ✓    | Delete a PCB + its BOM    |
| `POST`   | `/pcbs/:id/bom`        | ✓    | Add component to BOM      |
| `PUT`    | `/pcbs/:id/bom/:rowId` | ✓    | Update BOM row quantity   |
| `DELETE` | `/pcbs/:id/bom/:rowId` | ✓    | Remove component from BOM |

### Production

| Method | Endpoint          | Auth | Description                                |
| ------ | ----------------- | ---- | ------------------------------------------ |
| `GET`  | `/production`     | ✓    | Production history                         |
| `POST` | `/production/add` | ✓    | Record production (atomic stock deduction) |

### Analytics

| Method | Endpoint                  | Auth | Description                |
| ------ | ------------------------- | ---- | -------------------------- |
| `GET`  | `/analytics/low-stock`    | ✓    | Components below threshold |
| `GET`  | `/analytics/top-consumed` | ✓    | Most consumed components   |

### Excel Import

| Method | Endpoint                   | Auth | Description                     |
| ------ | -------------------------- | ---- | ------------------------------- |
| `POST` | `/excel/import-components` | ✓    | Bulk import components (.xlsx)  |
| `POST` | `/excel/import-bom`        | ✓    | Bulk import BOM mapping (.xlsx) |

---

## Excel Import Workflow

### Component Import

1. Prepare an `.xlsx` file with columns: **Name**, **Part Number**, **Category**, **Current Stock**, **Monthly Required**
2. Navigate to **Import** page in the frontend
3. Upload the file → auto-maps columns → preview data → confirm import
4. Backend upserts components into the database

### BOM Import

1. Prepare an `.xlsx` file with columns: **PCB Name**, **Component Part Number**, **Quantity Required**
2. Upload via `POST /excel/import-bom`
3. Backend links components to PCBs in the `pcb_components` table

---

## Production Workflow

1. Select a **PCB model** and enter the **quantity to produce**
2. Frontend shows a **real-time deduction preview** (components × quantity)
3. On submit, backend runs a **PostgreSQL transaction**:
   - Locks each component row with `SELECT ... FOR UPDATE`
   - Validates sufficient stock for all components
   - If insufficient → `ROLLBACK` (nothing changes)
   - If OK → deducts stock, inserts `production_entries`, inserts `consumption_history`, checks procurement triggers → `COMMIT`
4. All changes are atomic — no partial deductions possible

---

## Database Schema

| Table                  | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `components`           | Component master data (name, part number, stock, monthly required) |
| `pcbs`                 | PCB model definitions                                              |
| `pcb_components`       | BOM mapping (which components belong to which PCB)                 |
| `production_entries`   | Production history log                                             |
| `consumption_history`  | Per-component consumption records                                  |
| `procurement_triggers` | Auto-generated procurement alerts                                  |

---

## Future Improvements

- [ ] User registration and role-based access control (Admin, Viewer, Operator)
- [ ] Barcode/QR code scanning for stock updates
- [ ] Supplier management module with lead times
- [ ] Email/SMS notifications for low-stock and procurement triggers
- [ ] Dashboard charts with Chart.js or Recharts
- [ ] Pagination and full-text search on all list endpoints
- [ ] Docker + docker-compose for one-command deployment
- [ ] CI/CD pipeline with automated testing
- [ ] Audit log for all inventory mutations
- [ ] Multi-warehouse support

---

## License

MIT
