  import type { Express } from "express";
  import { createServer, type Server } from "http";
  import { Router } from "express";
  import firmaRoutes from "./routes/firma-routes";
  import bakiyeRoutes from "./routes/bakiye-routes";
  import bayiRoutes from "./routes/bayi-routes";
  import kilometreRoutes from "./routes/kilometre-routes";
  import panelUsersRoutes from "./routes/panel-users-routes";
  import programUsersRoutes from "./routes/program-users-routes";
  import roleRoutes from "./routes/role-routes";
  import dealersRoutes from "./routes/dealers";
  import cihazSatislariRoutes from "./routes/cihaz-satislari-routes";
  import onlineCihazSatislariRoutes from "./routes/online-cihaz-satislari-routes";
  import vinRoutes from "./routes/vin-routes";
  import blogRoutes from "./routes/blog-routes";
  import raporRoutes from "./routes/rapor-routes";
  import { getLocations, createIl, createIlce, deleteIl, deleteIlce } from "./services/location-service";
  import cors from "cors";
  import express from 'express';
  import { setupAuth } from "./auth";
  import { db } from "@db";
  import { bakiye_komisyonlar, companies, bayiler, cihaz_satislari } from "@db/schema";
  import { eq, gte, lte, desc, asc, sql, isNull } from "drizzle-orm";
  import { and } from "drizzle-orm/expressions";
  import { bayiPaymentService } from "./services/bayi-payment-service";
  import { onlinePaymentService } from "./services/online-payment-service";
  import { bakiyeService } from "./services/bakiye-service";
  import path from 'path';
  import { fileURLToPath } from 'url';

  export function registerRoutes(app: Express): Server {
    setupAuth(app);
    const router = Router();

    // API Routes
    router.use("/companies", firmaRoutes);
    router.use("/bayiler", bayiRoutes);
    router.use("/kilometre", kilometreRoutes);
    router.use("/bakiye", bakiyeRoutes);
    router.use("/panel-users", panelUsersRoutes);
    router.use("/kullanicilar", programUsersRoutes);
    router.use("/roles", roleRoutes);
    router.use("/dealers", dealersRoutes);
    router.use("/cihaz-satislari", cihazSatislariRoutes);
    router.use("/online-cihaz-satislari", onlineCihazSatislariRoutes);
    router.use("/vinreader", vinRoutes);
    router.use("/raporlar", raporRoutes);

    router.use("/blogs", blogRoutes);  // Burada blogRoutes'u ekliyoruz

    // Location routes
    router.get("/il-ilce", getLocations);
    router.post("/il", createIl);
    router.delete("/il/:id", deleteIl);
    router.post("/ilce", createIlce);
    router.delete("/ilce/:id", deleteIlce);

    // Health check
    router.get("/health", (_req, res) => {
      res.json({ status: "ok", message: "API is running" });
    });

    // Apply routes


        app.use("/api", router);
    app.use(cors());
    app.use(express.json());

    const httpServer = createServer(app);
    return httpServer;
  }