import { 
  users, type User, type InsertUser,
  companies, type Company, type InsertCompany,
  services, type Service, type InsertService,
  serviceImages, type ServiceImage, type InsertServiceImage,
  jobOffers, type JobOffer, type InsertJobOffer
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getUserCompanies(userId: number): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  
  // Services
  getService(id: number): Promise<Service | undefined>;
  getCompanyServices(companyId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  
  // Service Images
  getServiceImages(serviceId: number): Promise<ServiceImage[]>;
  createServiceImage(image: InsertServiceImage): Promise<ServiceImage>;
  deleteServiceImage(id: number): Promise<void>;
  
  // Job Offers
  getJobOffer(id: number): Promise<JobOffer | undefined>;
  getCompanyJobOffers(companyId: number): Promise<JobOffer[]>;
  createJobOffer(jobOffer: InsertJobOffer): Promise<JobOffer>;
  updateJobOffer(id: number, jobOffer: Partial<InsertJobOffer>): Promise<JobOffer>;
  deleteJobOffer(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUid(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  
  async getUserCompanies(userId: number): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.ownerId, userId));
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }
  
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...company,
        updatedAt: new Date()
      })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }
  
  // Services
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async getCompanyServices(companyId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.companyId, companyId));
  }
  
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({
        ...service,
        updatedAt: new Date()
      })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }
  
  async deleteService(id: number): Promise<void> {
    // Delete associated images first
    await db.delete(serviceImages).where(eq(serviceImages.serviceId, id));
    
    // Then delete the service
    await db.delete(services).where(eq(services.id, id));
  }
  
  // Service Images
  async getServiceImages(serviceId: number): Promise<ServiceImage[]> {
    return await db.select().from(serviceImages).where(eq(serviceImages.serviceId, serviceId));
  }
  
  async createServiceImage(image: InsertServiceImage): Promise<ServiceImage> {
    const [newImage] = await db.insert(serviceImages).values(image).returning();
    return newImage;
  }
  
  async deleteServiceImage(id: number): Promise<void> {
    await db.delete(serviceImages).where(eq(serviceImages.id, id));
  }
  
  // Job Offers
  async getJobOffer(id: number): Promise<JobOffer | undefined> {
    const [jobOffer] = await db.select().from(jobOffers).where(eq(jobOffers.id, id));
    return jobOffer;
  }
  
  async getCompanyJobOffers(companyId: number): Promise<JobOffer[]> {
    return await db.select().from(jobOffers).where(eq(jobOffers.companyId, companyId));
  }
  
  async createJobOffer(jobOffer: InsertJobOffer): Promise<JobOffer> {
    const [newJobOffer] = await db.insert(jobOffers).values(jobOffer).returning();
    return newJobOffer;
  }
  
  async updateJobOffer(id: number, jobOffer: Partial<InsertJobOffer>): Promise<JobOffer> {
    const [updatedJobOffer] = await db
      .update(jobOffers)
      .set({
        ...jobOffer,
        updatedAt: new Date()
      })
      .where(eq(jobOffers.id, id))
      .returning();
    return updatedJobOffer;
  }
  
  async deleteJobOffer(id: number): Promise<void> {
    await db.delete(jobOffers).where(eq(jobOffers.id, id));
  }
}

export const storage = new DatabaseStorage();
