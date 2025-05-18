import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RoleType = "assessor" | "student" | "admin";

interface RoleBadgeProps {
  role: RoleType;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleBgColor = (role: RoleType) => {
    switch (role) {
      case "assessor":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "student":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "admin":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  const getRoleText = (role: RoleType) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Badge
      variant="outline"
      className={cn(getRoleBgColor(role), "border-transparent", className)}
    >
      {getRoleText(role)}
    </Badge>
  );
}
