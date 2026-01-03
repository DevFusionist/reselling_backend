# Reseller Backend - Microservices E-commerce Platform

Production-ready multi-model e-commerce backend with NestJS microservices architecture, featuring Razorpay payment integration.

## 🏗️ Architecture

- **Microservices Architecture**: 9 independent services
- **Event-Driven Communication**: RabbitMQ for async operations
- **API Gateway**: Single entry point for all requests
- **Database per Service**: Each service has its own PostgreSQL database
- **Payment Gateway**: Razorpay integration for payments

## 📦 Services

| Service | Port | Description | Database |
|---------|------|-------------|----------|
| API Gateway | 3000 | Entry point, JWT validation, routing | None |
| Auth Service | 3001 | Authentication, JWT tokens, user management | `auth_db` |
| Product Service | 3002 | Products, categories, variants, images | `product_db` |
| Pricing Service | 3003 | Pricing validation, commission calculation | `pricing_db` |
| Order Service | 3004 | Order lifecycle management | `order_db` |
| Payment Service | 3005 | Razorpay integration, webhooks | `payment_db` |
| Wallet Service | 3006 | Seller wallets, payouts, transactions | `wallet_db` |
| Share-Link Service | 3007 | Referral links, tracking | `share_link_db` |
| Notification Service | 3008 | Email/SMS/WhatsApp notifications | `notification_db` |

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: NestJS (latest stable)
- **Database**: PostgreSQL 15+ (Neon DB serverless)
- **ORM**: Prisma 7.x with Neon adapter
- **Message Broker**: RabbitMQ 3.12+
- **Payment Gateway**: Razorpay
- **Process Manager**: PM2
- **Language**: TypeScript (strict mode)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- RabbitMQ (`sudo apt install rabbitmq-server`)
- Neon DB account ([neon.tech](https://neon.tech))
- Razorpay account ([razorpay.com](https://razorpay.com))

### Setup

```bash
# 1. Setup environment files
./scripts/setup-env.sh

# 2. Edit each service's .env file with your credentials:
#    - Neon DB URLs for each service
#    - Razorpay Key ID and Secret
#    - JWT Secret
#    - RabbitMQ URL

# 3. Install dependencies
npm run install:all

# 4. Generate Prisma clients
npm run prisma:generate

# 5. Run migrations
npm run prisma:migrate

# 6. Start development
npm run dev
```

### Install RabbitMQ

```bash
# Ubuntu/Debian
sudo apt install rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
sudo systemctl start rabbitmq-server

# Create admin user
sudo rabbitmqctl add_user admin admin123
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

**Management UI**: http://localhost:15672 (admin/admin123)

### Environment Variables

Each service needs a `.env` file. Key variables:

```bash
# Database (each service)
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# RabbitMQ (services using events)
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# API Gateway
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Payment Service (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Service URLs (for inter-service communication)
ORDER_SERVICE_URL=http://localhost:3004
PRICING_SERVICE_URL=http://localhost:3003
```

## 📚 API Documentation

All requests go through **API Gateway** at `http://localhost:3000`

### Base URL
```
http://localhost:3000
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Service

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "CUSTOMER" // ADMIN | CUSTOMER | RESELLER
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["CUSTOMER"]
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same as register

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## 🛍️ Product Service

### Get Products
```http
GET /products?skip=0&take=10&categoryId=uuid&isActive=true
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "basePrice": 1000.00,
      "isActive": true,
      "category": { "id": "uuid", "name": "Category" },
      "variants": [...],
      "images": [...]
    }
  ],
  "total": 100,
  "skip": 0,
  "take": 10
}
```

### Get Product by ID
```http
GET /products/:id
```

### Get Product by Slug
```http
GET /products/slug/:slug
```

### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Description",
  "basePrice": 1000.00,
  "categoryId": "uuid",
  "variants": [
    {
      "price": 1000.00,
      "stock": 100,
      "optionValues": [
        { "optionName": "Color", "value": "Red" },
        { "optionName": "Size", "value": "L" }
      ]
    }
  ],
  "images": [
    { "url": "https://example.com/image.jpg", "isPrimary": true }
  ]
}
```

### Update Product (Admin Only)
```http
PATCH /products/:id
Authorization: Bearer <admin_token>
```

### Delete Product (Admin Only)
```http
DELETE /products/:id
Authorization: Bearer <admin_token>
```

### Categories

#### Get Categories
```http
GET /categories
```

#### Create Category (Admin Only)
```http
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Category Name",
  "description": "Category description",
  "slug": "category-slug"
}
```

---

## 💰 Pricing Service

### Calculate Price & Commission
```http
POST /pricing/calculate
Content-Type: application/json

{
  "sellerId": "seller-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "sellerPrice": 1500.00
    }
  ]
}
```

**Response:**
```json
{
  "subtotal": 3000.00,
  "commission": 300.00,
  "total": 3000.00,
  "items": [
    {
      "productId": "uuid",
      "basePrice": 1000.00,
      "sellerPrice": 1500.00,
      "quantity": 2,
      "subtotal": 3000.00,
      "commission": 300.00
    }
  ]
}
```

### Validate Margin
```http
POST /pricing/validate-margin
Content-Type: application/json

{
  "productId": "product-uuid",
  "sellerPrice": 1500.00
}
```

**Response:**
```json
{
  "valid": true,
  "basePrice": 1000.00,
  "sellerPrice": 1500.00,
  "margin": 500.00,
  "marginPercentage": 50.00
}
```

### Get Product Pricing
```http
GET /pricing/product/:productId
```

---

## 📦 Order Service

### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "sellerId": "seller-uuid", // Optional, for reseller orders
  "shareLinkId": "link-uuid", // Optional, if order came from share link
  "shippingAddress": "123 Main St, City, Country",
  "items": [
    {
      "productId": "product-uuid",
      "variantId": "variant-uuid", // Optional
      "quantity": 2,
      "sellerPrice": 1500.00
    }
  ]
}
```

**Response:**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "sellerId": "seller-uuid",
  "status": "PENDING",
  "subtotal": 3000.00,
  "commission": 300.00,
  "total": 3000.00,
  "items": [...],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Orders
```http
GET /orders?userId=uuid&sellerId=uuid&status=PENDING
Authorization: Bearer <token>
```

### Get Order by ID
```http
GET /orders/:id
Authorization: Bearer <token>
```

### Update Order Status
```http
PATCH /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PAID", // PENDING | PAID | SHIPPED | DELIVERED | CANCELLED
  "notes": "Payment received"
}
```

---

## 💳 Payment Service (Razorpay)

### Create Payment Record
```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-uuid",
  "userId": "user-uuid",
  "amount": 3000.00,
  "currency": "INR",
  "method": "CARD" // CARD | UPI | NETBANKING | WALLET
}
```

### Create Razorpay Order
```http
POST /payments/razorpay/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-uuid",
  "userId": "user-uuid",
  "amount": 3000.00,
  "currency": "INR",
  "method": "CARD"
}
```

**Response:**
```json
{
  "payment": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "status": "PENDING",
    "amount": 3000.00,
    "currency": "INR"
  },
  "razorpayOrder": {
    "id": "order_xxxxxxxxxxxxx",
    "amount": 300000, // Amount in paise
    "currency": "INR",
    "receipt": "order_order-uuid",
    "status": "created",
    "key": "rzp_test_xxxxxxxxxxxxx" // Razorpay Key ID for frontend
  }
}
```

### Get Payment by ID
```http
GET /payments/:id
Authorization: Bearer <token>
```

### Get Payment by Order ID
```http
GET /payments/order/:orderId
Authorization: Bearer <token>
```

### Get Payments List
```http
GET /payments?userId=uuid&status=SUCCESS
Authorization: Bearer <token>
```

### Webhook (Razorpay)
```http
POST /payments/webhook
X-Razorpay-Signature: <signature>
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxxx",
        "order_id": "order_xxxxxxxxxxxxx",
        "status": "captured",
        "amount": 300000,
        "currency": "INR"
      }
    },
    "order": {
      "entity": {
        "id": "order_xxxxxxxxxxxxx",
        "notes": {
          "orderId": "order-uuid",
          "userId": "user-uuid",
          "paymentId": "payment-uuid"
        }
      }
    }
  }
}
```

**Note:** Configure webhook URL in Razorpay Dashboard: `https://your-domain.com/payments/webhook`

