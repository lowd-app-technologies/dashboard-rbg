import { useState, useEffect, useRef } from "react";
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
import { Loader2, Trash2, Upload, ImagePlus, AlarmClock, DollarSign, Store } from "lucide-react";
import { 
  Service, 
  createService,
  updateService,
  getServiceById,
  uploadServiceImage,
  getUserCompanies,
} from "@/lib/firebase";
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
  const { id } = useParams<{ id: string }>();
  const isNewService = id === "new";
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!isNewService);
  const [service, setService] = useState<Service | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      workingHours: "",
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
              description: "Você precisa cadastrar uma empresa antes de adicionar serviços",
              variant: "destructive"
            });
            navigate("/company-profile");
            return;
          }
          
          setCompanyId(companies[0].id!);
          
          // If editing an existing service, fetch it
          if (!isNewService && id) {
            fetchService(id);
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
  }, [user, id, isNewService, toast, navigate]);

  const fetchService = async (serviceId: string) => {
    try {
      const serviceData = await getServiceById(serviceId);
      if (!serviceData) {
        toast({
          title: "Erro",
          description: "Serviço não encontrado",
          variant: "destructive"
        });
        navigate("/services");
        return;
      }
      
      setService(serviceData);
      setImages(serviceData.images || []);
      
      // Set form values
      form.reset({
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price || "",
        workingHours: serviceData.workingHours || "",
      });
    } catch (error) {
      console.error("Error fetching service:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do serviço",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: ServiceFormValues) => {
    if (!user || !companyId) return;
    
    setIsLoading(true);
    try {
      if (isNewService) {
        // Create new service
        const newService = await createService({
          ...data,
          companyId,
          images,
        });
        
        toast({
          title: "Sucesso",
          description: "Serviço criado com sucesso!",
        });
        
        // Navigate to the edit page to allow adding images
        navigate(`/service/${newService.id}`);
      } else if (service) {
        // Update existing service
        await updateService(service.id!, {
          ...data,
          images,
        });
        
        toast({
          title: "Sucesso",
          description: "Serviço atualizado com sucesso!",
        });
      }
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar os dados do serviço",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !companyId || !service?.id) return;
    
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
    try {
      const imageUrl = await uploadServiceImage(companyId, service.id, file);
      
      // Add the new image URL to the list
      const newImages = [...images, imageUrl];
      setImages(newImages);
      
      // Update the service with the new image list
      await updateService(service.id, { images: newImages });
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    if (!service?.id) return;
    
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    
    try {
      await updateService(service.id, { images: newImages });
      
      toast({
        title: "Sucesso",
        description: "Imagem removida com sucesso!",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a imagem",
        variant: "destructive",
      });
    }
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
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando imagem...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
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