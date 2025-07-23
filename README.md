# 🍕 Food Delivery System

A comprehensive NestJS-based food delivery system with real-time rider tracking, order management, and geospatial proximity search capabilities.

## 📋 Features

- **Order Management**: Complete order lifecycle with logs and calculated orders
- **Real-time Rider Tracking**: WebSocket-based location updates and availability
- **Geospatial Proximity Search**: Find nearby riders within 5km radius
- **RabbitMQ Integration**: Event-driven order processing
- **Advanced Analytics**: Most bought meal queries with JSONB processing
- **API Documentation**: Comprehensive Swagger documentation

## 🛠 Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Knex query builder
- **Real-time**: Socket.IO WebSockets
- **Message Queue**: RabbitMQ
- **Geospatial**: Haversine formula + geolib
- **Documentation**: Swagger/OpenAPI

---

## 🚀 Step-by-Step Setup Guide

### Prerequisites

Before starting, ensure you have the following installed on your system:

1. **Node.js** (version 18 or higher)

   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **PostgreSQL** (version 12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Make sure it's running on port 5432

3. **RabbitMQ** (version 3.8 or higher)
   - Download from: https://www.rabbitmq.com/download.html
   - Make sure it's running on port 5672

4. **Git** (for cloning the repository)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd foodcourttest

# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 2: Database Setup

1. **Create Database**

   ```bash
   # Connect to PostgreSQL as superuser
   psql -U postgres

   # Create database and user
   CREATE DATABASE myfoodcourt;
   CREATE USER postgres WITH PASSWORD 'iknowsaint';
   GRANT ALL PRIVILEGES ON DATABASE myfoodcourt TO postgres;
   \q
   ```

2. **Verify Database Configuration**

   Check that your `.env` file contains:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=iknowsaint
   DB_NAME=myfoodcourt
   RABBITMQ_URL=amqp://localhost:5672
   PORT=3000
   NODE_ENV=development
   ```

3. **Run Database Migrations**

   ```bash
   # Run all migrations to create tables
   npx knex migrate:latest

   # Verify migrations were successful
   npx knex migrate:currentVersion
   ```

4. **Seed Sample Data (Optional)**
   ```bash
   # Run seeds to populate sample data
   npx knex seed:run
   ```

### Step 3: Verify Services

1. **Check PostgreSQL**

   ```bash
   # Test database connection
   psql -U postgres -d myfoodcourt -c "SELECT version();"
   ```

2. **Check RabbitMQ**

   ```bash
   # Check if RabbitMQ is running (Windows)
   rabbitmqctl status

   # Or check the management interface
   # Open: http://localhost:15672 (guest/guest)
   ```

### Step 4: Start the Application

```bash
# Start in development mode with hot reload
npm run start:dev

# You should see output like:
# Application is running on: http://localhost:3000
# Swagger documentation available at: http://localhost:3000/api/docs
```

### Step 5: Verify Installation

1. **Check API Health**

   ```bash
   # Test basic API endpoint
   curl http://localhost:3000
   ```

2. **Access Swagger Documentation**
   - Open: http://localhost:3000/api/docs
   - You should see comprehensive API documentation

3. **Check RabbitMQ Connection**
   - Visit: http://localhost:3000/api/rabbitmq/connection-status
   - Should return: `{"connected": true, "attempts": 0}`

---

## 🧪 Testing Guide

### Option 1: Using Swagger UI (Recommended)

1. **Open Swagger Documentation**

   ```
   http://localhost:3000/api/docs
   ```

2. **Test Order Endpoints**
   - Click on "Orders" section
   - Try `GET /api/orders/all-with-details`
   - Try `GET /api/orders/most-bought-meal`

3. **Test Rider Endpoints**
   - Use rider authentication header: `x-rider-id: 1`
   - Try `GET /api/riders/me`
   - Try `PUT /api/riders/me/location` with sample coordinates

### Option 2: Using HTML Test Files

The project includes comprehensive HTML test files:

1. **Basic Rider API Testing**

   ```
   Open: test-rider-simple.html in your browser
   ```

   - Test rider authentication
   - Update rider location
   - Check availability

2. **WebSocket Testing**

   ```
   Open: test-websockets.html in your browser
   ```

   - Connect as a rider
   - Connect as dispatch
   - Send real-time messages

3. **Proximity Search Testing**

   ```
   Open: test-proximity-search.html in your browser
   ```

   - Test geospatial calculations
   - Simulate rider locations
   - Test 5km radius search

4. **Complete Order Flow Testing**

   ```
   Open: test-complete-proximity-flow.html in your browser
   ```

   - Full end-to-end testing
   - Order creation → Proximity search → Rider notification

### Option 3: Using cURL Commands

1. **Test Rider Authentication**

   ```bash
   # Register a new rider
   curl -X POST -H "Content-Type: application/json" \
        -d '{
          "name": "Test Rider",
          "email": "test.rider@example.com",
          "phone": "+2348123456789",
          "password": "SecurePassword123!",
          "vehicle_type": "motorcycle",
          "license_plate": "LAG-TEST-001"
        }' \
        http://localhost:3000/api/auth/riders/signup

   # Sign in the rider
   curl -X POST -H "Content-Type: application/json" \
        -d '{
          "email": "test.rider@example.com",
          "password": "SecurePassword123!"
        }' \
        http://localhost:3000/api/auth/riders/signin
   ```

2. **Test Orders API**

   ```bash
   # Get all orders with details
   curl http://localhost:3000/api/orders/all-with-details

   # Get most bought meal
   curl http://localhost:3000/api/orders/most-bought-meal
   ```

3. **Test Rider API (using seeded riders)**

   ```bash
   # Get rider profile (with authentication using seeded rider)
   curl -H "x-rider-id: 1" http://localhost:3000/api/riders/me

   # Update rider location
   curl -X PUT -H "Content-Type: application/json" -H "x-rider-id: 1" \
        -d '{"current_latitude": 6.5244, "current_longitude": 3.3792}' \
        http://localhost:3000/api/riders/me/location
   ```

4. **Test RabbitMQ Integration**
   ```bash
   # Simulate order creation
   curl -X POST -H "Content-Type: application/json" \
        -d '{"orderId": 123, "customerLocation": {"lat": 6.5244, "lng": 3.3792}}' \
        http://localhost:3000/api/rabbitmq/test-order-created
   ```

---

## 🔧 Advanced Testing Scenarios

### Scenario 1: Real-time Rider Tracking

1. **Open WebSocket Test Page**

   ```
   test-websockets.html
   ```

2. **Connect Multiple Riders**
   - Connect Rider 1 with ID: 1
   - Connect Rider 2 with ID: 2
   - Connect Dispatch Dashboard

3. **Test Location Updates**
   - Update rider locations via API
   - Observe real-time broadcasts in dispatch

### Scenario 2: Proximity Search Flow

1. **Set Up Riders**

   ```bash
   # Place Rider 1 at University of Lagos
   curl -X PUT -H "Content-Type: application/json" -H "x-rider-id: 1" \
        -d '{"current_latitude": 6.5158, "current_longitude": 3.3896}' \
        http://localhost:3000/api/riders/me/location

   # Place Rider 2 at Victoria Island (closer)
   curl -X PUT -H "Content-Type: application/json" -H "x-rider-id: 2" \
        -d '{"current_latitude": 6.4281, "current_longitude": 3.4219}' \
        http://localhost:3000/api/riders/me/location
   ```

2. **Trigger Order from Lekki**

   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -d '{"orderId": 123, "customerLocation": {"lat": 6.4531, "lng": 3.5427}}' \
        http://localhost:3000/api/rabbitmq/test-order-created
   ```