---

## 🔗 Share Link Service

### Create Share Link
```http
POST /share-links
Authorization: Bearer <token>
Content-Type: application/json

{
  "sellerId": "seller-uuid",
  "productId": "product-uuid", // Optional
  "sellerPrice": 1500.00, // Optional, for product-specific pricing
  "expiresAt": "2024-12-31T23:59:59.000Z" // Optional
}
```

**Response:**
```json
{
  "id": "link-uuid",
  "code": "abc123xyz",
  "sellerId": "seller-uuid",
  "productId": "product-uuid",
  "url": "https://your-domain.com/share/abc123xyz",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "isActive": true
}
```

### Get Share Link by Code
```http
GET /share-links/:code
```

**Response:** Includes product details and pricing if productId is set

### Get Share Links by Seller
```http
GET /share-links?sellerId=seller-uuid
Authorization: Bearer <token>
```

### Get Share Link Statistics
```http
GET /share-links/:code/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "clicks": 150,
  "conversions": 10,
  "conversionRate": 6.67,
  "totalRevenue": 30000.00
}
```

---

## 💼 Wallet Service

### Get Wallet
```http
GET /wallets/:sellerId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "wallet-uuid",
  "sellerId": "seller-uuid",
  "pendingBalance": 5000.00,
  "availableBalance": 10000.00,
  "totalEarnings": 15000.00
}
```

