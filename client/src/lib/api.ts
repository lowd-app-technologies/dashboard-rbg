import { queryClient, getQueryFn, getQueryFnLegacy } from "./queryClient";

// Helpers
const jsonHeaders = {
  "Content-Type": "application/json",
};

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
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

// API endpoints
export const API = {
  // Companies
  getCompanies: () => {
    const fetcher = getQueryFn({
      path: '/api/companies',
      on401: 'throw',
    });
    return fetcher();
  },
  
  getCompany: (id: number) => {
    const fetcher = getQueryFn({
      path: `/api/companies/${id}`,
      on401: 'throw',
    });
    return fetcher();
  },
  
  createCompany: async (data: any) => {
    const newCompany = await apiPost('/api/companies', data);
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    return newCompany;
  },
  
  updateCompany: async (id: number, data: any) => {
    const updated = await apiPut(`/api/companies/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    queryClient.invalidateQueries({ queryKey: ['/api/companies', id] });
    return updated;
  },
  
  // Services
  getCompanyServices: (companyId: number) => {
    const fetcher = getQueryFn({
      path: `/api/companies/${companyId}/services`,
      on401: 'throw',
    });
    return fetcher();
  },
  
  getService: (id: number) => {
    const fetcher = getQueryFn({
      path: `/api/services/${id}`,
      on401: 'throw',
    });
    return fetcher();
  },
  
  createService: async (companyId: number, data: any) => {
    const newService = await apiPost(`/api/companies/${companyId}/services`, data);
    queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/services`] });
    return newService;
  },
  
  updateService: async (id: number, data: any) => {
    const updated = await apiPut(`/api/services/${id}`, data);
    // Get the updated service
    const fetcher = getQueryFn({
      path: `/api/services/${id}`,
      on401: 'throw',
    });
    const service = await fetcher();
    
    if (service && 'companyId' in service) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${service.companyId}/services`] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/services', id] });
    return updated;
  },
  
  deleteService: async (id: number) => {
    // Get the service first to know which company it belongs to
    const fetcher = getQueryFn({
      path: `/api/services/${id}`,
      on401: 'throw',
    });
    const service = await fetcher();
    
    const result = await apiDelete(`/api/services/${id}`);
    
    if (service && 'companyId' in service) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${service.companyId}/services`] });
    }
    return result;
  },
  
  // Service Images
  addServiceImage: async (serviceId: number, imageUrl: string) => {
    const newImage = await apiPost(`/api/services/${serviceId}/images`, { url: imageUrl });
    queryClient.invalidateQueries({ queryKey: ['/api/services', serviceId] });
    return newImage;
  },
  
  deleteServiceImage: async (imageId: number) => {
    const result = await apiDelete(`/api/service-images/${imageId}`);
    // We don't know which service the image belongs to here, so we can't invalidate specifically
    return result;
  },
  
  // Job Offers
  getCompanyJobOffers: (companyId: number) => {
    const fetcher = getQueryFn({
      path: `/api/companies/${companyId}/job-offers`,
      on401: 'throw',
    });
    return fetcher();
  },
  
  getJobOffer: (id: number) => {
    const fetcher = getQueryFn({
      path: `/api/job-offers/${id}`,
      on401: 'throw',
    });
    return fetcher();
  },
  
  createJobOffer: async (companyId: number, data: any) => {
    const newJobOffer = await apiPost(`/api/companies/${companyId}/job-offers`, data);
    queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/job-offers`] });
    return newJobOffer;
  },
  
  updateJobOffer: async (id: number, data: any) => {
    const updated = await apiPut(`/api/job-offers/${id}`, data);
    
    // Get the updated job offer
    const fetcher = getQueryFn({
      path: `/api/job-offers/${id}`,
      on401: 'throw',
    });
    const jobOffer = await fetcher();
    
    if (jobOffer && 'companyId' in jobOffer) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${jobOffer.companyId}/job-offers`] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/job-offers', id] });
    return updated;
  },
  
  deleteJobOffer: async (id: number) => {
    // Get the job offer first to know which company it belongs to
    const fetcher = getQueryFn({
      path: `/api/job-offers/${id}`,
      on401: 'throw',
    });
    const jobOffer = await fetcher();
    
    const result = await apiDelete(`/api/job-offers/${id}`);
    
    if (jobOffer && 'companyId' in jobOffer) {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${jobOffer.companyId}/job-offers`] });
    }
    return result;
  },
};