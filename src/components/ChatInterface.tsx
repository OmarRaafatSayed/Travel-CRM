import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Hash, 
  Users, 
  Bell, 
  Settings, 
  Search, 
  Plus,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  AtSign,
  Archive,
  Star,
  Lock,
  Globe,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { EnhancedTeamChat } from "./EnhancedTeamChat";
import { useTranslation } from "react-i18next";

interface Team {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export function ChatInterface() {
  const { t, i18n } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { organization } = useOrganization();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (count)
        `)
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTeams = data?.map(team => ({
        ...team,
        member_count: team.team_members?.[0]?.count || 0,
        is_private: false // Default to public for now
      })) || [];

      setTeams(formattedTeams);
      if (formattedTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(formattedTeams[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .from('team_members')
        .select('id, user_id, role')
        .eq('team_id', teamId);

      if (error) throw error;

      if (!membersData?.length) {
        setTeamMembers([]);
        return;
      }

      // Get user IDs and fetch profiles separately
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      const formattedMembers = membersData.map(member => {
        const profile = profilesData?.find(p => p.user_id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          status: 'online', // Mock status
          first_name: profile?.first_name || 'Unknown',
          last_name: profile?.last_name || 'User',
          avatar_url: profile?.avatar_url
        };
      });

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]); // Set empty array on error
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={`flex h-full bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`w-80 border-border p-4 ${isRTL ? 'border-l' : 'border-r'}`}>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className={`w-80 border-border flex flex-col ${isRTL ? 'border-l' : 'border-r'}`}>
        {/* Header */}
        <div className={`p-4 border-b border-border`}>
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="font-bold text-lg text-foreground">{t('navigation.teams')}</h2>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Team Selector Dropdown */}
          <div className="mb-4">
            <label className={`text-sm font-medium text-foreground mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('teams.select_team')}
            </label>
            <div className="relative">
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('teams.choose_team')}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.member_count} {t('teams.members')})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('teams.search_teams')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-muted/50 border-muted ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
            />
          </div>
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted/50 text-foreground'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-2 flex-1 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {team.is_private ? (
                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`font-medium truncate ${isRTL ? 'text-right' : 'text-left'}`}>{team.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {team.member_count}
                </Badge>
              </div>
            ))}
          </div>

          {/* Team Management Actions */}
          <div className="p-2 mt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                {t('teams.add_team')}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <UserPlus className="w-3 h-3 mr-1" />
                {t('teams.invite')}
              </Button>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute w-4 h-4 bg-green-500 border-2 border-background rounded-full ${isRTL ? '-bottom-1 -left-1' : '-bottom-1 -right-1'}`}></div>
            </div>
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="font-medium text-sm text-foreground truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground">{t('teams.active')}</p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTeam ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {selectedTeam.is_private ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Hash className="w-5 h-5 text-muted-foreground" />
                    )}
                    <h1 className="font-bold text-xl text-foreground">{selectedTeam.name}</h1>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {teamMembers.length} {t('teams.members')}
                  </Badge>
                </div>
                
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {selectedTeam.description && (
                <p className={`text-sm text-muted-foreground mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{selectedTeam.description}</p>
              )}
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex">
              <div className="flex-1">
                <EnhancedTeamChat
                  teamId={selectedTeam.id}
                  teamName={selectedTeam.name}
                  onMentionReceived={(mention) => {
                    // Handle mention notifications
                    console.log('Mention received:', mention);
                  }}
                />
              </div>

              {/* Enhanced Members Sidebar */}
              <div className={`w-64 border-border p-4 ${isRTL ? 'border-r' : 'border-l'}`}>
                <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className={`font-semibold text-sm text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('teams.members')} ({teamMembers.length})
                  </h3>
                  <Button variant="ghost" size="sm" className="p-1">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 mb-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute w-3 h-3 ${getStatusColor(member.status)} border border-background rounded-full ${isRTL ? '-bottom-0.5 -left-0.5' : '-bottom-0.5 -right-0.5'}`}></div>
                      </div>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Quick Team Actions */}
                <div className="border-t border-border pt-4 space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <Settings className="w-3 h-3 mr-2" />
                    {t('teams.team_settings')}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <Archive className="w-3 h-3 mr-2" />
                    {t('teams.view_files')}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">{t('teams.no_team_selected')}</h2>
              <p className="text-muted-foreground">{t('teams.choose_team_sidebar')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}