### Get Transactions
```http
GET /wallets/:sellerId/transactions?skip=0&take=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "type": "COMMISSION_CREATED",
      "amount": 300.00,
      "balanceBefore": 0.00,
      "balanceAfter": 300.00,
      "description": "Commission locked for order xxx",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "skip": 0,
  "take": 20
}
```

### Create Payout Request
```http
POST /wallets/:sellerId/payouts
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000.00,
  "bankAccount": "Account ending in 1234",
  "notes": "Monthly payout"
}
```

### Get Payout Requests
```http
GET /wallets/payouts?sellerId=uuid&status=PENDING
Authorization: Bearer <token>
```

### Update Payout Status (Admin)
```http
PATCH /wallets/payouts/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "APPROVED", // PENDING | APPROVED | REJECTED | COMPLETED
  "notes": "Payout approved"
}
```

---

## 🔔 Notification Service

Notifications are event-driven and don't have direct HTTP endpoints. They listen to RabbitMQ events and send notifications automatically.

---

## 🎯 Frontend Integration Guide

### 1. Setup

#### Install Dependencies
```bash
npm install axios
npm install razorpay # For Razorpay Checkout
```

#### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### 2. Authentication Flow

#### API Client Setup
```typescript
// api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios.request(error.config);
        } catch {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Auth Service
```typescript
// services/auth.ts
import api from '../api/client';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'ADMIN' | 'CUSTOMER' | 'RESELLER';
  }) {
    const response = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  },

  async login(data: { email: string; password: string }) {
    const response = await api.post('/auth/login', data);
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
```

### 3. Product Listing

```typescript
// services/products.ts
import api from '../api/client';

export const productService = {
  async getProducts(params?: {
    skip?: number;
    take?: number;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProduct(id: string) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async getProductBySlug(slug: string) {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },
};
```

### 4. Pricing & Commission

```typescript
// services/pricing.ts
import api from '../api/client';

export const pricingService = {
  async calculate(data: {
    sellerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      sellerPrice: number;
    }>;
  }) {
    const response = await api.post('/pricing/calculate', data);
    return response.data;
  },

  async validateMargin(data: {
    productId: string;
    sellerPrice: number;
  }) {
    const response = await api.post('/pricing/validate-margin', data);
    return response.data;
  },
};
```

### 5. Order Creation Flow

```typescript
// services/orders.ts
import api from '../api/client';

export const orderService = {
  async createOrder(data: {
    userId: string;
    sellerId?: string;
    shareLinkId?: string;
    shippingAddress?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      sellerPrice: number;
    }>;
  }) {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async getOrders(params?: {
    userId?: string;
    sellerId?: string;
    status?: string;
  }) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getOrder(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};
```

### 6. Razorpay Payment Integration

#### Install Razorpay
```bash
npm install razorpay
```

#### Payment Component
```typescript
// components/PaymentCheckout.tsx
import { useEffect } from 'react';
import { loadScript } from '@razorpay/checkout';
import api from '../api/client';

interface PaymentCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export const PaymentCheckout = ({
  orderId,
  amount,
  currency = 'INR',
  onSuccess,
  onError,
}: PaymentCheckoutProps) => {
  useEffect(() => {
    loadScript({
      src: 'https://checkout.razorpay.com/v1/checkout.js',
    });
  }, []);

  const handlePayment = async () => {
    try {
      // Step 1: Create Razorpay order
      const { data } = await api.post('/payments/razorpay/create-order', {
        orderId,
        userId: localStorage.getItem('userId'), // Get from auth context
        amount,
        currency,
        method: 'CARD',
      });

      const { razorpayOrder } = data;

      // Step 2: Initialize Razorpay Checkout
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Your Company Name',
        description: `Order ${orderId}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          // Step 3: Verify payment on backend (webhook handles this automatically)
          // You can also verify here if needed
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSuccess(response.razorpay_payment_id);
          } catch (error) {
            onError('Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '+919999999999',
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function () {
            onError('Payment cancelled');
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      onError(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  return (
    <button onClick={handlePayment}>
      Pay ₹{amount}
    </button>
  );
};
```

#### Usage Example
```typescript
// pages/Checkout.tsx
import { PaymentCheckout } from '../components/PaymentCheckout';
import { useNavigate } from 'react-router-dom';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const orderId = 'order-uuid';
  const amount = 3000.00;

  return (
    <PaymentCheckout
      orderId={orderId}
      amount={amount}
      onSuccess={(paymentId) => {
        console.log('Payment successful:', paymentId);
        navigate('/order-success');
      }}
      onError={(error) => {
        console.error('Payment error:', error);
        alert(error);
      }}
    />
  );
};
```

### 7. Share Link Integration

```typescript
// services/shareLinks.ts
import api from '../api/client';

export const shareLinkService = {
  async createShareLink(data: {
    sellerId: string;
    productId?: string;
    sellerPrice?: number;
    expiresAt?: string;
  }) {
    const response = await api.post('/share-links', data);
    return response.data;
  },

  async getShareLink(code: string) {
    const response = await api.get(`/share-links/${code}`);
    return response.data;
  },

  async getShareLinks(sellerId: string) {
    const response = await api.get('/share-links', {
      params: { sellerId },
    });
    return response.data;
  },

  async getStats(code: string) {
    const response = await api.get(`/share-links/${code}/stats`);
    return response.data;
  },
};
```

### 8. Wallet Integration

```typescript
// services/wallet.ts
import api from '../api/client';

export const walletService = {
  async getWallet(sellerId: string) {
    const response = await api.get(`/wallets/${sellerId}`);
    return response.data;
  },

  async getTransactions(sellerId: string, params?: {
    skip?: number;
    take?: number;
  }) {
    const response = await api.get(`/wallets/${sellerId}/transactions`, { params });
    return response.data;
  },

  async createPayoutRequest(sellerId: string, data: {
    amount: number;
    bankAccount?: string;
    notes?: string;
  }) {
    const response = await api.post(`/wallets/${sellerId}/payouts`, data);
    return response.data;
  },
};
```

### 9. Complete E-commerce Flow

```typescript
// Example: Complete purchase flow
async function completePurchase(
  productId: string,
  quantity: number,
  sellerPrice: number,
  sellerId?: string,
  shareLinkId?: string
) {
  try {
    // Step 1: Get current user
    const user = await authService.getCurrentUser();

    // Step 2: Calculate pricing
    const pricing = await pricingService.calculate({
      sellerId: sellerId || user.id,
      items: [{ productId, quantity, sellerPrice }],
    });

    // Step 3: Create order
    const order = await orderService.createOrder({
      userId: user.id,
      sellerId,
      shareLinkId,
      shippingAddress: '123 Main St, City, Country',
      items: [{ productId, quantity, sellerPrice }],
    });

    // Step 4: Initialize payment
    // Use PaymentCheckout component or:
    const payment = await api.post('/payments/razorpay/create-order', {
      orderId: order.id,
      userId: user.id,
      amount: order.total,
      currency: 'INR',
      method: 'CARD',
    });

    // Step 5: Open Razorpay checkout
    // (See PaymentCheckout component above)

    return { order, payment };
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}
```

## 🔄 Event Flow

### Order → Payment → Wallet Flow

1. **Order Created** → `ORDER_CREATED` event → Notification Service
2. **Payment Success** → `PAYMENT_SUCCESS` event → Wallet Service (locks commission)
3. **Order Delivered** → `ORDER_DELIVERED` event → Wallet Service (unlocks commission)
4. **Order Cancelled** → `ORDER_CANCELLED` event → Wallet Service (releases commission)

## 🐳 Docker Setup (Optional)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services (dev mode) |
| `npm run dev:core` | Start core services only |
| `npm run build` | Build all services |
| `npm run start:prod` | Start with PM2 (production) |
| `npm run stop:prod` | Stop PM2 services |
| `npm run logs:prod` | View PM2 logs |
| `npm run health:check` | Check service health |
| `npm run prisma:generate` | Generate Prisma clients |
| `npm run prisma:migrate` | Run migrations |

## 🔒 Security Best Practices

1. **Never expose Razorpay secret key** to frontend
2. **Always verify webhook signatures** (already implemented)
3. **Use HTTPS** in production
4. **Validate all inputs** (already implemented with class-validator)
5. **Rate limiting** on API Gateway (implement as needed)
6. **CORS configuration** (configure allowed origins)
7. **JWT expiration**: Access token (15min), Refresh token (7days)

## 🧪 Testing

```bash
# Test individual service
cd services/payment-service
npm test

# Test all services
npm run test:all
```

## 📊 Monitoring

- **RabbitMQ Management**: http://localhost:15672
- **Service Health**: `http://localhost:{port}/health`
- **PM2 Monitoring**: `npm run monit:prod`

## 🚨 Troubleshooting

### Payment Webhook Not Working
1. Check Razorpay webhook URL is correct
2. Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
3. Ensure webhook endpoint is publicly accessible (use ngrok for local dev)

### Database Connection Issues
1. Verify `DATABASE_URL` in each service's `.env`
2. Check Neon DB connection limits
3. Ensure SSL mode is enabled

### RabbitMQ Connection Issues
1. Check RabbitMQ is running: `sudo systemctl status rabbitmq-server`
2. Verify `RABBITMQ_URL` in service `.env` files
3. Check RabbitMQ management UI

## 📄 License

MIT

---

## 🎯 Quick Reference

### Base URL
```
http://localhost:3000
```

### Key Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Payment Statuses
- `PENDING` - Payment initiated
- `PROCESSING` - Payment in progress
- `SUCCESS` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

### Order Statuses
- `PENDING` - Order created, awaiting payment
- `PAID` - Payment received
- `SHIPPED` - Order shipped
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled

---

**Need Help?** Check the service logs or RabbitMQ management UI for debugging.
