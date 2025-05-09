import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticate } from "./middleware/auth";
import { getUserData, updateUserData } from "./firebase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      // req.user comes from the authenticate middleware
      const userData = await getUserData(req.user.uid);
      res.json(userData);
    } catch (error) {
      console.error("Error getting user data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User profile routes
  app.put("/api/user/profile", authenticate, async (req, res) => {
    try {
      const { displayName, photoURL } = req.body;
      await updateUserData(req.user.uid, { displayName, photoURL });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User settings routes
  app.post("/api/user/settings", authenticate, async (req, res) => {
    try {
      const data = req.body;
      await updateUserData(req.user.uid, data);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
