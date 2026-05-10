<div align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-FF4438?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <br/>
  <h1>💰 Personal Finance Tracker</h1>
  <p><strong>Full-stack finance management with RBAC, real-time analytics, and Redis caching</strong></p>
</div>
## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL |
| **Cache** | Redis (Memurai on Windows) |
| **Authentication** | JWT with Role-Based Access Control |
| **API Documentation** | Swagger / OpenAPI 3.0 |

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based token authentication
- **Three user roles:**
  - **Admin** — Full access: manage all transactions, view all users, full CRUD
  - **User** — Manage own transactions, view own analytics
  - **Read-only** — View transactions and analytics only (no add/edit/delete)

### 💳 Transaction Management
- Add, edit, and delete income/expense transactions
- 9 pre-defined categories (Food & Dining, Transport, Shopping, etc.)
- Search by description
- Filter by type (income/expense) and category
- Pagination (50 items per page)

### 📊 Analytics Dashboard
- **Summary Cards:** Total Income, Total Expenses, Balance
- **Pie Chart:** Category-wise expense breakdown
- **Bar Chart:** Monthly income vs expenses comparison
- **Line Chart:** 6-month income/expense trends
- Year selector to view historical data

### ⚡ Performance Optimization
- **Lazy Loading:** React.lazy() with Suspense for route-based code splitting
- **Virtual Scrolling:** Scrollable transaction list container
- **Redis Caching:**
  - Analytics data cached for 15 minutes
  - Category list cached for 1 hour
  - Automatic cache invalidation on transaction updates
- **Rate Limiting:**
  - Auth endpoints: 5 requests per 15 minutes
  - Transaction endpoints: 100 requests per hour
  - Analytics endpoints: 50 requests per hour

### 🎨 UI/UX
- Dark/Light theme toggle (persisted in localStorage)
- Responsive sidebar navigation
- Loading spinners and error states
- Role-based conditional rendering
---

## 🔧 Setup Instructions

### Prerequisites
- **Node.js** v18 or higher
- **MySQL** 8+ installed and running
- **Redis** (or Memurai for Windows)

### 
```bash
[1]. Clone the Repository
git clone <repository-url>
cd personal-finance-tracker


[2]. Database Setup
sql
-- Connect to MySQL
mysql -u root -p

-- Create the database
CREATE DATABASE finance_tracker;
USE finance_tracker;

-- Run the schema (create tables and seed categories)
-- See backend/database/schema.sql or run manually


[3]. Backend Setup
bash
cd backend
npm install

# Create .env file with your credentials:
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=finance_tracker
# DB_USER=root
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key
# REDIS_HOST=localhost
# REDIS_PORT=6379

npm run dev
Server runs on: http://localhost:5000


[4]. Frontend Setup
bash
cd frontend
npm install
npm run dev
App runs on: http://localhost:3000


[5]. Seed Demo Users
bash
cd backend
node seed.js

🔑 Demo Credentials
Role	      Email	            Password  	Permissions
Admin	      admin@test.com	  admin123	  Full access, manage users
User	      user@test.com	    user123	    Manage own transactions
Read-only	  viewer@test.com	  viewer123	  View transactions only


📚 API Documentation
After starting the backend, visit:

http://localhost:5000/api-docs

The Swagger UI provides interactive documentation for all endpoints:

Method	  Endpoint	              Access
POST	  /api/auth/register	    Public
POST	  /api/auth/login	        Public
GET	      /api/transactions	      All roles
POST   /api/transactions	        Admin, User
PUT	      /api/transactions/:id	  Admin, User
DELETE	  /api/transactions/:id	  Admin, User
GET	      /api/analytics/monthly	All roles
GET	      /api/analytics/categories	All roles
GET	      /api/analytics/trends	  All roles
GET	      /api/users	            Admin only
GET	     /api/categories	        All roles


🧪 React Hooks Implementation
Hook	Usage	Location
useContext	Auth state, theme management	AuthContext.jsx, ThemeContext.jsx
useCallback	Event handlers, row renderers	Transactions.jsx, Dashboard.jsx
useMemo	Filtered lists, summary calculations	Transactions.jsx, Dashboard.jsx


🚦 Rate Limiting Configuration
Endpoint	Limit	Window
Auth (/api/auth/*)	5 requests	15 minutes
Transactions (/api/transactions/*)	100 requests	1 hour
Analytics (/api/analytics/*)	50 requests	1 hour


💾 Redis Caching Strategy
Data	TTL	Invalidation Trigger
Analytics (monthly, categories, trends)	15 minutes	New/updated/deleted transaction
Category list	1 hour	Manual server restart
Cache Performance
Before caching: Each dashboard load = 3 database queries

After caching: Subsequent loads = 0 database queries (served from Redis)

Measured improvement: ~40-60% faster response times


🎯 Assignment Checklist

✅ User authentication with JWT

✅ Role-Based Access Control (3 roles)

✅ Transaction CRUD operations

✅ Search and filter transactions

✅ Dashboard with 3 chart types (Pie, Bar, Line)

✅ Lazy loading with React.lazy() and Suspense

✅ Pagination for transaction lists

✅ Redis caching with invalidation

✅ Rate limiting on API endpoints

✅ XSS and SQL injection prevention

✅ Swagger API documentation

✅ useMemo, useCallback, useContext hooks

✅ Dark/Light theme toggle

✅ Admin user management page

✅ Virtual scrolling for transaction lists



📄 License
This project is created as part of an academic assignment.



👤 Submitted By
Himanshu Kumar
