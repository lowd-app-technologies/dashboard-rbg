import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SidebarNavProps {
  className?: string;
  children?: ReactNode;
}

interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  title: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarNav({ className, children }: SidebarNavProps) {
  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {children}
    </nav>
  );
}

export function SidebarNavItem({
  href,
  icon: Icon,
  title,
  active,
  onClick,
}: SidebarNavItemProps) {
  const [location, navigate] = useLocation();
  
  const isActive = active || location === href;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      navigate(href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
        isActive
          ? "bg-gray-900 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "mr-3 h-5 w-5",
          isActive
            ? "text-gray-300"
            : "text-gray-400 group-hover:text-gray-300"
        )}
      />
      {title}
    </a>
  );
}
