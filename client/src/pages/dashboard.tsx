import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ShoppingBag, 
  Briefcase, 
  User, 
  Settings,
  Clock, 
  Calendar,
  Loader2
} from "lucide-react";
import { 
  getUserCompanies, 
  getCompanyServices, 
  getCompanyJobOffers,
  Company,
  Service,
  JobOffer
} from "@/lib/firebase";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch company data
          const companies = await getUserCompanies(user.uid);
          
          if (companies.length > 0) {
            const companyData = companies[0];
            setCompany(companyData);
            
            // Fetch services
            const servicesData = await getCompanyServices(companyData.id!);
            setServices(servicesData);
            
            // Fetch job offers
            const jobOffersData = await getCompanyJobOffers(companyData.id!);
            setJobOffers(jobOffersData);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user]);
  
  // Format creation date to display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Sem data";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      return "Data inválida";
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Dashboard - NextAuth</title>
        <meta name="description" content="Dashboard do sistema NextAuth" />
      </Helmet>
      <DashboardLayout title="Dashboard" contentId="dashboard-content">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Minha Empresa
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{company ? 1 : 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {company ? company.name : "Nenhuma empresa cadastrada"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Serviços
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{services.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {services.length > 0 
                      ? `Último adicionado em ${formatDate(services[services.length - 1].createdAt)}`
                      : "Nenhum serviço cadastrado"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vagas abertas
                  </CardTitle>
                  <Briefcase className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobOffers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {jobOffers.length > 0 
                      ? `Última adicionada em ${formatDate(jobOffers[jobOffers.length - 1].createdAt)}`
                      : "Nenhuma vaga cadastrada"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conta criada
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium">
                    {user?.metadata?.creationTime 
                      ? format(new Date(user.metadata.creationTime), "dd/MM/yyyy")
                      : "Sem data"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user?.displayName || "Usuário"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {!company ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Cadastre sua empresa</CardTitle>
                  <CardDescription>
                    Para começar a utilizar o sistema, cadastre sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Cadastre os dados da sua empresa para começar a gerenciar serviços e vagas.
                  </p>
                  <Button 
                    onClick={() => navigate("/company-profile")} 
                    className="w-full md:w-auto"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Cadastrar empresa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Minha empresa</CardTitle>
                    <CardDescription>
                      {company.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm line-clamp-3">{company.description}</p>
                      {company.address && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Endereço:</strong> {company.address}
                        </div>
                      )}
                      {company.phone && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Telefone:</strong> {company.phone}
                        </div>
                      )}
                      {company.createdAt && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Criada em:</strong> {formatDate(company.createdAt)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate("/company-profile")}
                    >
                      Editar empresa
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Acesso rápido</CardTitle>
                    <CardDescription>
                      Principais funções do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 w-full"
                        onClick={() => navigate("/services")}
                      >
                        <ShoppingBag className="h-8 w-8 mb-1" />
                        <span>Serviços</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex flex-col items-center justify-center h-20 w-full"
                        onClick={() => navigate("/job-offers")}
                      >
                        <Briefcase className="h-8 w-8 mb-1" />
                        <span>Vagas</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex flex-col items-center justify-center h-20 w-full"
                        onClick={() => navigate("/profile")}
                      >
                        <User className="h-8 w-8 mb-1" />
                        <span>Perfil</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex flex-col items-center justify-center h-20 w-full"
                        onClick={() => navigate("/settings")}
                      >
                        <Settings className="h-8 w-8 mb-1" />
                        <span>Configurações</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Recent Activity/Today's Stats */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Atividade recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {company ? (
                      <>
                        <div className="flex items-center">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Empresa cadastrada
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {company.name}
                            </p>
                          </div>
                          <div className="ml-auto font-medium text-sm text-muted-foreground">
                            {formatDate(company.createdAt)}
                          </div>
                        </div>
                        
                        {services.slice(-2).map((service) => (
                          <div key={service.id} className="flex items-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                Serviço adicionado
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {service.name}
                              </p>
                            </div>
                            <div className="ml-auto font-medium text-sm text-muted-foreground">
                              {formatDate(service.createdAt)}
                            </div>
                          </div>
                        ))}
                        
                        {jobOffers.slice(-2).map((job) => (
                          <div key={job.id} className="flex items-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                Vaga publicada
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {job.title}
                              </p>
                            </div>
                            <div className="ml-auto font-medium text-sm text-muted-foreground">
                              {formatDate(job.createdAt)}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma atividade recente. Cadastre sua empresa para começar.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DashboardLayout>
    </>
  );
}
