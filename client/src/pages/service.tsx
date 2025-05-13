import { useState, useRef } from "react";
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
import { Loader2, Trash2, ImagePlus, AlarmClock, DollarSign, Store } from "lucide-react";
import { API } from "@/lib/api-fixed";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";

const serviceFormSchema = z.object({
  name: z.string().min(2, { message: "Nome do serviço deve ter pelo menos 2 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  price: z.string().optional(),
  workingHours: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function ServicePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "new";
  const isNewService = id === "new";
  const serviceId = isNewService ? null : Number(id);
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form setup
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      workingHours: "",
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
  
  // Fetch service if editing
  const { 
    data: service, 
    isLoading: isLoadingService 
  } = useQuery({
    queryKey: ['/api/services', serviceId],
    queryFn: () => serviceId ? API.getService(serviceId) : Promise.resolve(null),
    enabled: !isNewService && serviceId !== null,
    onSuccess: (data) => {
      if (data) {
        setImages(Array.isArray(data.images) ? data.images : []);
        form.reset({
          name: data.name,
          description: data.description,
          price: data.price || "",
          workingHours: data.workingHours || "",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do serviço",
        variant: "destructive"
      });
      navigate("/services");
    }
  });
  
  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceFormValues) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      return API.createService(companyId, {
        ...data,
        images: []
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso!",
      });
      navigate(`/service/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o serviço",
        variant: "destructive",
      });
    }
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: (data: ServiceFormValues) => {
      if (!serviceId) throw new Error("ID do serviço inválido");
      return API.updateService(serviceId, {
        ...data,
        images
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar o serviço",
        variant: "destructive",
      });
    }
  });
  
  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!serviceId || !companyId) throw new Error("Dados inválidos");
      
      // TODO: Implement actual file upload with API.addServiceImage
      // For now, we'll create a fake URL
      return `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/600`;
    },
    onSuccess: (imageUrl) => {
      const newImages = [...images, imageUrl];
      setImages(newImages);
      
      // Update service with new image list
      if (serviceId) {
        API.updateService(serviceId, { images: newImages });
      }
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem",
        variant: "destructive",
      });
    }
  });
  
  // Loading state
  const isFetching = isLoadingCompanies || (isLoadingService && !isNewService);
  const isLoading = createServiceMutation.isPending || updateServiceMutation.isPending;
  
  const onSubmit = (data: ServiceFormValues) => {
    if (isNewService) {
      createServiceMutation.mutate(data);
    } else {
      updateServiceMutation.mutate(data);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Erro",
        description: "O tamanho máximo da imagem é 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    uploadImageMutation.mutate(file);
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    if (!serviceId) return;
    
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    
    // Update service with new image list
    API.updateService(serviceId, { images: newImages })
      .then(() => {
        toast({
          title: "Sucesso",
          description: "Imagem removida com sucesso!",
        });
      })
      .catch((error) => {
        toast({
          title: "Erro",
          description: "Não foi possível remover a imagem",
          variant: "destructive",
        });
      });
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <Helmet>
        <title>{isNewService ? "Novo Serviço" : "Editar Serviço"} - NextAuth</title>
        <meta name="description" content="Cadastre ou edite um serviço da sua empresa" />
      </Helmet>
      <DashboardLayout title={isNewService ? "Novo Serviço" : "Editar Serviço"} contentId="service-content">
        {isFetching ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Service Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  {isNewService ? "Cadastrar novo serviço" : "Editar serviço"}
                </CardTitle>
                <CardDescription>
                  {isNewService 
                    ? "Preencha os dados abaixo para cadastrar um novo serviço" 
                    : "Atualize as informações do serviço"}
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
                          <FormLabel>Nome do serviço*</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome do serviço" {...field} />
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
                              placeholder="Forneça uma descrição detalhada do serviço" 
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
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4" /> Valor
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="R$ 0,00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="workingHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <AlarmClock className="mr-1 h-4 w-4" /> Horário de funcionamento
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Seg-Sex: 9h às 18h" {...field} />
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
                          onClick={() => navigate("/services")}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isNewService ? "Cadastrando..." : "Atualizando..."}
                            </>
                          ) : (
                            <>{isNewService ? "Cadastrar serviço" : "Atualizar serviço"}</>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Images Section - Only show for existing services */}
            {!isNewService && service && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImagePlus className="h-5 w-5 mr-2" />
                    Imagens do serviço
                  </CardTitle>
                  <CardDescription>
                    Adicione imagens para ilustrar o seu serviço
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Current images */}
                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image} 
                            alt={`Imagem ${index + 1}`} 
                            className="aspect-video object-cover w-full h-full rounded-md"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 rounded-md mb-6">
                      <ImagePlus className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Nenhuma imagem adicionada ainda
                      </p>
                    </div>
                  )}
                  
                  {/* Upload button */}
                  <Button 
                    type="button" 
                    onClick={triggerFileInput}
                    disabled={uploadImageMutation.isPending}
                    className="w-full"
                  >
                    {uploadImageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando imagem...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Adicionar imagem
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DashboardLayout>
    </>
  );
}