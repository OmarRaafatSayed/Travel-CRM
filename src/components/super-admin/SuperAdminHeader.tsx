import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface SuperAdminHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
}

export function SuperAdminHeader({ 
  setSidebarOpen, 
  notificationsOpen, 
  setNotificationsOpen 
}: SuperAdminHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            System Administration
          </h2>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <BellIcon className="h-6 w-6" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="flex items-center gap-x-4">
            <div className="hidden lg:flex lg:flex-col lg:text-right">
              <div className="text-sm font-semibold text-gray-900">
                {user?.email}
              </div>
              <div className="text-xs text-gray-500">Super Administrator</div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}