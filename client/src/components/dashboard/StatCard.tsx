import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  colorClass?: string;
  linkText?: string;
  linkHref?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  colorClass = "bg-blue-500",
  linkText,
  linkHref,
}: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClass} rounded-md p-3 text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </dl>
          </div>
        </div>
        
        {linkText && linkHref && (
          <div className="mt-3 text-sm">
            <a
              href={linkHref}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              {linkText} <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
