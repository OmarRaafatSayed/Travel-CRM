import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { MessageCircle, Send, AtSign, Hash, AlertCircle, Users, FileText, CreditCard, TrendingUp, Calendar, UserCheck } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  message_type: string;
  metadata: any;
  user_id: string;
  team_id: string;
  created_at: string;
}

interface MentionableItem {
  id: string;
  name: string;
  type: 'deal' | 'lead' | 'account' | 'invoice' | 'task' | 'user';
  badge_color: string;
  icon: any;
}

interface EnhancedTeamChatProps {
  teamId: string;
  teamName: string;
  onMentionReceived?: (mention: any) => void;
}

export function EnhancedTeamChat({ teamId, teamName, onMentionReceived }: EnhancedTeamChatProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMentionables, setShowMentionables] = useState(false);
  const [mentionableItems, setMentionableItems] = useState<MentionableItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: { first_name: string; last_name: string } }>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchMessages();
    fetchMentionableItems();
    setupRealtimeSubscription();

    return () => {
      supabase.removeAllChannels();
    };
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchMessages = async () => {
    try {
      if (!teamId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId)) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('team_chat')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch user profiles for messages (only from same organization)
      const userIds = [...new Set(data?.map(msg => msg.user_id) || [])];
      if (userIds.length > 0 && organization?.id) {
        // Get organization users
        const { data: orgUsers } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organization.id)
          .in('user_id', userIds);
        
        const orgUserIds = orgUsers?.map(u => u.user_id) || [];
        
        if (orgUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', orgUserIds);

          if (profiles) {
            const profileMap = profiles.reduce((acc, profile) => {
              acc[profile.user_id] = {
                first_name: profile.first_name || 'Unknown',
                last_name: profile.last_name || 'User'
              };
              return acc;
            }, {} as { [key: string]: { first_name: string; last_name: string } });
            
            setUserProfiles(profileMap);
          }
        }
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMentionableItems = async () => {
    try {
      if (!organization?.id) return;
      
      // Get organization users first
      const { data: orgUsers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organization.id);
      
      const orgUserIds = orgUsers?.map(u => u.user_id) || [];
      
      // Ensure all data has proper UUIDs and handle empty/null cases
      const [deals, leads, accounts, invoices, tasks, profiles] = await Promise.all([
        supabase.from('deals').select('id, name').eq('organization_id', organization.id).not('id', 'is', null).limit(10),
        supabase.from('leads').select('id, first_name, last_name').eq('organization_id', organization.id).not('id', 'is', null).limit(10),
        supabase.from('accounts').select('id, name').eq('organization_id', organization.id).not('id', 'is', null).limit(10),
        supabase.from('invoices').select('id, invoice_number, description').eq('organization_id', organization.id).not('id', 'is', null).limit(10),
        supabase.from('team_tasks').select('id, title').eq('team_id', teamId).not('id', 'is', null).limit(10),
        orgUserIds.length > 0 ? supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', orgUserIds).not('user_id', 'is', null).limit(10) : { data: [] }
      ]);

      const items: MentionableItem[] = [];

      // Add deals with UUID validation
      if (deals.data) {
        items.push(...deals.data
          .filter(d => d.id && d.name && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.id))
          .map(d => ({
            id: d.id,
            name: `Deal: ${d.name}`,
            type: 'deal' as const,
            badge_color: 'deal',
            icon: TrendingUp
          })));
      }

      // Add leads with UUID validation
      if (leads.data) {
        items.push(...leads.data
          .filter(l => l.id && l.first_name && l.last_name && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(l.id))
          .map(l => ({
            id: l.id,
            name: `Lead: ${l.first_name} ${l.last_name}`,
            type: 'lead' as const,
            badge_color: 'lead',
            icon: UserCheck
          })));
      }

      // Add accounts with UUID validation
      if (accounts.data) {
        items.push(...accounts.data
          .filter(a => a.id && a.name && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(a.id))
          .map(a => ({
            id: a.id,
            name: `Account: ${a.name}`,
            type: 'account' as const,
            badge_color: 'account',
            icon: FileText
          })));
      }

      // Add invoices with UUID validation
      if (invoices.data) {
        items.push(...invoices.data
          .filter(i => i.id && i.invoice_number && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(i.id))
          .map(i => ({
            id: i.id,
            name: `Invoice: ${i.invoice_number}`,
            type: 'invoice' as const,
            badge_color: 'invoice',
            icon: CreditCard
          })));
      }

      // Add tasks with UUID validation
      if (tasks.data) {
        items.push(...tasks.data
          .filter(t => t.id && t.title && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t.id))
          .map(t => ({
            id: t.id,
            name: `Task: ${t.title}`,
            type: 'task' as const,
            badge_color: 'task',
            icon: Calendar
          })));
      }

      // Add users with UUID validation
      if (profiles.data) {
        items.push(...profiles.data
          .filter(p => p.user_id && p.first_name && p.last_name && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.user_id))
          .map(p => ({
            id: p.user_id,
            name: `@${p.first_name} ${p.last_name}`,
            type: 'user' as const,
            badge_color: 'user',
            icon: Users
          })));
      }

      setMentionableItems(items);
    } catch (error) {
      console.error('Error fetching mentionable items:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!teamId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId)) {
      return;
    }

    const channel = supabase
      .channel(`team_chat_${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Check if current user is mentioned and send notification
          if (newMessage.metadata?.mentions?.includes(currentUserId)) {
            // Send mention notification
            const mentionNotification = {
              id: Date.now().toString(),
              type: 'mention',
              category: 'chat',
              priority: 'high',
              title: 'You were mentioned',
              message: `${userProfiles[newMessage.user_id]?.first_name || 'Someone'} mentioned you in ${teamName}`,
              timestamp: new Date().toISOString(),
              read: false,
              user_id: currentUserId,
              metadata: {
                team_name: teamName,
                message_preview: newMessage.message.substring(0, 100),
                mentioned_by: newMessage.user_id
              }
            };

            // Store notification
            const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${currentUserId}`) || '[]');
            storedNotifications.unshift(mentionNotification);
            localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(storedNotifications.slice(0, 50)));

            if (onMentionReceived) {
              onMentionReceived({
                message: newMessage.message,
                from: newMessage.user_id,
                team: teamName,
                timestamp: newMessage.created_at
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Enhanced parsing with UUID resolution
      const mentionMatches = [...newMessage.matchAll(/@([^@#!\s]+)/g)];
      const taskMatches = [...newMessage.matchAll(/#([^@#!\s]+)/g)];
      const entityMatches = [...newMessage.matchAll(/!([^@#!\s]+)/g)];

      // Resolve mentions to UUIDs from mentionableItems
      const mentions = mentionMatches.map(m => {
        const mentionText = m[1];
        const foundItem = mentionableItems.find(item => 
          item.type === 'user' && 
          (item.name.includes(mentionText) || mentionText === item.name.replace('@', ''))
        );
        return foundItem ? foundItem.id : mentionText;
      });

      const taskRefs = taskMatches.map(m => {
        const taskText = m[1];
        const foundItem = mentionableItems.find(item => 
          item.type === 'task' && 
          (item.name.includes(taskText) || taskText === item.name.replace('Task: ', ''))
        );
        return foundItem ? foundItem.id : taskText;
      });

      const entityRefs = entityMatches.map(m => {
        const entityText = m[1];
        const foundItem = mentionableItems.find(item => 
          ['deal', 'lead', 'account', 'invoice'].includes(item.type) &&
          (item.name.includes(entityText) || 
           entityText === item.name.replace(/^(Deal|Lead|Account|Invoice):\s/, ''))
        );
        return foundItem ? { id: foundItem.id, type: foundItem.type } : entityText;
      });

      let messageType = 'text';
      let metadata = null;

      if (mentions.length > 0 || taskRefs.length > 0 || entityRefs.length > 0) {
        messageType = 'rich_mention';
        metadata = {
          mentions: mentions.filter(m => typeof m === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(m)),
          task_references: taskRefs.filter(t => typeof t === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)),
          entity_references: entityRefs.filter(e => typeof e === 'object' && e.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.id))
        };
      }

      const { error } = await supabase
        .from('team_chat')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: newMessage,
          message_type: messageType,
          metadata: metadata
        });

      if (error) throw error;

      setNewMessage("");
      setShowMentionables(false);
      
      toast({
        title: t('team_chat.message_sent'),
        description: metadata ? t('team_chat.message_with_mentions_sent') : t('team_chat.message_sent_successfully'),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('common.error'),
        description: t('team_chat.failed_to_send'),
        variant: "destructive",
      });
    }
  };

  const insertMention = (item: MentionableItem) => {
    const prefix = item.type === 'user' ? '@' : item.type === 'task' ? '#' : '!';
    const mention = `${prefix}${item.name.replace(/^(Deal|Lead|Account|Invoice|Task):\s/, '')} `;
    setNewMessage(prev => prev + mention);
    setShowMentionables(false);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'deal': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'lead': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'account': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'invoice': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'task': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'user': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMentionClick = async (mentionId: string, type: string) => {
    try {
      switch (type) {
        case 'deal':
          navigate(`/deals`);
          break;
        case 'lead':
          navigate(`/leads`);
          break;
        case 'account':
          navigate(`/accounts`);
          break;
        case 'invoice':
          navigate(`/invoices`);
          break;
        case 'task':
          // Navigate to team tasks or projects
          navigate(`/team-tasks`);
          break;
        case 'user':
          // Show user profile or navigate to team management
          navigate(`/team`);
          break;
        default:
          break;
      }
      
      toast({
        title: t('team_chat.navigating'),
        description: t('team_chat.opening_item', { type }),
      });
    } catch (error) {
      console.error('Error navigating to item:', error);
    }
  };

  const renderMentionBadge = (id: string, type: string, displayText: string) => {
    const item = mentionableItems.find(item => item.id === id);
    const displayName = item ? item.name : displayText;
    
    return (
      <Badge 
        variant="outline" 
        className={`text-xs cursor-pointer ${getBadgeColor(type)}`}
        onClick={() => handleMentionClick(id, type)}
      >
        {type === 'user' && <AtSign className="w-3 h-3 mr-1" />}
        {type === 'task' && <Hash className="w-3 h-3 mr-1" />}
        {!['user', 'task'].includes(type) && <AlertCircle className="w-3 h-3 mr-1" />}
        {displayName}
      </Badge>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = message.user_id === currentUserId;
    const userProfile = userProfiles[message.user_id];
    const userName = userProfile 
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : 'Unknown User';

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : 'order-2'}`}>
          {!isCurrentUser && (
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-primary">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{userName}</span>
            </div>
          )}
          <div
            className={`px-3 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            
            {/* Render mention badges */}
            {message.message_type === 'rich_mention' && message.metadata && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.metadata.mentions?.map((mentionId: string, i: number) => (
                  renderMentionBadge(mentionId, 'user', `User ${mentionId.slice(0, 8)}`)
                ))}
                {message.metadata.task_references?.map((taskId: string, i: number) => (
                  renderMentionBadge(taskId, 'task', `Task ${taskId.slice(0, 8)}`)
                ))}
                {message.metadata.entity_references?.map((entityRef: { id: string, type: string }, i: number) => (
                  renderMentionBadge(entityRef.id, entityRef.type, `${entityRef.type} ${entityRef.id.slice(0, 8)}`)
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full bg-card border border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <MessageCircle className="w-5 h-5" />
          {teamName} {t('team_chat.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: '300px', maxHeight: '400px' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-center font-medium">{t('team_chat.no_messages_yet')}</p>
              <p className="text-xs mt-2 text-center">
                ✨ <strong>{t('team_chat.full_mention_support')}:</strong>
              </p>
              <div className="mt-2 text-xs text-center space-y-1">
                <p><strong>@username</strong> - {t('team_chat.mention_team_members')}</p>
                <p><strong>#task</strong> - {t('team_chat.reference_tasks')}</p>
                <p><strong>!deal/lead/account/invoice</strong> - {t('team_chat.reference_business_entities')}</p>
              </div>
              
              {/* Sample mentions display */}
              <div className="mt-4 space-y-2 w-full max-w-sm">
                <p className="text-xs font-medium text-center">{t('team_chat.available_mentions')}:</p>
                {mentionableItems.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-xs flex-1">{item.name}</span>
                      <Badge className={`text-xs ${getBadgeColor(item.badge_color)}`}>
                        {item.type}
                      </Badge>
                    </div>
                  );
                })}
                {mentionableItems.length > 6 && (
                  <div className="text-center text-xs text-muted-foreground">
                    +{mentionableItems.length - 6} more items available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick mentions panel */}
        {showMentionables && (
          <div className="mx-4 mb-2 bg-card border rounded-lg shadow-lg max-h-40 overflow-y-auto">
            <div className="p-2 border-b bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">Quick Mentions</span>
            </div>
            {mentionableItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted"
                  onClick={() => insertMention(item)}
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm flex-1">{item.name}</span>
                  <Badge className={`text-xs ${getBadgeColor(item.badge_color)}`}>
                    {item.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder={t('team_chat.type_message_placeholder')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  onFocus={() => setShowMentionables(true)}
                  className="flex-1"
                />
              </div>
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim()}
                size="sm"
                className="bg-primary hover:bg-primary-hover"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {t('team_chat.mention_instructions')}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}