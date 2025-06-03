import { FirestoreStorage } from './firestore-storage';

// Exporta a instância do FirestoreStorage como storage padrão
export const storage = new FirestoreStorage();

// Exporta a interface IStorage para uso em outros lugares
export interface IStorage {
  // Users
  getUser(id: string): Promise<any>;
  getUserByUid(uid: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, userData: any): Promise<any>;
  
  // Companies
  getCompany(id: string): Promise<any>;
  getUserCompanies(userId: string): Promise<any[]>;
  createCompany(company: any): Promise<any>;
  updateCompany(id: string, company: any): Promise<any>;
  
  // Services
  getService(id: string): Promise<any>;
  getCompanyServices(companyId: string): Promise<any[]>;
  createService(service: any): Promise<any>;
  updateService(id: string, service: any): Promise<any>;
  deleteService(id: string): Promise<void>;
  
  // Service Images
  getServiceImages(serviceId: string): Promise<any[]>;
  createServiceImage(image: any): Promise<any>;
  deleteServiceImage(id: string): Promise<void>;
  
  // Job Offers
  getJobOffer(id: string): Promise<any>;
  getCompanyJobOffers(companyId: string): Promise<any[]>;
  createJobOffer(jobOffer: any): Promise<any>;
  updateJobOffer(id: string, jobOffer: any): Promise<any>;
  deleteJobOffer(id: string): Promise<void>;
}
