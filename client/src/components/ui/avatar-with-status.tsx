import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarWithStatusProps {
  src?: string;
  alt?: string;
  fallback: string;
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarWithStatus({
  src,
  alt,
  fallback,
  status,
  className,
  size = "md",
}: AvatarWithStatusProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            statusColors[status],
            size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-3.5 w-3.5"
          )}
        />
      )}
    </div>
  );
}
