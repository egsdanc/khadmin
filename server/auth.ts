import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./services/database-service";

interface DatabaseUser {
  id: number;
  name: string;
  email: string;
  password: string;
  firma_id: number | null;
  bayi_id: number | null;
  role: string;
  status: string;
  deleted_at: Date | null;
}

declare global {
  namespace Express {
    interface User extends Omit<DatabaseUser, 'password' | 'deleted_at'> {}
  }
}

// Auth middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    console.log("[Auth] Unauthorized access attempt:", {
      path: req.path,
      method: req.method,
      user: req.user
    });
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized access" 
    });
  }
  next();
};

// Role check middleware
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log("[Auth] Insufficient permissions:", {
        path: req.path,
        method: req.method,
        userRole: req.user?.role,
        requiredRoles: roles
      });
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient permissions" 
      });
    }
    next();
  };
};

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  // Session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "kilometre-hacker-secret",
    resave: false,
    saveUninitialized: false,
    name: 'session',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
      secure: true // false for development
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // cleanup every 24 hours
    })
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      let connection;
      try {
        console.log("[Auth] Login attempt:", { email });
        connection = await db.getConnection();

        const [rows] = await connection.execute(
          'SELECT * FROM panel_users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
          [email]
        );

        const users = Array.isArray(rows) ? rows : [];

        if (users.length === 0) {
          console.log("[Auth] User not found");
          return done(null, false, { message: "Kullanıcı bulunamadı" });
        }

        const user = users[0] as DatabaseUser;

        if (password !== user.password) {
          console.log("[Auth] Invalid password");
          return done(null, false, { message: "Hatalı şifre" });
        }

        console.log("[Auth] Login successful:", { userId: user.id, email: user.email, role: user.role });
        const { password: _, deleted_at: __, ...safeUser } = user;
        return done(null, safeUser);
      } catch (err) {
        console.error("[Auth] Login error:", err);
        return done(err);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }
  ));

  // Passport serialization
  passport.serializeUser((user, done) => {
    console.log("[Auth] Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    let connection;
    try {
      console.log("[Auth] Deserializing user:", id);
      connection = await db.getConnection();

      const [rows] = await connection.execute(
        'SELECT * FROM panel_users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
        [id]
      );

      const users = Array.isArray(rows) ? rows : [];

      if (users.length === 0) {
        console.log("[Auth] User not found during deserialization");
        return done(null, false);
      }

      const user = users[0] as DatabaseUser;
      const { password: _, deleted_at: __, ...safeUser } = user;
      done(null, safeUser);
    } catch (err) {
      console.error("[Auth] Deserialization error:", err);
      done(err);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    console.log("[Auth] Login request received:", { email: req.body.email });

    passport.authenticate("local", (err: any, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        console.error("[Auth] Login error:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Giriş sırasında bir hata oluştu" 
        });
      }

      if (!user) {
        console.log("[Auth] Login failed:", info.message);
        return res.status(401).json({ 
          success: false, 
          message: info.message ?? "Giriş başarısız" 
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("[Auth] Session creation error:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Oturum oluşturulurken bir hata oluştu" 
          });
        }

        console.log("[Auth] Login successful, sending user data:", { userId: user.id, email: user.email, role: user.role });
        return res.json({ 
          success: true, 
          user 
        });
      });
    })(req, res, next);
  });

  // User endpoint
  app.get("/api/user", requireAuth, (req, res) => {
    console.log("[Auth] User info request successful for:", req.user?.id);
    return res.json(req.user);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    const userId = req.user?.id;
    console.log("[Auth] Logout request received for user:", userId);

    req.logout((err) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Çıkış yapılırken bir hata oluştu" 
        });
      }
      console.log("[Auth] Logout successful for user:", userId);
      res.json({ 
        success: true, 
        message: "Çıkış başarılı" 
      });
    });
  });
}