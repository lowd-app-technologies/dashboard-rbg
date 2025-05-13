import { queryClient, getQueryFn, getQueryFnLegacy } from "./queryClient";

// Helpers
const jsonHeaders = {
  "Content-Type": "application/json",
};

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      ...jsonHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function apiPost<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      ...jsonHeaders,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}

export async function apiPut<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      ...jsonHeaders,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...jsonHeaders,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Define types to avoid 'in' operator issues
interface CompanyData {
  id: number;
  name: string;
  companyId?: number;
  [key: string]: any;
}

interface ServiceData {
  id: number;
  name: string;
  companyId: number;
  [key: string]: any;
}

interface JobOfferData {
  id: number;
  title: string;
  companyId: number;
  [key: string]: any;
}

// API endpoints
export const API = {
  // Companies
  getCompanies: async (): Promise<CompanyData[]> => {
    return apiGet<CompanyData[]>('/api/companies');
  },
  
  getCompany: async (id: number): Promise<CompanyData> => {
    return apiGet<CompanyData>(`/api/companies/${id}`);
  },
  
  createCompany: async (data: any): Promise<CompanyData> => {
    const newCompany = await apiPost<CompanyData>('/api/companies', data);
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    return newCompany;
  },
  
  updateCompany: async (id: number, data: any): Promise<CompanyData> => {
    const updated = await apiPut<CompanyData>(`/api/companies/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    queryClient.invalidateQueries({ queryKey: ['/api/companies', id] });
    return updated;
  },
  
  // Services
  getCompanyServices: async (companyId: number): Promise<ServiceData[]> => {
    return apiGet<ServiceData[]>(`/api/companies/${companyId}/services`);
  },
  
  getService: async (id: number): Promise<ServiceData> => {
    return apiGet<ServiceData>(`/api/services/${id}`);
  },
  
  createService: async (companyId: number, data: any): Promise<ServiceData> => {
    const newService = await apiPost<ServiceData>(`/api/companies/${companyId}/services`, data);
    queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/services`] });
    return newService;
  },
  
  updateService: async (id: number, data: any): Promise<ServiceData> => {
    const updated = await apiPut<ServiceData>(`/api/services/${id}`, data);
    // Get the updated service
    const service = await apiGet<ServiceData>(`/api/services/${id}`);
    
    if (service && service.companyId) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${service.companyId}/services`] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/services', id] });
    return updated;
  },
  
  deleteService: async (id: number): Promise<any> => {
    // Get the service first to know which company it belongs to
    const service = await apiGet<ServiceData>(`/api/services/${id}`);
    
    const result = await apiDelete(`/api/services/${id}`);
    
    if (service && service.companyId) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${service.companyId}/services`] });
    }
    return result;
  },
  
  // Service Images
  addServiceImage: async (serviceId: number, imageUrl: string): Promise<any> => {
    const newImage = await apiPost(`/api/services/${serviceId}/images`, { url: imageUrl });
    queryClient.invalidateQueries({ queryKey: ['/api/services', serviceId] });
    return newImage;
  },
  
  deleteServiceImage: async (imageId: number): Promise<any> => {
    const result = await apiDelete(`/api/service-images/${imageId}`);
    // We don't know which service the image belongs to here, so we can't invalidate specifically
    return result;
  },
  
  // Job Offers
  getCompanyJobOffers: async (companyId: number): Promise<JobOfferData[]> => {
    return apiGet<JobOfferData[]>(`/api/companies/${companyId}/job-offers`);
  },
  
  getJobOffer: async (id: number): Promise<JobOfferData> => {
    return apiGet<JobOfferData>(`/api/job-offers/${id}`);
  },
  
  createJobOffer: async (companyId: number, data: any): Promise<JobOfferData> => {
    const newJobOffer = await apiPost<JobOfferData>(`/api/companies/${companyId}/job-offers`, data);
    queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/job-offers`] });
    return newJobOffer;
  },
  
  updateJobOffer: async (id: number, data: any): Promise<JobOfferData> => {
    const updated = await apiPut<JobOfferData>(`/api/job-offers/${id}`, data);
    
    // Get the updated job offer
    const jobOffer = await apiGet<JobOfferData>(`/api/job-offers/${id}`);
    
    if (jobOffer && jobOffer.companyId) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${jobOffer.companyId}/job-offers`] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/job-offers', id] });
    return updated;
  },
  
  deleteJobOffer: async (id: number): Promise<any> => {
    // Get the job offer first to know which company it belongs to
    const jobOffer = await apiGet<JobOfferData>(`/api/job-offers/${id}`);
    
    const result = await apiDelete(`/api/job-offers/${id}`);
    
    if (jobOffer && jobOffer.companyId) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${jobOffer.companyId}/job-offers`] });
    }
    return result;
  },
};