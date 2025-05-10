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
import { Company, createCompany, getUserCompanies, updateCompany } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  const [isFetching, setIsFetching] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
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

  useEffect(() => {
    const fetchCompany = async () => {
      if (user) {
        try {
          const companies = await getUserCompanies(user.uid);
          if (companies.length > 0) {
            const companyData = companies[0];
            setCompany(companyData);
            
            // Set form values
            form.reset({
              name: companyData.name || "",
              description: companyData.description || "",
              cnpj: companyData.cnpj || "",
              address: companyData.address || "",
              phone: companyData.phone || "",
              website: companyData.website || "",
            });
          }
        } catch (error) {
          console.error("Error fetching company:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados da empresa",
            variant: "destructive"
          });
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchCompany();
  }, [user, form, toast]);

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (company) {
        // Update existing company
        await updateCompany(company.id!, data);
        toast({
          title: "Sucesso",
          description: "Perfil da empresa atualizado com sucesso!",
        });
      } else {
        // Create new company
        const newCompany = await createCompany({
          ...data,
          ownerId: user.uid,
        });
        setCompany(newCompany);
        toast({
          title: "Sucesso",
          description: "Empresa criada com sucesso!",
        });
      }
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar os dados da empresa",
        variant: "destructive",
      });
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