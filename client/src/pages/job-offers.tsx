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
  Mail, 
  Link as LinkIcon,
  AlertCircle,
  Briefcase,
  Building2
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
import { API } from "@/lib/api-fixed";

export default function JobOffers() {
  const { user } = useAuth();
  const [jobOfferToDelete, setJobOfferToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Fetch companies
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: API.getCompanies,
    enabled: !!user
  });
  
  const company = companies.length > 0 ? companies[0] : null;
  
  // Fetch job offers for this company
  const { 
    data: jobOffers = [] as any[], 
    isLoading: isLoadingJobOffers,
    refetch: refetchJobOffers
  } = useQuery({
    queryKey: ['/api/companies', company?.id, 'job-offers'],
    queryFn: () => company ? API.getCompanyJobOffers(company.id) : Promise.resolve([]),
    enabled: !!company
  });
  
  const isLoading = isLoadingCompanies || isLoadingJobOffers;

  // Delete job offer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => API.deleteJobOffer(id),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Vaga excluída com sucesso!"
      });
      refetchJobOffers();
    },
    onError: (error: Error) => {
      console.error("Error deleting job offer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a vaga",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setJobOfferToDelete(null);
    }
  });

  const handleCreateJobOffer = () => {
    if (!company) {
      toast({
        title: "Atenção",
        description: "Você precisa criar uma empresa antes de adicionar vagas",
        variant: "destructive"
      });
      navigate("/company-profile");
      return;
    }
    
    navigate("/job-offer/new");
  };

  const handleEditJobOffer = (jobOfferId: number) => {
    navigate(`/job-offer/${jobOfferId}`);
  };

  const handleDeleteClick = (jobOfferId: number) => {
    setJobOfferToDelete(jobOfferId);
  };

  const confirmDelete = async () => {
    if (jobOfferToDelete === null) return;
    deleteMutation.mutate(jobOfferToDelete);
  };

  const cancelDelete = () => {
    setJobOfferToDelete(null);
  };

  return (
    <>
      <Helmet>
        <title>Vagas - NextAuth</title>
        <meta name="description" content="Gerencie as vagas de emprego da sua empresa" />
      </Helmet>
      <DashboardLayout title="Vagas de Emprego" contentId="job-offers-content">
        <div className="flex justify-end mb-6">
          <Button onClick={handleCreateJobOffer}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Vaga
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Carregando vagas...</span>
          </div>
        ) : !company ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Empresa não encontrada</h3>
                <p className="text-gray-500 mb-4">
                  Você precisa cadastrar sua empresa antes de adicionar vagas.
                </p>
                <Button onClick={() => navigate("/company-profile")}>
                  Cadastrar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (Array.isArray(jobOffers) && jobOffers.length === 0) ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
                <p className="text-gray-500 mb-4">
                  Você ainda não cadastrou nenhuma vaga para sua empresa.
                </p>
                <Button onClick={handleCreateJobOffer}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Vaga
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.isArray(jobOffers) && jobOffers.map((jobOffer: any) => (
              <Card key={jobOffer.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-start">
                    <Briefcase className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      {jobOffer.title}
                      <Badge variant="outline" className="ml-2">
                        {jobOffer.employmentType}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {jobOffer.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobOffer.salaryRange && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium mr-1 whitespace-nowrap">Faixa salarial:</span>
                        <span className="text-sm text-gray-500">{jobOffer.salaryRange}</span>
                      </div>
                    )}
                    
                    {jobOffer.requirements && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium mr-1 whitespace-nowrap">Requisitos:</span>
                        <span className="text-sm text-gray-500 line-clamp-2">{jobOffer.requirements}</span>
                      </div>
                    )}
                    
                    {jobOffer.contactEmail && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{jobOffer.contactEmail}</span>
                      </div>
                    )}
                    
                    {jobOffer.contactLink && (
                      <div className="flex items-center">
                        <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <a 
                          href={jobOffer.contactLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {jobOffer.contactLink}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditJobOffer(jobOffer.id)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(jobOffer.id)}
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
      
      <AlertDialog open={jobOfferToDelete !== null} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente esta vaga.
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
                "Sim, excluir vaga"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}