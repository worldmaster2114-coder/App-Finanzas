import { Router } from "express";

const authRouter = Router();

// POST /api/auth/google
authRouter.post("/google", async (req, res) => {
  const { credential, email, name, picture } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = {
    id: `usr-${Date.now()}`,
    email,
    name: name || email.split("@")[0],
    picture: picture || undefined,
    hasCompletedOnboarding: false,
  };

  res.json({
    user,
    message: "Autenticado con Google exitosamente",
  });
  return;
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
