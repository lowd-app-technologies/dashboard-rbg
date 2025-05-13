import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Helmet } from 'react-helmet';
import { Loader2, Building2, Phone, Link as LinkIcon, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API } from "@/lib/api";

const companyFormSchema = z.object({
  name: z.string().min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url({ message: "Digite uma URL válida" }).optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      cnpj: "",
      address: "",
      phone: "",
      website: "",
    },
  });

  // Fetch companies
  const { data: companies, isLoading: isFetching, error } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: API.getCompanies,
    enabled: !!user
  });
  
  const company = companies && companies.length > 0 ? companies[0] : null;

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyFormValues) => API.createCompany(data),
    onSuccess: (newCompany) => {
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar a empresa",
        variant: "destructive",
      });
    }
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: CompanyFormValues }) => 
      API.updateCompany(id, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Perfil da empresa atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar a empresa",
        variant: "destructive",
      });
    }
  });

  // Set form values when company data is loaded
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        description: company.description || "",
        cnpj: company.cnpj || "",
        address: company.address || "",
        phone: company.phone || "",
        website: company.website || "",
      });
    }
  }, [company, form]);

  // Handle error from the query
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (company) {
        // Update existing company
        await updateCompanyMutation.mutateAsync({ id: company.id, data });
      } else {
        // Create new company
        await createCompanyMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error("Error saving company:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{company ? "Editar Empresa" : "Cadastrar Empresa"} - NextAuth</title>
        <meta name="description" content="Gerencie as informações da sua empresa" />
      </Helmet>
      <DashboardLayout title={company ? "Perfil da Empresa" : "Cadastrar Empresa"} contentId="company-profile-content">
        {isFetching ? (
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da empresa*</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome da sua empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="XX.XXX.XXX/0001-XX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Phone className="mr-1 h-4 w-4" /> Telefone
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" /> Endereço
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro, cidade/UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <LinkIcon className="mr-1 h-4 w-4" /> Website
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.seusite.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <CardFooter className="flex justify-end px-0">
                    <Button type="submit" disabled={isLoading}>
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