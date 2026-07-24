import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedTeamChat } from "@/components/EnhancedTeamChat";
import { 
  Users, MessageCircle, Hash, Plus, Search, Settings, 
  MoreVertical, Bell, Phone, Video, Info
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
  };
}

export default function TeamChatPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (organization?.id) {
      fetchTeams();
    }
  }, [organization?.id]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      if (!organization?.id) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(count)
        `)
        .eq('organization_id', organization.id);

      if (error) throw error;

      const teamsWithCount = data?.map(team => ({
        ...team,
        member_count: team.team_members?.[0]?.count || 0
      })) || [];

      setTeams(teamsWithCount);
      if (teamsWithCount.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithCount[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_fetch_teams'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      
      // Fetch user profiles separately
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const membersWithProfiles = members.map(member => ({
          ...member,
          user_profile: profiles?.find(p => p.user_id === member.user_id) || null
        }));
        
        setTeamMembers(membersWithProfiles);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleMentionReceived = (mention: any) => {
    // Handle mention notification
    if ((window as any).addNotification) {
      (window as any).addNotification({
        type: 'mention',
        title: t('team_chat.mentioned_in_chat'),
        message: mention.message,
        team_name: mention.team,
        timestamp: mention.timestamp
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="lg:col-span-3 h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Teams */}
      <div className="w-64 bg-white border-r flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg truncate text-slate-900">
              {organization?.name || 'Workspace'}
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

        {/* Teams List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 py-1">
              Teams
            </div>
            {teams.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Hash className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No teams found</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-slate-600 hover:bg-slate-100"
                  onClick={() => navigate('/teams')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Team
                </Button>
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
                  onClick={() => setSelectedTeam(team)}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedTeam ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b bg-white px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-slate-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedTeam.name}</h3>
                  <p className="text-xs text-slate-500">
                    {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
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

            {/* Chat Messages */}
            <div className="flex-1 bg-white">
              <EnhancedTeamChat
                teamId={selectedTeam.id}
                teamName={selectedTeam.name}
                onMentionReceived={handleMentionReceived}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <Hash className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Welcome to Team Chat
              </h3>
              <p className="text-slate-600 mb-4">
                Select a team from the sidebar to start chatting
              </p>
              <Button onClick={() => navigate('/teams')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Team Members */}
      {selectedTeam && (
        <div className="w-64 bg-slate-50 border-l flex flex-col">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({teamMembers.length})
            </h4>
          </div>
          
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const userProfile = member.user_profile;
                const userName = userProfile 
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : 'Unknown User';
                
                return (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-100">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}