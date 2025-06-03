import { firestore } from "./firebase";
import { IStorage } from "./storage";
import { v4 as uuidv4 } from 'uuid';

export class FirestoreStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<any> {
    const userDoc = await firestore.collection('users').doc(id).get();
    if (!userDoc.exists) return undefined;
    return { id: userDoc.id, ...userDoc.data() };
  }
  
  async getUserByUid(uid: string): Promise<any> {
    const snapshot = await firestore.collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async createUser(userData: any): Promise<any> {
    const id = uuidv4();
    const user = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await firestore.collection('users').doc(id).set(user);
    return { id, ...user };
  }
  
  async updateUser(id: string, userData: any): Promise<any> {
    const updateData = {
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    await firestore.collection('users').doc(id).update(updateData);
    return { id, ...updateData };
  }

  // Companies
  async getCompany(id: string): Promise<any> {
    const doc = await firestore.collection('companies').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() };
  }
  
  async getUserCompanies(userId: string): Promise<any[]> {
    const snapshot = await firestore.collection('companies')
      .where('ownerId', '==', userId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  async createCompany(companyData: any): Promise<any> {
    const id = uuidv4();
    const company = {
      ...companyData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await firestore.collection('companies').doc(id).set(company);
    return { id, ...company };
  }
  
  async updateCompany(id: string, companyData: any): Promise<any> {
    const updateData = {
      ...companyData,
      updatedAt: new Date().toISOString()
    };
    
    await firestore.collection('companies').doc(id).update(updateData);
    return { id, ...updateData };
  }

  // Services
  async getService(id: string): Promise<any> {
    const doc = await firestore.collection('services').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() };
  }
  
  async getCompanyServices(companyId: string): Promise<any[]> {
    const snapshot = await firestore.collection('services')
      .where('companyId', '==', companyId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  async createService(serviceData: any): Promise<any> {
    const id = uuidv4();
    const service = {
      ...serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await firestore.collection('services').doc(id).set(service);
    return { id, ...service };
  }
  
  async updateService(id: string, serviceData: any): Promise<any> {
    const updateData = {
      ...serviceData,
      updatedAt: new Date().toISOString()
    };
    
    await firestore.collection('services').doc(id).update(updateData);
    return { id, ...updateData };
  }
  
  async deleteService(id: string): Promise<void> {
    await firestore.collection('services').doc(id).delete();
  }

  // Service Images
  async getServiceImages(serviceId: string): Promise<any[]> {
    const snapshot = await firestore.collection('serviceImages')
      .where('serviceId', '==', serviceId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  async createServiceImage(imageData: any): Promise<any> {
    const id = uuidv4();
    const image = {
      ...imageData,
      createdAt: new Date().toISOString(),
    };
    
    await firestore.collection('serviceImages').doc(id).set(image);
    return { id, ...image };
  }
  
  async deleteServiceImage(id: string): Promise<void> {
    await firestore.collection('serviceImages').doc(id).delete();
  }

  // Job Offers
  async getJobOffer(id: string): Promise<any> {
    const doc = await firestore.collection('jobOffers').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() };
  }
  
  async getCompanyJobOffers(companyId: string): Promise<any[]> {
    const snapshot = await firestore.collection('jobOffers')
      .where('companyId', '==', companyId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  async createJobOffer(jobOfferData: any): Promise<any> {
    const id = uuidv4();
    const jobOffer = {
      ...jobOfferData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await firestore.collection('jobOffers').doc(id).set(jobOffer);
    return { id, ...jobOffer };
  }
  
  async updateJobOffer(id: string, jobOfferData: any): Promise<any> {
    const updateData = {
      ...jobOfferData,
      updatedAt: new Date().toISOString()
    };
    
    await firestore.collection('jobOffers').doc(id).update(updateData);
    return { id, ...updateData };
  }
  
  async deleteJobOffer(id: string): Promise<void> {
    await firestore.collection('jobOffers').doc(id).delete();
  }
}
