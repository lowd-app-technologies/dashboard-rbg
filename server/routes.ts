import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { authenticate } from "./middleware/auth";
import { getUserData, updateUserData, verifyToken } from "./firebase";
import { storage } from "./storage";
import {
  insertCompanySchema,
  insertServiceSchema,
  insertServiceImageSchema,
  insertJobOfferSchema,
  User
} from "@shared/schema";
import { z } from "zod";

// Helper function to get user entry in database from Firebase uid
async function getUserByFirebaseUid(req: Request, res: Response): Promise<User | null> {
  try {
    if (!req.user || !req.user.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }
    
    const dbUser = await storage.getUserByUid(req.user.uid);
    
    if (!dbUser) {
      // Create the user if not found
      const userData = await getUserData(req.user.uid);
      
      if (!userData) {
        res.status(404).json({ message: "User not found" });
        return null;
      }
      
      // Create user in database
      const newUser = await storage.createUser({
        uid: req.user.uid,
        email: req.user.email || "",
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null
      });
      
      return newUser;
    }
    
    return dbUser;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

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
      
      // Also update in our database
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (dbUser && 'id' in dbUser) {
        await storage.updateUser(dbUser.id, { 
          displayName: displayName || null, 
          photoURL: photoURL || null
        });
      }
      
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
  
  // Company routes
  app.get("/api/companies", authenticate, async (req, res) => {
    try {
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || !('id' in dbUser)) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const companies = await storage.getUserCompanies(dbUser.id);
      res.json(companies);
    } catch (error) {
      console.error("Error getting companies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/companies/:id", authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || !('id' in dbUser) || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to view this company" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error getting company:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/companies", authenticate, async (req, res) => {
    try {
      const result = insertCompanySchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid company data", errors: result.error.errors });
      }
      
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || !('id' in dbUser)) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user already has a company
      const userCompanies = await storage.getUserCompanies(dbUser.id);
      
      if (userCompanies.length > 0) {
        return res.status(400).json({ message: "User already has a company" });
      }
      
      // Create company
      const company = await storage.createCompany({
        ...result.data,
        ownerId: dbUser.id
      });
      
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/companies/:id", authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || !('id' in dbUser) || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to update this company" });
      }
      
      const result = insertCompanySchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid company data", errors: result.error.errors });
      }
      
      // Update company
      const updatedCompany = await storage.updateCompany(companyId, result.data);
      
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Service routes
  app.get("/api/companies/:companyId/services", authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to view services for this company" });
      }
      
      const services = await storage.getCompanyServices(companyId);
      
      // For each service, fetch its images
      const servicesWithImages = await Promise.all(
        services.map(async (service) => {
          const images = await storage.getServiceImages(service.id);
          return {
            ...service,
            images: images.map(img => img.url)
          };
        })
      );
      
      res.json(servicesWithImages);
    } catch (error) {
      console.error("Error getting services:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/services/:id", authenticate, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(service.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to view this service" });
      }
      
      // Get service images
      const images = await storage.getServiceImages(serviceId);
      
      res.json({
        ...service,
        images: images.map(img => img.url)
      });
    } catch (error) {
      console.error("Error getting service:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/companies/:companyId/services", authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to create services for this company" });
      }
      
      const result = insertServiceSchema.safeParse({
        ...req.body,
        companyId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid service data", errors: result.error.errors });
      }
      
      // Create service
      const service = await storage.createService(result.data);
      
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/services/:id", authenticate, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(service.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to update this service" });
      }
      
      const result = insertServiceSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid service data", errors: result.error.errors });
      }
      
      // Update service
      const updatedService = await storage.updateService(serviceId, result.data);
      
      // Get service images
      const images = await storage.getServiceImages(serviceId);
      
      res.json({
        ...updatedService,
        images: images.map(img => img.url)
      });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/services/:id", authenticate, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(service.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to delete this service" });
      }
      
      // Delete service (this also deletes images)
      await storage.deleteService(serviceId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Service Images routes
  app.post("/api/services/:serviceId/images", authenticate, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(service.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to add images to this service" });
      }
      
      const result = insertServiceImageSchema.safeParse({
        serviceId,
        url: req.body.url
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid image data", errors: result.error.errors });
      }
      
      // Create image
      const image = await storage.createServiceImage(result.data);
      
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding service image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/service-images/:id", authenticate, async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      // Get image to find service
      const images = await storage.getServiceImages(imageId);
      
      if (images.length === 0) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      const image = images[0];
      
      // Get service to find company
      const service = await storage.getService(image.serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(service.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to delete this image" });
      }
      
      // Delete image
      await storage.deleteServiceImage(imageId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Job Offers routes
  app.get("/api/companies/:companyId/job-offers", authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to view job offers for this company" });
      }
      
      const jobOffers = await storage.getCompanyJobOffers(companyId);
      res.json(jobOffers);
    } catch (error) {
      console.error("Error getting job offers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/job-offers/:id", authenticate, async (req, res) => {
    try {
      const jobOfferId = parseInt(req.params.id);
      
      if (isNaN(jobOfferId)) {
        return res.status(400).json({ message: "Invalid job offer ID" });
      }
      
      const jobOffer = await storage.getJobOffer(jobOfferId);
      
      if (!jobOffer) {
        return res.status(404).json({ message: "Job offer not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(jobOffer.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to view this job offer" });
      }
      
      res.json(jobOffer);
    } catch (error) {
      console.error("Error getting job offer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/companies/:companyId/job-offers", authenticate, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to create job offers for this company" });
      }
      
      const result = insertJobOfferSchema.safeParse({
        ...req.body,
        companyId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid job offer data", errors: result.error.errors });
      }
      
      // Create job offer
      const jobOffer = await storage.createJobOffer(result.data);
      
      res.status(201).json(jobOffer);
    } catch (error) {
      console.error("Error creating job offer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/job-offers/:id", authenticate, async (req, res) => {
    try {
      const jobOfferId = parseInt(req.params.id);
      
      if (isNaN(jobOfferId)) {
        return res.status(400).json({ message: "Invalid job offer ID" });
      }
      
      const jobOffer = await storage.getJobOffer(jobOfferId);
      
      if (!jobOffer) {
        return res.status(404).json({ message: "Job offer not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(jobOffer.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to update this job offer" });
      }
      
      const result = insertJobOfferSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid job offer data", errors: result.error.errors });
      }
      
      // Update job offer
      const updatedJobOffer = await storage.updateJobOffer(jobOfferId, result.data);
      
      res.json(updatedJobOffer);
    } catch (error) {
      console.error("Error updating job offer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/job-offers/:id", authenticate, async (req, res) => {
    try {
      const jobOfferId = parseInt(req.params.id);
      
      if (isNaN(jobOfferId)) {
        return res.status(400).json({ message: "Invalid job offer ID" });
      }
      
      const jobOffer = await storage.getJobOffer(jobOfferId);
      
      if (!jobOffer) {
        return res.status(404).json({ message: "Job offer not found" });
      }
      
      // Get company to check ownership
      const company = await storage.getCompany(jobOffer.companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user is the owner
      const dbUser = await getUserByFirebaseUid(req, res);
      
      if (!dbUser || company.ownerId !== dbUser.id) {
        return res.status(403).json({ message: "Not authorized to delete this job offer" });
      }
      
      // Delete job offer
      await storage.deleteJobOffer(jobOfferId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting job offer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
