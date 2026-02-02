import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import routes from "./routes.js";
import { pool } from "./db.js";

const app = express();
const log = console.log;

/**
 * Setup CORS middleware
 * Allows requests from specified origins and localhost for development
 */
function setupCors(app) {
  app.use((req, res, next) => {
    const origins = new Set();

    // Support Replit domains
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    // Support Render domains
    if (process.env.RENDER_EXTERNAL_URL) {
      origins.add(process.env.RENDER_EXTERNAL_URL);
    }

    // Support custom allowed origins
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((d) => {
        origins.add(d.trim());
      });
    }

    const origin = req.header("origin");

    // Allow localhost origins for development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

/**
 * Setup body parsing middleware
 */
function setupBodyParsing(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
}

/**
 * Setup request logging middleware
 */
function setupRequestLogging(app) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

/**
 * Setup error handling middleware
 */
function setupErrorHandler(app) {
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return;
    }

    return res.status(status).json({ error: message });
  });
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    log("✓ Database connection successful");
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    return false;
  }
}

/**
 * Initialize and start the server
 */
async function startServer() {
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error("Failed to connect to database. Please check your DATABASE_URL environment variable and ensure the database is accessible. Server will start but database operations will fail.");
  }

  // Setup middleware
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  // Register API routes under /api prefix
  app.use("/api", routes);

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      name: "Calc-XD Server",
      version: "1.0.0",
      status: "running",
      database: dbConnected ? "connected" : "disconnected",
      endpoints: {
        health: "/api/health",
        users: "/api/users",
      },
    });
  });

  // Setup error handler (must be last)
  setupErrorHandler(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`\n🚀 Calc-XD Server running on port ${port}`);
      log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      log(`   Database: ${dbConnected ? "Connected" : "Disconnected"}`);
      log(`\n📡 API Endpoints:`);
      log(`   GET  /api/health     - Health check`);
      log(`   GET  /api/users      - Get all users`);
      log(`   GET  /api/users/:id  - Get user by ID`);
      log(`   POST /api/users      - Create user`);
      log(`   PUT  /api/users/:id  - Update user`);
      log(`   DELETE /api/users/:id - Delete user`);
      log("");
    }
  );

  // Graceful shutdown
  process.on("SIGTERM", () => {
    log("\nReceived SIGTERM signal. Shutting down gracefully...");
    httpServer.close(() => {
      pool.end();
      log("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    log("\nReceived SIGINT signal. Shutting down gracefully...");
    httpServer.close(() => {
      pool.end();
      log("Server closed");
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
