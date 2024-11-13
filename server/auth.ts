import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users } from "db/schema";
import { db } from "db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "prompt-manager-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Require HTTPS
      httpOnly: true, // Prevent XSS
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  // Trust first proxy for secure cookies in production
  app.set("trust proxy", 1);

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Add error handling middleware for authentication
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Authentication Error:', err);
    if (err.name === 'AuthenticationError') {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    next(err);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth callback initiated', { profileId: profile.id });
          
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1);

          if (!user) {
            console.log('Creating new user for Google profile', { profileId: profile.id });
            [user] = await db
              .insert(users)
              .values({
                googleId: profile.id,
                email: profile.emails![0].value,
                displayName: profile.displayName,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                avatarUrl: profile.photos?.[0].value,
                accessToken,
                refreshToken,
              })
              .returning();
            console.log('New user created successfully', { userId: user.id });
          } else {
            console.log('Existing user found', { userId: user.id });
          }

          return done(null, user);
        } catch (err) {
          console.error('Error in Google OAuth callback:', err);
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user', { userId: id });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err);
    }
  });

  app.get("/auth/google", (req, res, next) => {
    console.log('Starting Google OAuth flow');
    passport.authenticate("google", {
      scope: ["profile", "email"]
    })(req, res, next);
  });

  app.get(
    "/auth/google/callback",
    (req, res, next) => {
      console.log('Received callback from Google OAuth');
      passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login",
      })(req, res, next);
    }
  );

  app.post("/logout", (req, res) => {
    console.log('User logout requested', { userId: req.user?.id });
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      console.log('User data requested', { userId: req.user?.id });
      return res.json(req.user);
    }
    console.log('Unauthorized user data request');
    res.status(401).json({ message: "Unauthorized" });
  });
}
