import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { db } from "./services/database-service";
import { setupAuth } from "./auth";
import { fixBakiyeFlags } from "./migrations/fix-bakiye-flags";
import paymentRoutes from "./routes/payment-routes";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: [
    "https://dynobiloto.repl.co",
    "https://8080-dynobiloto.repl.co",
    "https://sandbox-api.iyzipay.com",
    "https://sandbox-merchantgw.iyzipay.com"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Iyzi-Token']
}));

// Body parsing middleware - increase limit for iyzico callbacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
    app.use(express.static(path.join(__dirname, 'public')));



// Setup authentication
setupAuth(app);

// API Routes - Payment routes should be before auth middleware for callbacks
app.use("/api/payment", paymentRoutes);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Enhanced logging for payment callbacks
  if (path.includes('/api/payment')) {
    console.log('Payment request details:', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: req.headers
    });
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Special handling for Sipay responses to show more details
        if (path.includes('/sipay')) {
          console.log(`📡 Sipay Response for ${req.method} ${path}:`, JSON.stringify(capturedJsonResponse, null, 2));
        }
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Increase log line limit for better debugging
      if (logLine.length > 500) {
        logLine = logLine.slice(0, 499) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test database connection
let connection;
try {
  connection = await db.getConnection();
  console.log("Database connection successful");
} catch (error) {
  console.error("Database connection failed:", error);
  throw error;
} finally {
  if (connection) {
    connection.release();
  }
}

// Run bakiye flags fix migration
await fixBakiyeFlags();

// Setup routes and get server instance
const server = registerRoutes(app);

// Importantly only setup vite in development and after
// setting up all the other routes so the catch-all route
// doesn't interfere with the API routes
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

// Global error handling middleware - after routes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    message
  });
});

// 404 handler - must be after all routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "İstenilen kaynak bulunamadı"
  });
});

// Start server
const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  log(`Server running on port ${PORT}`);
});