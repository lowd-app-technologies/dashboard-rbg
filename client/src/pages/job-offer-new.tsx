import { useState } from "react";
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
import { API } from "@/lib/api-fixed";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const params = useParams<{ id: string }>();
  const id = params?.id || "new";
  const isNewJobOffer = id === "new";
  const jobOfferId = isNewJobOffer ? null : Number(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Form setup
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
  
  // Fetch companies
  const { 
    data: companies = [], 
    isLoading: isLoadingCompanies 
  } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: API.getCompanies,
    enabled: !!user,
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa",
        variant: "destructive"
      });
    }
  });
  
  const company = companies.length > 0 ? companies[0] : null;
  const companyId = company?.id || null;
  
  // Fetch job offer if editing
  const { 
    data: jobOffer, 
    isLoading: isLoadingJobOffer 
  } = useQuery({
    queryKey: ['/api/job-offers', jobOfferId],
    queryFn: () => jobOfferId ? API.getJobOffer(jobOfferId) : Promise.resolve(null),
    enabled: !isNewJobOffer && jobOfferId !== null,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          title: data.title,
          description: data.description,
          employmentType: data.employmentType,
          salaryRange: data.salaryRange || "",
          requirements: data.requirements || "",
          contactEmail: data.contactEmail || "",
          contactLink: data.contactLink || "",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da vaga",
        variant: "destructive"
      });
      navigate("/job-offers");
    }
  });
  
  // Create job offer mutation
  const createJobOfferMutation = useMutation({
    mutationFn: (data: JobOfferFormValues) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      return API.createJobOffer(companyId, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Vaga criada com sucesso!",
      });
      navigate("/job-offers");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar a vaga",
        variant: "destructive",
      });
    }
  });
  
  // Update job offer mutation
  const updateJobOfferMutation = useMutation({
    mutationFn: (data: JobOfferFormValues) => {
      if (!jobOfferId) throw new Error("ID da vaga inválido");
      return API.updateJobOffer(jobOfferId, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Vaga atualizada com sucesso!",
      });
      navigate("/job-offers");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar a vaga",
        variant: "destructive",
      });
    }
  });
  
  // Loading state
  const isFetching = isLoadingCompanies || (isLoadingJobOffer && !isNewJobOffer);
  const isLoading = createJobOfferMutation.isPending || updateJobOfferMutation.isPending;
  
  const onSubmit = (data: JobOfferFormValues) => {
    if (isNewJobOffer) {
      createJobOfferMutation.mutate(data);
    } else {
      updateJobOfferMutation.mutate(data);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isNewJobOffer ? "Nova Vaga" : "Editar Vaga"} - NextAuth</title>
        <meta name="description" content="Cadastre ou edite uma vaga de emprego da sua empresa" />
      </Helmet>
      <DashboardLayout title={isNewJobOffer ? "Nova Vaga" : "Editar Vaga"} contentId="job-offer-content">
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
                {isNewJobOffer ? "Cadastrar nova vaga" : "Editar vaga"}
              </CardTitle>
              <CardDescription>
                {isNewJobOffer 
                  ? "Preencha os dados abaixo para cadastrar uma nova vaga" 
                  : "Atualize as informações da vaga"}
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
                          <Input placeholder="Ex: Desenvolvedor Full Stack" {...field} />
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
                            placeholder="Forneça uma descrição detalhada da vaga e das responsabilidades" 
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
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CLT">CLT</SelectItem>
                              <SelectItem value="PJ">PJ</SelectItem>
                              <SelectItem value="Estágio">Estágio</SelectItem>
                              <SelectItem value="Temporário">Temporário</SelectItem>
                              <SelectItem value="Freelancer">Freelancer</SelectItem>
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
                            <Input placeholder="Ex: R$ 3.000 - R$ 4.500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                            placeholder="Liste os requisitos e habilidades necessárias" 
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
                            <Input placeholder="contato@empresa.com" {...field} />
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
                            <LinkIcon className="mr-1 h-4 w-4" /> Link de inscrição
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
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