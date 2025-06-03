import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { phoneSchema, formatPhone } from "@/lib/validation/phone";
import { Helmet } from 'react-helmet';
import { Loader2, Building2, Phone, Link as LinkIcon, MapPin, ArrowLeft } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { API } from "@/lib/api-fixed";
import { 
  createCompany, 
  updateCompany, 
  getCompanyById, 
  getUserCompanies,
  type Company
} from "@/lib/firebase";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

// Esquema de validação do formulário
type CompanyFormData = {
  name: string;
  description: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country: string;
  website?: string;
};

const companyFormSchema = z.object({
  name: z.string({
    required_error: "O nome da empresa é obrigatório",
    invalid_type_error: "O nome deve ser um texto",
  })
  .min(2, { message: "O nome deve ter pelo menos 2 caracteres" })
  .max(255, { message: "O nome não pode ter mais de 255 caracteres" })
  .trim(),
  
  description: z.string({
    required_error: "A descrição é obrigatória",
    invalid_type_error: "A descrição deve ser um texto",
  })
  .min(10, { message: "A descrição deve ter pelo menos 10 caracteres" })
  .max(2000, { message: "A descrição não pode ter mais de 2000 caracteres" })
  .trim(),
  
  nif: z.string()
    .regex(/^\d{9}$/, { message: "NIF inválido. Deve conter 9 dígitos" })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
    
  email: z.string()
    .email({ message: "Email inválido" })
    .max(255, { message: "O email não pode ter mais de 255 caracteres" })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
    
  phone: phoneSchema,
    
  address: z.string()
    .max(500, { message: "Endereço não pode ter mais de 500 caracteres" })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
    
  postalCode: z.string()
    .regex(/^\d{4}-\d{3}$/, { message: "Código Postal inválido. Use o formato XXXX-XXX" })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
    
  city: z.string()
    .max(100, { message: "A localidade não pode ter mais de 100 caracteres" })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
    
  country: z.string()
    .default("Portugal")
    .optional(),
    
  website: z.string()
    .url({ message: "URL inválida. Use o formato https://exemplo.pt" })
    .max(500, { message: "O site não pode ter mais de 500 caracteres" })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
});

type CompanyFormValues = CompanyFormData;

