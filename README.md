# 💈 Backend API - Barbershop Booking System

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
createdb barbershop_db

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start server
npm run dev
```

Server: http://localhost:5000
Swagger: http://localhost:5000/api-docs

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login

### Barbers
- `GET /api/barbers` - List barbers
- `GET /api/barbers/:id` - Get barber details
- `POST /api/barbers` - Create profile
- `PATCH /api/barbers/:id` - Update profile

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - My bookings
- `PATCH /api/bookings/:id/status` - Update status
- `DELETE /api/bookings/:id` - Cancel booking

### Statistics
- `GET /api/statistics/barber/:id` - Get statistics
- `GET /api/statistics/barber/:id/monthly` - Monthly stats
- `GET /api/statistics/barber/:id/peak-hours` - Peak hours

### Additional
- `GET /api/services/barber/:id` - Services
- `GET /api/favorites` - Favorites
- `GET /api/reviews/barber/:id` - Reviews
- `GET /api/schedule/barber/:id` - Schedule

## 🧪 Test Accounts

```
Admin:
  Email: admin@barbershop.com
  Password: password123

User:
  Phone: +998901234567
  Password: password123

Barber:
  Phone: +998901234568
  Password: password123
```

## 🔧 Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/barbershop_db"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

## 📊 Revenue Logic

Revenue is calculated **only from COMPLETED bookings**:
- PENDING, CONFIRMED, IN_PROGRESS → No revenue
- COMPLETED → Revenue counted ✅

## 🛡️ Security Features

- JWT authentication
- Password hashing (bcryptjs)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## 📦 Dependencies

- express
- prisma
- @prisma/client
- bcryptjs
- jsonwebtoken
- cors
- helmet
- morgan
- express-rate-limit
- swagger-jsdoc
- swagger-ui-express
- zod
- dotenv

## 🚀 Production

```bash
npm run build
npm start
```

---

For detailed API documentation, visit: http://localhost:5000/api-docs
