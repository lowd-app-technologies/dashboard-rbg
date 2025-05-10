import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Helmet } from 'react-helmet';
import { Loader2, Mail, Link as LinkIcon, DollarSign, FileText, Briefcase, UserCheck } from "lucide-react";
import { 
  JobOffer, 
  createJobOffer,
  updateJobOffer,
  getJobOfferById,
  getUserCompanies,
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";

const jobOfferFormSchema = z.object({
  title: z.string().min(5, { message: "Título da vaga deve ter pelo menos 5 caracteres" }),
  description: z.string().min(20, { message: "Descrição deve ter pelo menos 20 caracteres" }),
  employmentType: z.string().min(1, { message: "Selecione o tipo de contratação" }),
  salaryRange: z.string().optional(),
  requirements: z.string().optional(),
  contactEmail: z.string().email({ message: "Digite um email válido" }).optional().or(z.literal('')),
  contactLink: z.string().url({ message: "Digite uma URL válida" }).optional().or(z.literal('')),
});

type JobOfferFormValues = z.infer<typeof jobOfferFormSchema>;

export default function JobOfferPage() {
  const { id } = useParams<{ id: string }>();
  const isNewJobOffer = id === "new";
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!isNewJobOffer);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const form = useForm<JobOfferFormValues>({
    resolver: zodResolver(jobOfferFormSchema),
    defaultValues: {
      title: "",
      description: "",
      employmentType: "",
      salaryRange: "",
      requirements: "",
      contactEmail: "",
      contactLink: "",
    },
  });

  // Fetch user's company first
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user) {
        try {
          const companies = await getUserCompanies(user.uid);
          if (companies.length === 0) {
            toast({
              title: "Atenção",
              description: "Você precisa cadastrar uma empresa antes de adicionar vagas",
              variant: "destructive"
            });
            navigate("/company-profile");
            return;
          }
          
          setCompanyId(companies[0].id!);
          
          // If editing an existing job offer, fetch it
          if (!isNewJobOffer && id) {
            fetchJobOffer(id);
          } else {
            setIsFetching(false);
          }
        } catch (error) {
          console.error("Error fetching company:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados da empresa",
            variant: "destructive"
          });
          setIsFetching(false);
        }
      }
    };

    fetchCompanyId();
  }, [user, id, isNewJobOffer, toast, navigate]);

  const fetchJobOffer = async (jobOfferId: string) => {
    try {
      const jobOfferData = await getJobOfferById(jobOfferId);
      if (!jobOfferData) {
        toast({
          title: "Erro",
          description: "Vaga de trabalho não encontrada",
          variant: "destructive"
        });
        navigate("/job-offers");
        return;
      }
      
      setJobOffer(jobOfferData);
      
      // Set form values
      form.reset({
        title: jobOfferData.title,
        description: jobOfferData.description,
        employmentType: jobOfferData.employmentType,
        salaryRange: jobOfferData.salaryRange || "",
        requirements: jobOfferData.requirements || "",
        contactEmail: jobOfferData.contactEmail || "",
        contactLink: jobOfferData.contactLink || "",
      });
    } catch (error) {
      console.error("Error fetching job offer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da vaga",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: JobOfferFormValues) => {
    if (!user || !companyId) return;
    
    setIsLoading(true);
    try {
      if (isNewJobOffer) {
        // Create new job offer
        await createJobOffer({
          ...data,
          companyId,
        });
        
        toast({
          title: "Sucesso",
          description: "Vaga de trabalho criada com sucesso!",
        });
        
        // Navigate back to the job offers list
        navigate("/job-offers");
      } else if (jobOffer) {
        // Update existing job offer
        await updateJobOffer(jobOffer.id!, {
          ...data,
        });
        
        toast({
          title: "Sucesso",
          description: "Vaga de trabalho atualizada com sucesso!",
        });
        
        // Navigate back to the job offers list
        navigate("/job-offers");
      }
    } catch (error: any) {
      console.error("Error saving job offer:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar os dados da vaga",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const employmentTypes = [
    { value: "CLT", label: "CLT (Tempo Integral)" },
    { value: "PJ", label: "Pessoa Jurídica" },
    { value: "Estágio", label: "Estágio" },
    { value: "Freelancer", label: "Freelancer" },
    { value: "Temporário", label: "Temporário" },
    { value: "Meio Período", label: "Meio Período" },
  ];

  return (
    <>
      <Helmet>
        <title>
          {isNewJobOffer ? "Nova Vaga de Trabalho" : "Editar Vaga de Trabalho"} - NextAuth
        </title>
        <meta name="description" content="Cadastre ou edite uma vaga de trabalho da sua empresa" />
      </Helmet>
      <DashboardLayout 
        title={isNewJobOffer ? "Nova Vaga de Trabalho" : "Editar Vaga de Trabalho"} 
        contentId="job-offer-content"
      >
        {isFetching ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                {isNewJobOffer ? "Cadastrar nova vaga" : "Editar vaga de trabalho"}
              </CardTitle>
              <CardDescription>
                {isNewJobOffer 
                  ? "Preencha os dados abaixo para cadastrar uma nova vaga de trabalho" 
                  : "Atualize as informações da vaga de trabalho"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da vaga*</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Desenvolvedor Full-Stack" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de contratação*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de contratação" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employmentTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="salaryRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <DollarSign className="mr-1 h-4 w-4" /> Faixa salarial
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: R$ 3.000 - R$ 5.000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <FileText className="mr-1 h-4 w-4" /> Descrição da vaga*
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detalhe as responsabilidades e atividades da vaga" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <UserCheck className="mr-1 h-4 w-4" /> Requisitos
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Liste as habilidades, experiências e qualificações necessárias" 
                            className="min-h-[100px]"
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
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Mail className="mr-1 h-4 w-4" /> Email para contato
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="rh@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <LinkIcon className="mr-1 h-4 w-4" /> Link para candidatura
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://exemplo.com/vagas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <CardFooter className="flex justify-end px-0">
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate("/job-offers")}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isNewJobOffer ? "Cadastrando..." : "Atualizando..."}
                          </>
                        ) : (
                          <>{isNewJobOffer ? "Cadastrar vaga" : "Atualizar vaga"}</>
                        )}
                      </Button>
                    </div>
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