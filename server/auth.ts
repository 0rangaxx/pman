import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import { users } from "db/schema";
import { db } from "db";
import { eq } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  // Log session setup
  console.log('Setting up authentication and session handling');
  
  const PostgresqlStore = connectPgSimple(session);
  
  // Create session store with detailed error logging
  const store = new PostgresqlStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production",
    },
    createTableIfMissing: true,
    errorLog: (error) => {
      console.error('Session store error:', error);
    }
  });

  // Log store creation success
  console.log('PostgreSQL session store initialized');

  // Always set trust proxy for Replit environment
  app.set('trust proxy', 1);

  const sessionSettings: session.SessionOptions = {
    store,
    secret: process.env.REPL_ID || "prompt-manager-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Always use secure cookies on Replit
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  };

  // Log session middleware setup
  console.log('Configuring session middleware with settings:', {
    secure: sessionSettings.cookie?.secure,
    sameSite: sessionSettings.cookie?.sameSite,
    trustProxy: true,
  });

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Enhanced error handling middleware with detailed logging
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Authentication Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      headers: req.headers,
      session: req.session?.id,
    });
    
    if (err.message?.includes('redirect_uri_mismatch')) {
      console.error('OAuth callback URL mismatch detected', {
        expected: "https://promptpalette.yoseneko.repl.co/auth/google/callback",
        error: err.message,
      });
      return res.status(401).json({ 
        message: 'Authentication configuration error. Please contact support.' 
      });
    }

    if (err.name === 'AuthenticationError') {
      console.error('Authentication failed:', err.message);
      return res.status(401).json({ message: 'Authentication failed' });
    }

    if (err.name === 'SessionError') {
      console.error('Session error:', err.message);
      return res.status(500).json({ message: 'Session error occurred' });
    }

    next(err);
  });

  const callbackURL = "https://promptpalette.yoseneko.repl.co/auth/google/callback";
  console.log('Configuring Google OAuth with callback URL:', callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth callback received', {
            profileId: profile.id,
            hasEmail: !!profile.emails?.[0]?.value,
            timestamp: new Date().toISOString(),
            displayName: profile.displayName,
            provider: profile.provider,
          });
          
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1);

          if (!user) {
            console.log('Creating new user for Google profile', {
              profileId: profile.id,
              email: profile.emails?.[0].value,
              timestamp: new Date().toISOString(),
            });
            
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
            console.log('New user created successfully', { 
              userId: user.id,
              timestamp: new Date().toISOString(),
            });
          } else {
            console.log('Updating existing user', { 
              userId: user.id,
              timestamp: new Date().toISOString(),
            });
            await db
              .update(users)
              .set({
                accessToken,
                refreshToken,
                displayName: profile.displayName,
                avatarUrl: profile.photos?.[0].value,
              })
              .where(eq(users.id, user.id));
            console.log('Existing user updated successfully');
          }

          return done(null, user);
        } catch (err) {
          console.error('Error in Google OAuth callback:', {
            error: err,
            stack: (err as Error).stack,
            timestamp: new Date().toISOString(),
          });
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user', { 
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user', { 
        userId: id,
        timestamp: new Date().toISOString(),
      });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      if (!user) {
        console.error('User not found during deserialization', { 
          userId: id,
          timestamp: new Date().toISOString(),
        });
        return done(new Error('User not found'));
      }
      
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', {
        error: err,
        userId: id,
        stack: (err as Error).stack,
        timestamp: new Date().toISOString(),
      });
      done(err);
    }
  });

  app.get("/auth/google", (req, res, next) => {
    console.log('Starting Google OAuth flow', {
      timestamp: new Date().toISOString(),
      session: req.session?.id,
      headers: req.headers,
    });
    
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account"
    })(req, res, next);
  });

  app.get(
    "/auth/google/callback",
    (req, res, next) => {
      console.log('Received Google OAuth callback', {
        timestamp: new Date().toISOString(),
        query: req.query,
        session: req.session?.id,
        headers: req.headers,
      });

      if (req.query.error) {
        console.error('Google OAuth error:', {
          error: req.query.error,
          errorDescription: req.query.error_description,
          timestamp: new Date().toISOString(),
        });
      }

      passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureMessage: true
      })(req, res, next);
    }
  );

  app.post("/logout", (req, res) => {
    console.log('User logout requested', { 
      userId: req.user?.id,
      session: req.session?.id,
      timestamp: new Date().toISOString(),
    });
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', {
          error: err,
          stack: err.stack,
          userId: req.user?.id,
          timestamp: new Date().toISOString(),
        });
        return res.status(500).json({ message: "Logout failed" });
      }
      console.log('User logged out successfully');
      res.redirect('/login');
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      console.log('User data requested', {
        userId: req.user?.id,
        session: req.session?.id,
        timestamp: new Date().toISOString(),
      });
      return res.json(req.user);
    }
    console.log('Unauthorized user data request');
    res.status(401).json({ message: "Unauthorized" });
  });
}
