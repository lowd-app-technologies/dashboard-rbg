import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from 'react-helmet';
import { 
  Loader2, 
  Plus, 
  FileEdit, 
  Trash2, 
  Clock, 
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API } from "@/lib/api-new";

export default function Services() {
  const { user } = useAuth();
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Fetch companies
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: API.getCompanies,
    enabled: !!user
  });
  
  const company = companies.length > 0 ? companies[0] : null;
  
  // Fetch services for this company
  const { 
    data: services = [] as any[], 
    isLoading: isLoadingServices,
    refetch: refetchServices
  } = useQuery({
    queryKey: ['/api/companies', company?.id, 'services'],
    queryFn: () => company ? API.getCompanyServices(company.id) : Promise.resolve([]),
    enabled: !!company
  });
  
  const isLoading = isLoadingCompanies || isLoadingServices;

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => API.deleteService(id),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso!"
      });
      refetchServices();
    },
    onError: (error: Error) => {
      console.error("Error deleting service:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setServiceToDelete(null);
    }
  });

  const handleCreateService = () => {
    if (!company) {
      toast({
        title: "Atenção",
        description: "Você precisa criar uma empresa antes de adicionar serviços",
        variant: "destructive"
      });
      navigate("/company-profile");
      return;
    }
    
    navigate("/service/new");
  };

  const handleEditService = (serviceId: number) => {
    navigate(`/service/${serviceId}`);
  };

  const handleDeleteClick = (serviceId: number) => {
    setServiceToDelete(serviceId);
  };

  const confirmDelete = async () => {
    if (serviceToDelete === null) return;
    deleteMutation.mutate(serviceToDelete);
  };

  const cancelDelete = () => {
    setServiceToDelete(null);
  };

  return (
    <>
      <Helmet>
        <title>Serviços - NextAuth</title>
        <meta name="description" content="Gerencie os serviços da sua empresa" />
      </Helmet>
      <DashboardLayout title="Serviços" contentId="services-content">
        <div className="flex justify-end mb-6">
          <Button onClick={handleCreateService}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Carregando serviços...</span>
          </div>
        ) : !company ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Empresa não encontrada</h3>
                <p className="text-gray-500 mb-4">
                  Você precisa cadastrar sua empresa antes de adicionar serviços.
                </p>
                <Button onClick={() => navigate("/company-profile")}>
                  Cadastrar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
                <p className="text-gray-500 mb-4">
                  Você ainda não cadastrou nenhum serviço para sua empresa.
                </p>
                <Button onClick={handleCreateService}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Serviço
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                {service.images && service.images.length > 0 ? (
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={service.images[0]} 
                      alt={service.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{service.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {Array.isArray(service.images) ? service.images.length : 0} foto(s)
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {service.price && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Valor: {service.price}</span>
                      </div>
                    )}
                    {service.workingHours && (
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Horário: {service.workingHours}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditService(service.id)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(service.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>
      
      <AlertDialog open={serviceToDelete !== null} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço
              e todas as suas imagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir serviço"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}