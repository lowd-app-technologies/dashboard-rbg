import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ""}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ""}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("VITE_FIREBASE_API_KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Email login error:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  
  // Create user document in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    uid: userCredential.user.uid,
    email,
    displayName,
    photoURL: userCredential.user.photoURL,
    createdAt: serverTimestamp(),
  });
  
  return userCredential;
};

export const loginWithGoogle = async () => {
  try {
    // Use signInWithPopup instead of signInWithRedirect to avoid domain issues
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Check if user document exists in Firestore
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // If not, create a new user document
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        createdAt: serverTimestamp(),
      });
    }
    
    return userCredential;
  } catch (error: unknown) {
    console.error("Google sign-in error:", error);
    
    // Mostra informações de depuração para ajudar com o problema de domínio
    if (error && typeof error === 'object' && 'code' in error && error.code === "auth/unauthorized-domain") {
      console.log("Domínio não autorizado. Adicione este domínio ao Firebase Console:");
      console.log(window.location.hostname);
    }
    
    throw error;
  }
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const updateUserProfile = async (user: FirebaseUser, data: { displayName?: string, photoURL?: string }) => {
  await updateProfile(user, data);
  
  // Update user document in Firestore
  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, data);
};

export const getCurrentUser = () => {
  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      resolve(user);
      unsubscribe();
    });
  });
};

export const getUserData = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    return userDoc.data();
  }
  
  return null;
};

// Company functions
export interface Company {
  id?: string;
  name: string;
  description: string;
  nif: string | null;              // NIF (Número de Identificação Fiscal) - substitui o CNPJ
  email: string | null;            // Email de contato da empresa
  phone: string | null;            // Telefone de contato
  address: string | null;          // Endereço completo
  postalCode: string | null;       // Código Postal (formato: XXXX-XXX)
  city: string | null;            // Localidade/Cidade
  country: string;                 // País (padrão: Portugal)
  website: string | null;         // Website da empresa
  caeCode: string | null;          // Código CAE (Classificação de Atividades Econômicas)
  constitutionDate: string | null; // Data de constituição (formato: YYYY-MM-DD)
  shareCapital: number | null;     // Capital Social (em euros)
  ownerId: string;                // ID do proprietário/usuário
  createdAt?: any;                 // Timestamp de criação
  updatedAt?: any;                 // Timestamp de atualização
}

export const createCompany = async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Check if user already has a company
    const userCompanies = await getUserCompanies(companyData.ownerId);
    
    if (userCompanies.length > 0) {
      throw new Error('Usuário já possui uma empresa cadastrada');
    }
    
    // Create company document
    const companyRef = await addDoc(collection(db, 'companies'), {
      ...companyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Link company to user
    const userRef = doc(db, 'users', companyData.ownerId);
    await updateDoc(userRef, {
      companyId: companyRef.id
    });
    
    return {
      id: companyRef.id,
      ...companyData
    };
  } catch (error: any) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const updateCompany = async (companyId: string, companyData: Partial<Company>) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    
    await updateDoc(companyRef, {
      ...companyData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const getCompanyById = async (companyId: string) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);
    
    if (companyDoc.exists()) {
      const data = companyDoc.data();
      return {
        id: companyId,
        name: data.name || '',
        description: data.description || '',
        nif: data.nif || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        postalCode: data.postalCode || null,
        city: data.city || null,
        country: data.country || 'Portugal',
        website: data.website || null,
        caeCode: data.caeCode || null,
        constitutionDate: data.constitutionDate || null,
        shareCapital: data.shareCapital !== undefined ? data.shareCapital : null,
        ownerId: data.ownerId,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      } as Company;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting company:', error);
    throw error;
  }
};

export const getUserCompanies = async (userId: string) => {
  try {
    const q = query(collection(db, 'companies'), where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const companies: Company[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      companies.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        nif: data.nif || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        postalCode: data.postalCode || null,
        city: data.city || null,
        country: data.country || 'Portugal',
        website: data.website || null,
        caeCode: data.caeCode || null,
        constitutionDate: data.constitutionDate || null,
        shareCapital: data.shareCapital !== undefined ? data.shareCapital : null,
        ownerId: data.ownerId,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      } as Company);
    });
    
    return companies;
  } catch (error) {
    console.error('Error getting user companies:', error);
    throw error;
  }
};