export default function CompanyProfile() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/company-profile/:id');
  const id = params?.id;
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      nif: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      city: "",
      country: "Portugal",
      website: "",
    }
  });

  // Adicionando estado para controlar o carregamento
  const [isFetching, setIsFetching] = useState(false);

  // Fetch companies
  const { 
    data: companies, 
    isLoading: isLoadingCompanies, 
    isError,
    error: companiesError
  } = useQuery<Company[]>({
    queryKey: ['companies', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return []
      try {
        const userCompanies = await getUserCompanies(user.uid)
        return userCompanies
      } catch (error) {
        console.error("Error fetching companies:", error)
        throw error
      }
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retryOnMount: false
  })

  // Pega a primeira empresa (ou null se não houver)
  const company = companies?.[0] || null;
  console.log('Current company:', company);

  // Função para formatar NIF (adiciona pontos)
  const formatNIF = (value: string) => {
    if (!value) return '';
    // Remove tudo que não for dígito
    const numbers = value.replace(/\D/g, '');
    // Limita a 9 dígitos
    const limited = numbers.slice(0, 9);
    // Formata como 123.456.789
    return limited.replace(/(\d{3})(?=\d)/g, '$1.').replace(/(\.\d{3})(\d)/, '$1$2');
  };

  // Função para formatar CEP (adiciona hífen)
  const formatPostalCode = (value: string) => {
    if (!value) return '';
    // Remove tudo que não for dígito
    const numbers = value.replace(/\D/g, '');
    // Limita a 7 dígitos
    const limited = numbers.slice(0, 7);
    // Formata como 1234-567
    if (limited.length <= 4) return limited;
    return `${limited.slice(0, 4)}-${limited.slice(4)}`;
  };

  // Função formatPhone agora está importada de @/lib/validation/phone

  // Tipos para erros da API
  interface ApiError extends Error {
    status?: number;
    data?: {
      message?: string;
      [key: string]: any;
    };
  }

  // Tipo para os dados de resposta da API
  interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
  }

  // Função para extrair mensagem de erro da API
  const getErrorMessage = (error: unknown): { title: string; message: string } => {
    console.error('Erro na API:', error);

    // Mensagens padrão
    let title = 'Erro';
    let message = 'Ocorreu um erro inesperado. Por favor, tente novamente.';

    // Se for um erro de validação do Zod
    if (error instanceof z.ZodError) {
      return {
        title: 'Dados inválidos',
        message: error.errors.map(e => e.message).join('\n')
      };
    }

    // Se for um erro da API
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ApiError;
      const status = apiError.status || 500;

      switch(status) {
        case 400:
          title = 'Dados inválidos';
          message = apiError.data?.message || 'Verifique os campos e tente novamente.';
          break;
        case 401:
        case 403:
          title = 'Acesso não autorizado';
          message = 'Você não tem permissão para realizar esta ação.';
          break;
        case 404:
          title = 'Recurso não encontrado';
          message = 'A empresa solicitada não foi encontrada.';
          break;
        case 409:
          title = 'Conflito';
          message = 'Já existe uma empresa com estes dados.';
          break;
        case 500:
          title = 'Erro no servidor';
          message = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
          break;
        default:
          message = apiError.data?.message || message;
      }
    } 
    // Se for um erro genérico
    else if (error instanceof Error) {
      message = error.message;
    }

    return { title, message };
  };

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // O Firebase irá definir os timestamps server-side
      const companyData = {
        ...data,
        country: data.country || 'Portugal',
        ownerId: user.uid
        // createdAt e updatedAt serão definidos pelo Firebase
      };

      console.log('Creating company with data:', companyData);
      await createCompany(companyData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Empresa criada com sucesso!",
        variant: "default"
      });
      setLocation('/dashboard');
    },
    onError: (error: Error) => {
      const { title, message } = getErrorMessage(error);
      toast({
        title,
        description: message,
        variant: "destructive"
      });
    }
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>> }) => {
      console.log('Updating company with data:', { id, data });
      // O Firebase irá atualizar o campo updatedAt automaticamente
      await updateCompany(id, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Empresa atualizada com sucesso!",
        variant: "default"
      });
      // Recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['companies', user?.uid] });
    },
    onError: (error: Error) => {
      const { title, message } = getErrorMessage(error);
      toast({
        title,
        description: message,
        variant: "destructive"
      });
    }
  });

  // Show welcome message for new users
  useEffect(() => {
    // Só mostra a mensagem se não estiver carregando, não houver erro e não houver empresas
    if (!isLoadingCompanies && !isError && (!companies || companies.length === 0) && user) {
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');

      if (!hasSeenWelcome) {
        toast({
          title: "Bem-vindo!",
          description: "Parece que você ainda não tem uma empresa cadastrada. Preencha os dados abaixo para começar.",
          variant: "default"
        });
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }
    }
  }, [isLoadingCompanies, isError, companies, toast, user]);

  // Set form default values when company data is loaded
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || '',
        description: company.description || '',
        nif: company.nif ? formatNIF(company.nif) : '',
        email: company.email || '',
        phone: company.phone ? formatPhone(company.phone) : '',
        address: company.address || '',
        postalCode: company.postalCode ? formatPostalCode(company.postalCode) : '',
        city: company.city || '',
        country: company.country || 'Portugal',
        website: company.website || '',
      });
    } else {
      // Reset form to default values when no company exists
      form.reset({
        name: "",
        description: "",
        nif: "",
        email: "",
        phone: "",
        address: "",
        postalCode: "",
        city: "",
        country: "Portugal",
        website: "",
      });
    }
  }, [company, form]);

  // Show loading state
  if (isFetching && (!companies || companies.length === 0)) {
    return (
      <DashboardLayout title="Carregando..." contentId="company-profile-content">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Carregando informações da empresa...</span>
        </div>
      </DashboardLayout>
    );
  }

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user?.uid) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Busca as empresas do usuário
      const userCompanies = await getUserCompanies(user.uid);
      
      // Prepara os dados da empresa, convertendo strings vazias para null (Firebase não aceita undefined)
      const prepareValue = (value: string | undefined | null): string | null => {
        if (value === null || value === undefined) return null;
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      };
      
      const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        description: data.description,
        nif: prepareValue(data.nif?.replace(/\D/g, '')),
        email: prepareValue(data.email),
        phone: prepareValue(data.phone?.replace(/\D/g, '')),
        address: prepareValue(data.address),
        postalCode: prepareValue(data.postalCode?.replace(/\D/g, '')),
        city: prepareValue(data.city),
        country: data.country || 'Portugal',
        website: prepareValue(data.website),
        // Campos removidos do front-end, mas mantidos na interface para compatibilidade
        caeCode: null,
        constitutionDate: null,
        shareCapital: null,
        // Campos obrigatórios
        ownerId: user.uid
      };

      if (userCompanies && userCompanies.length > 0 && userCompanies[0].id) {
        // Atualiza a empresa existente
        // O Firebase irá atualizar o campo updatedAt automaticamente
        await updateCompanyMutation.mutateAsync({
          id: userCompanies[0].id,
          data: companyData
        });
      } else {
        // Cria uma nova empresa
        await createCompanyMutation.mutateAsync(companyData);
      }
    } catch (error) {
      console.error("Erro ao processar o formulário:", error);
      
      // Se o erro não for tratado pelas mutações, exibe uma mensagem genérica
      if (!(error instanceof Error && error.message.includes("já possui uma empresa cadastrada"))) {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{company ? "Editar Empresa" : "Cadastrar Empresa"} - Systems RBG</title>
        <meta name="description" content="Gerencie as informações da sua empresa" />
      </Helmet>
      <DashboardLayout title={company ? "Perfil da Empresa" : "Cadastrar Empresa"} contentId="company-profile-content">
        {isLoadingCompanies ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                {company ? "Editar perfil da empresa" : "Cadastrar nova empresa"}
              </CardTitle>
              <CardDescription>
                {company 
                  ? "Atualize as informações da sua empresa" 
                  : "Preencha os dados abaixo para cadastrar sua empresa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Nome da Empresa */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da empresa*</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o nome da sua empresa" 
                            disabled={isLoading}
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e.target.value || '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Descrição */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Forneça uma descrição sobre sua empresa" 
                            className="min-h-[120px]"
                            disabled={isLoading}
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e.target.value || '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Primeira linha de campos - NIF, Email, Telefone */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* NIF */}
                    <FormField
                      control={form.control}
                      name="nif"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIF*</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123.456.789" 
                              disabled={isLoading}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Remove formatação existente
                                const numbers = value.replace(/\D/g, '');
                                // Aplica a formatação apenas se houver valor
                                const formatted = numbers ? formatNIF(numbers) : '';
                                field.onChange(formatted || '');
                              }}
                              onBlur={() => {
                                // Garante que o valor seja válido ao sair do campo
                                if (field.value && !/^\d{9}$/.test(field.value.replace(/\D/g, ''))) {
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email*</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="empresa@exemplo.pt" 
                              disabled={isLoading}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e.target.value || '');
                              }}
                              onBlur={() => {
                                // Valida o formato do e-mail ao sair do campo
                                if (field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Telefone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Phone className="mr-1 h-4 w-4" />
                            <span>Telefone <span className="text-muted-foreground text-xs">(opcional)</span></span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="912 345 678 ou +351 912 345 678" 
                              disabled={isLoading}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Remove formatação existente e limita o comprimento
                                const numbers = value.replace(/\D/g, '').slice(0, 15);
                                // Aplica a formatação apenas se houver valor
                                const formatted = numbers ? formatPhone(numbers) : '';
                                // Atualiza o valor do campo
                                field.onChange(formatted || '');
                              }}
                              onBlur={() => {
                                // Garante que o valor seja válido ao sair do campo
                                if (field.value && !/^(\+\d{1,3} ?)?\d{9,15}$/.test(field.value.replace(/\s+/g, ''))) {
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Segunda linha - Código Postal, Localidade, País */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Código Postal */}
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Postal*</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1000-001" 
                              disabled={isLoading}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Remove formatação existente
                                const numbers = value.replace(/\D/g, '');
                                // Aplica a formatação apenas se houver valor
                                const formatted = numbers ? formatPostalCode(numbers) : '';
                                field.onChange(formatted || '');
                              }}
                              onBlur={() => {
                                // Garante que o valor seja válido ao sair do campo
                                if (field.value && !/^\d{4}-\d{3}$/.test(field.value)) {
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Localidade */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localidade*</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Lisboa" 
                              disabled={isLoading}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e.target.value || '');
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* País */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País*</FormLabel>
                          <FormControl>
                            <Input 
                              disabled
                              value={field.value || 'Portugal'}
                              onChange={(e) => {
                                field.onChange(e.target.value || 'Portugal');
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Endereço Completo */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> Endereço Completo*
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Rua, número, andar, etc." 
                            disabled={isLoading}
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e.target.value || '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Terceira linha - Website */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
                    {/* Website */}
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <LinkIcon className="mr-1 h-4 w-4" /> Website
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.empresa.pt" 
                              disabled={isLoading}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e.target.value || '');
                              }}
                              onBlur={() => {
                                // Valida o formato da URL ao sair do campo
                                if (field.value && !/^https?:\/\/.+\..+/.test(field.value)) {
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <CardFooter className="flex justify-between px-0 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => window.history.back()}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {company ? "Atualizando..." : "Cadastrando..."}
                        </>
                      ) : (
                        <>{company ? "Atualizar empresa" : "Cadastrar empresa"}</>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </DashboardLayout>
    </>
  );
}