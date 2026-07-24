import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

export function PendingMembershipBanner() {
  const { pendingMembership, organization } = useOrganization();

  // Don't show banner for pending users since they now see blank pages with integrated messaging
  if (!pendingMembership || !organization) {
    return null;
  }

  // Hide banner for pending users - they see blank pages instead
  return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800 mb-4 mx-6 mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium">
          Your membership request for "{organization.name}" is pending admin approval.
        </span>
        <span className="text-amber-700">
          You will have limited access until your request is approved.
        </span>
      </AlertDescription>
    </Alert>
  );
}