// Service functions
export interface Service {
  id?: string;
  name: string;
  description: string;
  price?: string;
  workingHours?: string;
  images?: string[];
  companyId: string;
  createdAt?: any;
  updatedAt?: any;
}

export const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const serviceRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: serviceRef.id,
      ...serviceData
    };
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const updateService = async (serviceId: string, serviceData: Partial<Service>) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const getServiceById = async (serviceId: string) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (serviceDoc.exists()) {
      return {
        id: serviceId,
        ...serviceDoc.data()
      } as Service;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting service:', error);
    throw error;
  }
};

export const getCompanyServices = async (companyId: string) => {
  try {
    const q = query(collection(db, 'services'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    
    const services: Service[] = [];
    querySnapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data()
      } as Service);
    });
    
    return services;
  } catch (error) {
    console.error('Error getting company services:', error);
    throw error;
  }
};

export const deleteService = async (serviceId: string) => {
  try {
    // Get service first to get image references
    const service = await getServiceById(serviceId);
    
    // Delete service document
    await deleteDoc(doc(db, 'services', serviceId));
    
    // Delete images if they exist
    if (service?.images && service.images.length > 0) {
      for (const imageUrl of service.images) {
        try {
          // Extract storage path from URL
          const imagePath = imageUrl.split('?')[0].split('/o/')[1].replace(/%2F/g, '/');
          const decodedPath = decodeURIComponent(imagePath);
          const imageRef = ref(storage, decodedPath);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with other deletions even if one fails
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Job offers functions
export interface JobOffer {
  id?: string;
  title: string;
  description: string;
  employmentType: string;
  salaryRange?: string;
  requirements?: string;
  contactEmail?: string;
  contactLink?: string;
  companyId: string;
  createdAt?: any;
  updatedAt?: any;
}

export const createJobOffer = async (jobData: Omit<JobOffer, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const jobRef = await addDoc(collection(db, 'job_offers'), {
      ...jobData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: jobRef.id,
      ...jobData
    };
  } catch (error) {
    console.error('Error creating job offer:', error);
    throw error;
  }
};

export const updateJobOffer = async (jobId: string, jobData: Partial<JobOffer>) => {
  try {
    const jobRef = doc(db, 'job_offers', jobId);
    
    await updateDoc(jobRef, {
      ...jobData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating job offer:', error);
    throw error;
  }
};

export const getJobOfferById = async (jobId: string) => {
  try {
    const jobRef = doc(db, 'job_offers', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (jobDoc.exists()) {
      return {
        id: jobId,
        ...jobDoc.data()
      } as JobOffer;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting job offer:', error);
    throw error;
  }
};

export const getCompanyJobOffers = async (companyId: string) => {
  try {
    const q = query(collection(db, 'job_offers'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    
    const jobs: JobOffer[] = [];
    querySnapshot.forEach((doc) => {
      jobs.push({
        id: doc.id,
        ...doc.data()
      } as JobOffer);
    });
    
    return jobs;
  } catch (error) {
    console.error('Error getting company job offers:', error);
    throw error;
  }
};

export const deleteJobOffer = async (jobId: string) => {
  try {
    await deleteDoc(doc(db, 'job_offers', jobId));
    return true;
  } catch (error) {
    console.error('Error deleting job offer:', error);
    throw error;
  }
};

// Image upload functions
export const uploadServiceImage = async (companyId: string, serviceId: string, file: File) => {
  try {
    const imageRef = ref(storage, `companies/${companyId}/services/${serviceId}/${file.name}_${Date.now()}`);
    await uploadBytes(imageRef, file);
    const downloadUrl = await getDownloadURL(imageRef);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export { auth, db, storage, app };