3. **Check Console Output**
   - Proximity search results
   - Rider notifications
   - Distance calculations

### Scenario 3: Database Query Testing

1. **Check Raw SQL Queries**

   ```bash
   # Test complex order query
   curl http://localhost:3000/api/orders/all-with-details

   # Test JSONB processing for most bought meal
   curl http://localhost:3000/api/orders/most-bought-meal
   ```

---

## 📊 Expected Test Results

### Successful API Responses

1. **Orders with Details**

   ```json
   [
     {
       "id": 1,
       "user_id": 5,
       "order_code": "backend1001",
       "logs": [...],
       "calculated_order": {...},
       "order_type": {...}
     }
   ]
   ```

2. **Most Bought Meal**

   ```json
   {
     "name": "Pepper Rice Special",
     "total_quantity": 15
   }
   ```

3. **Rider Profile**
   ```json
   {
     "id": 1,
     "name": "John Doe",
     "is_available": true,
     "current_latitude": 6.5244,
     "current_longitude": 3.3792
   }
   ```

### WebSocket Events

1. **Connection Established**

   ```json
   {
     "type": "connection_established",
     "data": {
       "riderId": 1,
       "message": "Successfully connected"
     }
   }
   ```

2. **Location Broadcast**
   ```json
   {
     "type": "rider_location_update",
     "data": {
       "riderId": 1,
       "latitude": 6.5244,
       "longitude": 3.3792
     }
   }
   ```

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**

   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```

   **Solution**: Ensure PostgreSQL is running and credentials are correct

2. **RabbitMQ Connection Error**

   ```
   Error: connect ECONNREFUSED 127.0.0.1:5672
   ```

   **Solution**: Start RabbitMQ service

3. **Migration Error**

   ```
   Error: relation "orders" does not exist
   ```

   **Solution**: Run migrations: `npx knex migrate:latest`

4. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::3000
   ```
   **Solution**: Kill existing process or change PORT in .env

### Debug Commands

```bash
# Check if services are running
netstat -an | findstr :5432  # PostgreSQL
netstat -an | findstr :5672  # RabbitMQ
netstat -an | findstr :3000  # Your app

# Check database tables
psql -U postgres -d myfoodcourt -c "\dt"

# Check application logs
npm run start:dev  # Watch console output
```

---

## 🚀 Production Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

### Environment Variables

For production, update `.env`:

```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=secure-password
RABBITMQ_URL=amqp://production-rabbitmq-url
```

---

## 📚 API Documentation

Once running, comprehensive API documentation is available at:

- **Swagger UI**: http://localhost:3000/api/docs
- **JSON Schema**: http://localhost:3000/api/docs-json

### Key Endpoints

| Method | Endpoint                           | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| GET    | `/api/orders/all-with-details`     | Get orders with relationships |
| GET    | `/api/orders/most-bought-meal`     | Analytics query               |
| POST   | `/api/auth/riders/signup`          | Register new rider            |
| POST   | `/api/auth/riders/signin`          | Sign in rider                 |
| PUT    | `/api/auth/riders/change-password` | Change rider password         |
| GET    | `/api/riders/me`                   | Get rider profile             |
| PUT    | `/api/riders/me/location`          | Update GPS coordinates        |
| POST   | `/api/rabbitmq/test-order-created` | Simulate order event          |

---

## 🤝 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check console logs for error details
4. Ensure all services (PostgreSQL, RabbitMQ) are running

---

**Your food delivery system is now ready to run! 🚀**
