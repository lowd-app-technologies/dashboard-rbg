import { queryClient } from "./queryClient";
import { auth } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

// Headers padrão para requisições JSON
const jsonHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Interceptador para incluir token em todas as requisições
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  console.log('Fetching URL:', url);
  
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      console.error('No user is currently signed in');
      throw new Error('No user is currently signed in');
    }
    
    const token = await auth.currentUser.getIdToken(true); // Force token refresh
    console.log('Generated token:', token ? `${token.substring(0, 10)}...` : 'No token');
    
    if (!token) {
      console.error('Failed to get authentication token');
      throw new Error('Failed to get authentication token');
    }
    
    // Garantindo que os headers sejam do tipo HeadersInit
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options?.headers || {}),
      'Authorization': `Bearer ${token}`
    };

    const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL || ''}${url}`;
    console.log('Full URL:', fullUrl);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Importante para cookies de sessão
    });

    // Se recebermos um 401, tente renovar o token e repita a requisição
    if (response.status === 401) {
      console.log('Token expired, trying to refresh...');
      const newToken = await auth.currentUser?.getIdToken(true);
      if (newToken && newToken !== token) {
        // Criar um novo objeto headers com o novo token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        };
        
        return fetch(fullUrl, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
};

// Função para obter headers de autenticação
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuth().currentUser?.getIdToken();
  
  if (!token) {
    console.error('No auth token available');
    return { 'Authorization': '' }; // Retorna um valor padrão vazio em vez de um objeto vazio
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export async function apiGet<T>(url: string): Promise<T> {
  console.log('API GET request:', url);
  const authHeaders = await getAuthHeaders();
  
  try {
    // Adiciona a base URL da API se não estiver presente
    let apiUrl = url;
    if (!url.startsWith('/api')) {
      apiUrl = `/api${url}`;
    }

    const headers: HeadersInit = {
      ...jsonHeaders,
      ...authHeaders
    };

    const response = await fetchWithAuth(apiUrl, {
      method: "GET",
      headers,
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

export async function apiPost<T>(url: string, data: any): Promise<T> {
  console.log('API POST request:', url);
  const authHeaders = await getAuthHeaders();
  
  try {
    // Adiciona a base URL da API se não estiver presente
    let apiUrl = url;
    if (!url.startsWith('/api')) {
      apiUrl = `/api${url}`;
    }

    const headers: HeadersInit = {
      ...jsonHeaders,
      ...authHeaders
    };

    const response = await fetchWithAuth(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      await handleApiError(response);
    }

    const dataResponse = await response.json();
    console.log('API response data:', dataResponse);
    return dataResponse;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Função auxiliar para tratamento de erros da API
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;
  let errorData: any = {};
  
  try {
    errorData = await response.json().catch(() => ({}));
    console.error('API error response:', errorData);
    
    // Tenta extrair uma mensagem de erro útil
    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = typeof errorData.error === 'string' 
        ? errorData.error 
        : JSON.stringify(errorData.error);
    } else if (errorData.errors) {
      // Para erros de validação
      const validationErrors = Object.values(errorData.errors).flat();
      errorMessage = validationErrors.join('\n');
    }
  } catch (parseError) {
    console.error('Error parsing error response:', parseError);
    // Se não conseguir fazer parse do JSON, usa a mensagem padrão
  }
  
  const error = new Error(errorMessage) as any;
  error.status = response.status;
  error.data = errorData;
  throw error;
}

export async function apiPut<T>(url: string, data: any): Promise<T> {
  console.log('API PUT request:', url);
  const authHeaders = await getAuthHeaders();
  
  try {
    const headers: HeadersInit = {
      ...jsonHeaders,
      ...authHeaders
    };

    const response = await fetchWithAuth(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      await handleApiError(response);
    }

    const dataResponse = await response.json();
    console.log('API response data:', dataResponse);
    return dataResponse;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

export async function apiDelete<T>(url: string): Promise<T> {
  console.log('API DELETE request:', url);
  const authHeaders = await getAuthHeaders();
  
  try {
    const headers: HeadersInit = {
      ...jsonHeaders,
      ...authHeaders
    };

    const response = await fetchWithAuth(url, {
      method: "DELETE",
      headers,
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      await handleApiError(response);
    }

    const dataResponse = await response.json();
    console.log('API response data:', dataResponse);
    return dataResponse;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Import the Company type from firebase
import { Company } from './firebase';

// Type for API responses that include company data
type ApiResponse<T> = T & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

// Type for company data in API requests/response
type CompanyData = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> & {
  id?: string;
  ownerId?: string;
};

interface ServiceData {
  id: number;
  name: string;
  description: string;
  price?: string;
  workingHours?: string;
  companyId: number;
  [key: string]: any;
}

interface JobOfferData {
  id: number;
  title: string;
  description: string;
  employmentType: string;
  salaryRange?: string;
  requirements?: string;
  contactEmail?: string;
  contactLink?: string;
  companyId: number;
  [key: string]: any;
}

// API endpoints
export const API = {
  // Companies
  getCompanies: async (): Promise<Company[]> => {
    console.log('[API] Iniciando getCompanies...');
    try {
      // Verifica se há um usuário autenticado
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error('[API] Nenhum usuário autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      // Obtém o token de forma forçada para garantir que está atualizado
      const token = await currentUser.getIdToken(true);
      console.log('[API] Token obtido:', token ? `${token.substring(0, 10)}...` : 'Sem token');
      
      if (!token) {
        console.error('[API] Falha ao obter token de autenticação');
        throw new Error('Falha na autenticação: token não disponível');
      }
      
      console.log('[API] Fazendo requisição para /api/companies');
      const response = await apiGet<{ data: Company[] }>('/api/companies');
      
      console.log('[API] Resposta recebida:', {
        status: 'success',
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0
      });
      
      if (!response || !response.data) {
        console.error('[API] Resposta inválida da API:', response);
        throw new Error('Resposta inválida do servidor');
      }
      
      return response.data;
    } catch (error) {
      console.error('[API] Erro em getCompanies:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'UnknownError'
      });
      
      // Tratamento específico para erros de autenticação
      if (error instanceof Error && error.message.includes('401')) {
        console.log('[API] Erro de autenticação, redirecionando para login...');
        // Aqui você pode adicionar lógica para redirecionar para a página de login
        // ou disparar um evento de logout
      }
      
      // Propaga o erro para ser tratado pelo componente
      throw error;
    }
  },
  
  getCompany: async (id: string): Promise<Company> => {
    const response = await apiGet<{ data: Company }>(`/api/companies/${id}`);
    return response.data;
  },
  
  createCompany: async (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> => {
    const response = await apiPost<{ data: Company }>('/api/companies', data);
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    return response.data;
  },
  
  updateCompany: async (id: string, data: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Company> => {
    const response = await apiPut<{ data: Company }>(`/api/companies/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    queryClient.invalidateQueries({ queryKey: ['/api/companies', id] });
    return response.data;
  },
  
  // Services
  getCompanyServices: async (companyId: number): Promise<ServiceData[]> => {
    return apiGet<ServiceData[]>(`/api/companies/${companyId}/services`);
  },
  
  getService: async (id: number): Promise<ServiceData> => {
    return apiGet<ServiceData>(`/api/services/${id}`);
  },
  
  createService: async (companyId: number, data: Omit<ServiceData, 'id' | 'companyId'>): Promise<ServiceData> => {
    const newService = await apiPost<ServiceData>(`/api/companies/${companyId}/services`, data);
    queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/services`] });
    return newService;
  },
  
  updateService: async (id: number, data: Partial<Omit<ServiceData, 'id' | 'companyId'>>): Promise<ServiceData> => {
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
    return apiDelete(`/api/service-images/${imageId}`);
  },
  
  // Job Offers
  getCompanyJobOffers: async (companyId: number): Promise<JobOfferData[]> => {
    return apiGet<JobOfferData[]>(`/api/companies/${companyId}/job-offers`);
  },
  
  getJobOffer: async (id: number): Promise<JobOfferData> => {
    return apiGet<JobOfferData>(`/api/job-offers/${id}`);
  },
  
  createJobOffer: async (companyId: number, data: Omit<JobOfferData, 'id' | 'companyId'>): Promise<JobOfferData> => {
    const newJobOffer = await apiPost<JobOfferData>(`/api/companies/${companyId}/job-offers`, data);
    queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/job-offers`] });
    return newJobOffer;
  },
  
  updateJobOffer: async (id: number, data: Partial<Omit<JobOfferData, 'id' | 'companyId'>>): Promise<JobOfferData> => {
    const updated = await apiPut<JobOfferData>(`/api/job-offers/${id}`, data);
    // Get the updated job offer to know which company it belongs to
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
