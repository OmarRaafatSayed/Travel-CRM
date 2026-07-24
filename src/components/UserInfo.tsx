import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function UserInfo() {
  const { user, profile } = useAuth();
  const { organization, membership } = useOrganization();

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    return user?.email?.split('@')[0] || 'مستخدم';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{getDisplayName()}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        {organization && (
          <p className="text-xs text-muted-foreground truncate">{organization.name}</p>
        )}
      </div>
      {(profile?.role || membership?.role) && (
        <Badge variant="secondary" className="text-xs">
          {profile?.job_title || profile?.role || membership?.role}
        </Badge>
      )}
    </div>
  );
}