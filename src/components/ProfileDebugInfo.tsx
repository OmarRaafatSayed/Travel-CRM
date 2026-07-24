import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProfileDebugInfo() {
  const { user, profile, refreshProfile } = useAuth();
  const { organization, membership } = useOrganization();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>معلومات المستخدم - Debug</CardTitle>
        <Button onClick={refreshProfile} size="sm">تحديث البروفايل</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">User:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold">Profile:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold">Organization:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(organization, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold">Membership:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(membership, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}