import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { readServerStorage, writeServerStorage, SESSION_EPOCH } from "../lib/serverStorage";

const authRouter = Router();

// GET /api/auth/session-epoch
// Clients compare this value with the one they stored; when it changes they
// must discard their local session and log in again.
authRouter.get("/session-epoch", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ epoch: SESSION_EPOCH });
});

// POST /api/auth/google
// Registers the user with the data received at login. Only Google-verified
// logins (googleId present) are persisted, so the user list never contains
// typed-in or guest emails.
authRouter.post("/google", async (req, res) => {
  const { id, googleId, email, name, picture } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const user = {
    id: id || (googleId ? `google-${googleId}` : `usr-${Date.now()}`),
    googleId: googleId || undefined,
    email: cleanEmail,
    name: name || cleanEmail.split("@")[0],
    picture: picture || undefined,
    hasCompletedOnboarding: true,
  };

  if (!googleId) {
    // Not a verified Google login: do not store it as a registered user.
    return res.json({ user, registered: false });
  }

  try {
    if (db) {
      const found = await db.select().from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1);
      if (found.length > 0) {
        await db
          .update(usersTable)
          .set({ name: user.name, picture: user.picture ?? found[0].picture, googleId })
          .where(eq(usersTable.id, found[0].id));
      } else {
        await db.insert(usersTable).values({
          id: user.id,
          googleId,
          email: cleanEmail,
          name: user.name,
          picture: user.picture,
        });
      }
    } else {
      const store = readServerStorage();
      store.users[cleanEmail] = {
        ...(store.users[cleanEmail] || { createdAt: new Date().toISOString() }),
        ...user,
      };
      writeServerStorage(store);
    }
    return res.json({ user, registered: true });
  } catch (err: any) {
    console.error("[AUTH] Failed to register user:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
authRouter.get("/me", (req, res) => {
  res.json({ user: null });
});

// POST /api/auth/logout
authRouter.post("/logout", (req, res) => {
  res.json({ message: "Sesión cerrada" });
});

export default authRouter;
