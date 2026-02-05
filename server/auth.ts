import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";
import type { Owner } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Owner {}
  }
}

const PgSession = ConnectPgSimple(session);

export function setupAuth(app: Express) {
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "user_sessions",
  });

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "safemessage-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const owner = await storage.getOwnerByEmail(email);
          if (!owner) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await bcrypt.compare(password, owner.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, owner);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const owner = await storage.getOwner(id);
      done(null, owner || undefined);
    } catch (error) {
      done(error);
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}
