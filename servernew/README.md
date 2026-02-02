# Calc-XD Server

A Node.js server for Calc-XD that works seamlessly with Render PostgreSQL database.

## Features

- Express.js server with API routes
- PostgreSQL database integration using Drizzle ORM
- RESTful API for user management
- CORS support for cross-origin requests
- Environment-based configuration
- Health check endpoint

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL database (Render PostgreSQL recommended)

## Setup

1. **Install dependencies:**
   ```bash
   cd servernew
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and set your `DATABASE_URL`:
   ```
   DATABASE_URL=postgres://user:password@host:port/database
   ```

3. **Run database migrations:**
   
   The server uses the same schema as the main app (`shared/schema.ts`). Make sure to run migrations from the root directory:
   ```bash
   cd ..
   npm run db:push
   ```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Server info |
| GET | `/api/health` | Health check |
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

## API Examples

**Create a user:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "password": "secret123"}'
```

**Get all users:**
```bash
curl http://localhost:5000/api/users
```

**Get a specific user:**
```bash
curl http://localhost:5000/api/users/{user-id}
```

**Update a user:**
```bash
curl -X PUT http://localhost:5000/api/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{"username": "john_updated"}'
```

**Delete a user:**
```bash
curl -X DELETE http://localhost:5000/api/users/{user-id}
```

## Deploying to Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Set the following:
   - **Root Directory:** `servernew`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables:
   - `DATABASE_URL`: Your Render PostgreSQL connection string
   - `NODE_ENV`: `production`
5. Deploy!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | Environment (development/production) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

## Project Structure

```
servernew/
├── index.js        # Server entry point
├── db.js           # Database connection
├── schema.js       # Database schema (Drizzle)
├── storage.js      # Data access layer
├── routes.js       # API routes
├── package.json    # Dependencies
├── .env.example    # Environment template
└── README.md       # This file
```
