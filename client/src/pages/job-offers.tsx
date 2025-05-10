import { useState, useEffect } from "react";
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
import { 
  JobOffer, 
  Company, 
  getUserCompanies, 
  getCompanyJobOffers, 
  deleteJobOffer
} from "@/lib/firebase";
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

export default function JobOffers() {
  const { user } = useAuth();
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // First get the user's company
          const companies = await getUserCompanies(user.uid);
          
          if (companies.length === 0) {
            // User doesn't have a company yet
            setIsLoading(false);
            return;
          }
          
          const companyData = companies[0];
          setCompany(companyData);
          
          // Then get the company's job offers
          const jobOffersData = await getCompanyJobOffers(companyData.id!);
          setJobOffers(jobOffersData);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as vagas de trabalho",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, toast]);

  const handleCreateJob = () => {
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

  const handleEditJob = (jobId: string) => {
    navigate(`/job-offer/${jobId}`);
  };

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteJobOffer(jobToDelete);
      
      // Update the job offers list
      setJobOffers(jobOffers.filter(job => job.id !== jobToDelete));
      
      toast({
        title: "Sucesso",
        description: "Vaga de trabalho excluída com sucesso!"
      });
    } catch (error) {
      console.error("Error deleting job offer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a vaga de trabalho",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setJobToDelete(null);
    }
  };

  const cancelDelete = () => {
    setJobToDelete(null);
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <>
      <Helmet>
        <title>Vagas de Trabalho - NextAuth</title>
        <meta name="description" content="Gerencie as vagas de trabalho da sua empresa" />
      </Helmet>
      <DashboardLayout title="Vagas de Trabalho" contentId="job-offers-content">
        <div className="flex justify-end mb-6">
          <Button onClick={handleCreateJob}>
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
                  Você precisa cadastrar sua empresa antes de adicionar vagas de trabalho.
                </p>
                <Button onClick={() => navigate("/company-profile")}>
                  Cadastrar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : jobOffers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
                <p className="text-gray-500 mb-4">
                  Você ainda não cadastrou nenhuma vaga de trabalho para sua empresa.
                </p>
                <Button onClick={handleCreateJob}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Vaga
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobOffers.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{job.title}</CardTitle>
                    <Badge>{job.employmentType}</Badge>
                  </div>
                  <CardDescription>
                    {job.salaryRange && (
                      <span className="font-semibold block">{job.salaryRange}</span>
                    )}
                    <span className="flex items-center mt-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {company.name}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Descrição:</h4>
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {job.description}
                      </p>
                    </div>
                    
                    {job.requirements && (
                      <div>
                        <h4 className="text-sm font-medium">Requisitos:</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {job.requirements}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {job.contactEmail && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="truncate">{job.contactEmail}</span>
                        </div>
                      )}
                      {job.contactLink && (
                        <div className="flex items-center text-sm">
                          <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <a 
                            href={job.contactLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline truncate"
                          >
                            {truncateText(job.contactLink, 30)}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditJob(job.id!)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(job.id!)}
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
      
      <AlertDialog open={jobToDelete !== null} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a vaga
              de trabalho selecionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
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