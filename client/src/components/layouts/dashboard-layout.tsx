import { ReactNode, useState } from "react";
import { SidebarNav, SidebarNavItem } from "@/components/ui/sidebar-nav";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Building2,
  ShoppingBag,
  Briefcase,
  Shield
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  contentId?: string;
}

export function DashboardLayout({ children, title, contentId }: DashboardLayoutProps) {
  const { user, userData, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
  };
  
  // Format the createdAt timestamp or use fallback
  const formattedCreatedAt = userData?.createdAt 
    ? format(new Date(userData.createdAt.toDate()), 'MMMM yyyy')
    : 'Recent';
  
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 bg-gray-800">
              <div className="flex items-center justify-center h-24 flex-shrink-0 px-4 bg-gray-900">
                <img 
                  src="/assets/images/logo-rbg-horizontal-positivo.png" 
                  alt="RBG Logo" 
                  className="h-16 w-auto"
                />
              </div>
              <div className="flex-1 flex flex-col overflow-y-auto">
                <SidebarNav className="flex-1 px-2 py-4">
                  <SidebarNavItem
                    href="/dashboard"
                    icon={LayoutDashboard}
                    title="Dashboard"
                  />
                  <SidebarNavItem
                    href="/company-profile"
                    icon={Building2}
                    title="Empresa"
                  />
                  <SidebarNavItem
                    href="/services"
                    icon={ShoppingBag}
                    title="Serviços"
                  />
                  <SidebarNavItem
                    href="/job-offers"
                    icon={Briefcase}
                    title="Vagas"
                  />
                  <SidebarNavItem
                    href="/profile"
                    icon={User}
                    title="Meu Perfil"
                  />
                  <SidebarNavItem
                    href="/settings"
                    icon={Settings}
                    title="Configurações"
                  />
                </SidebarNav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <AvatarWithStatus
                      src={user?.photoURL || undefined}
                      alt={user?.displayName || "User"}
                      fallback={initials}
                      status="online"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">
                        {user?.displayName || "User"}
                      </p>
                      <button
                        onClick={handleLogout}
                        className="text-xs font-medium text-gray-300 hover:text-gray-200 flex items-center"
                      >
                        <LogOut className="mr-1 h-3 w-3" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="absolute top-3 left-3 h-10 w-10 p-0 flex items-center justify-center"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-gray-800">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
                  <h1 className="text-white font-bold text-xl flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    RBG
                  </h1>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setSheetOpen(false)}
                  >
                    <X className="h-5 w-5 text-white" />
                  </Button>
                </div>
                <div className="flex-1 px-2 py-4">
                  <SidebarNav>
                    <SidebarNavItem
                      href="/dashboard"
                      icon={LayoutDashboard}
                      title="Dashboard"
                      onClick={() => setSheetOpen(false)}
                    />
                    <SidebarNavItem
                      href="/company-profile"
                      icon={Building2}
                      title="Empresa"
                      onClick={() => setSheetOpen(false)}
                    />
                    <SidebarNavItem
                      href="/services"
                      icon={ShoppingBag}
                      title="Serviços"
                      onClick={() => setSheetOpen(false)}
                    />
                    <SidebarNavItem
                      href="/job-offers"
                      icon={Briefcase}
                      title="Vagas"
                      onClick={() => setSheetOpen(false)}
                    />
                    <SidebarNavItem
                      href="/profile"
                      icon={User}
                      title="Meu Perfil"
                      onClick={() => setSheetOpen(false)}
                    />
                    <SidebarNavItem
                      href="/settings"
                      icon={Settings}
                      title="Configurações"
                      onClick={() => setSheetOpen(false)}
                    />
                  </SidebarNav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
                  <div className="flex-shrink-0 w-full group block">
                    <div className="flex items-center">
                      <AvatarWithStatus
                        src={user?.photoURL || undefined}
                        alt={user?.displayName || "User"}
                        fallback={initials}
                        status="online"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">
                          {user?.displayName || "User"}
                        </p>
                        <button
                          onClick={handleLogout}
                          className="text-xs font-medium text-gray-300 hover:text-gray-200 flex items-center"
                        >
                          <LogOut className="mr-1 h-3 w-3" /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6" id={contentId}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <div className="py-4">{children}</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


