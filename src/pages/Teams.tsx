import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamManagement } from "@/components/TeamManagement";
import { TeamTasksView } from "@/components/TeamTasksView";
import { EnhancedTeamChat } from "@/components/EnhancedTeamChat";
import { 
  MessageCircle, Users, Calendar, Hash, Plus, UserPlus, 
  Search, Settings, MoreVertical, Phone, Video, Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  member_count?: number;
}

export default function Teams() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState("management");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCreateTeam, setCanCreateTeam] = useState(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (organization?.id) {
      fetchTeams();
      checkPermissions();
    }
  }, [organization?.id]);

  const fetchTeams = async () => {
    try {
      if (!organization?.id) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(count)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const teamsWithCount = data?.map(team => ({
        ...team,
        member_count: team.team_members?.[0]?.count || 0
      })) || [];

      setTeams(teamsWithCount);
      if (teamsWithCount.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithCount[0]);
        setActiveTab("chat");
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load teams',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user can manage teams or create teams
      const { data: permissions } = await supabase
        .from('permissions')
        .select('can_manage_team, can_create_projects')
        .eq('user_id', user.id)
        .maybeSingle();

      setCanCreateTeam(permissions?.can_manage_team || permissions?.can_create_projects || false);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex w-full">
        {/* Left Sidebar - Teams */}
        <div className="w-64 bg-white border-r flex flex-col">
          {/* Workspace Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg truncate text-slate-900">
                {organization?.name || 'Teams Hub'}
              </h2>
              <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search teams..."
                className="pl-9 bg-slate-50 border-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-3 mb-2">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
              <TabsTrigger value="chat" className="text-xs" disabled={!selectedTeam}>
                <Hash className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="management" className="text-xs">
                <Users className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs" disabled={!selectedTeam}>
                <Calendar className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Teams List */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 py-1">
                Teams ({teams.length})
              </div>
              {teams.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Hash className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No teams found</p>
                  {canCreateTeam && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-slate-600 hover:bg-slate-100"
                      onClick={() => setActiveTab('management')}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Team
                    </Button>
                  )}
                </div>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors",
                      selectedTeam?.id === team.id
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                    onClick={() => {
                      setSelectedTeam(team);
                      setActiveTab('chat');
                    }}
                  >
                    <Hash className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{team.name}</span>
                    {team.member_count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto text-xs bg-slate-200 text-slate-700"
                      >
                        {team.member_count}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          {canCreateTeam && (
            <div className="p-3 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTab('management')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTab('management')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Members
              </Button>
            </div>
          )}

          {/* User Profile */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                  {organization?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {organization?.name || 'User'}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-slate-500">Active</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <TabsContent value="chat" className="flex-1 m-0">
            {selectedTeam ? (
              <>
                {/* Chat Header */}
                <div className="h-14 border-b bg-white px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-slate-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{selectedTeam.name}</h3>
                      <p className="text-xs text-slate-500">
                        {selectedTeam.member_count} {selectedTeam.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 bg-white">
                  <EnhancedTeamChat 
                    teamId={selectedTeam.id} 
                    teamName={selectedTeam.name}
                    onMentionReceived={(mention) => {
                      toast({
                        title: 'You were mentioned',
                        description: `${mention.from} mentioned you in ${mention.team}`
                      });
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                  <Hash className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Select a Team
                  </h3>
                  <p className="text-slate-600">
                    Choose a team from the sidebar to start chatting
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="management" className="flex-1 m-0 p-6 overflow-y-auto bg-slate-50">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 m-0">
            {selectedTeam ? (
              <div className="h-full p-6 overflow-y-auto bg-slate-50">
                <TeamTasksView />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Select a Team
                  </h3>
                  <p className="text-slate-600">
                    Choose a team to view and manage tasks
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}