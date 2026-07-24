import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, AtSign, Hash, AlertCircle, Users, FileText, CreditCard, TrendingUp } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  message_type: string;
  metadata: any;
  user_id: string;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface MentionSuggestion {
  id: string;
  name: string;
  type: 'user' | 'task' | 'lead' | 'deal' | 'account' | 'invoice' | 'report';
  prefix: '@' | '#' | '!';
}

interface InteractiveMentionChatProps {
  teamId: string;
  teamName: string;
}

export function InteractiveMentionChat({ teamId, teamName }: InteractiveMentionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentMention, setCurrentMention] = useState({ text: '', start: 0, type: '' });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: { first_name: string; last_name: string } }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    fetchCurrentUser();
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
      // Validate teamId is a valid UUID format
      if (!teamId || teamId === 'default' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId)) {
        console.warn('Invalid team ID provided:', teamId);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('team_chat')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch user profiles for all unique user IDs in messages
      const userIds = [...new Set(data?.map(msg => msg.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

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
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Don't set up subscription if teamId is invalid
    if (!teamId || teamId === 'default' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId)) {
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchSuggestions = async (query: string, type: string) => {
    const suggestions: MentionSuggestion[] = [];
    
    try {
      if (type === '@') {
        // Fetch users/team members
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .limit(5);
        
        if (profiles) {
          suggestions.push(...profiles.map(p => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            type: 'user' as const,
            prefix: '@' as const
          })));
        }
      } else if (type === '#') {
        // Fetch tasks
        const { data: tasks } = await supabase
          .from('team_tasks')
          .select('id, title')
          .eq('team_id', teamId)
          .ilike('title', `%${query}%`)
          .limit(5);
        
        if (tasks) {
          suggestions.push(...tasks.map(t => ({
            id: t.id,
            name: t.title,
            type: 'task' as const,
            prefix: '#' as const
          })));
        }
      } else if (type === '!') {
        // Fetch deals, leads, accounts, invoices
        const [deals, leads, accounts, invoices] = await Promise.all([
          supabase.from('deals').select('id, name').ilike('name', `%${query}%`).limit(3),
          supabase.from('leads').select('id, first_name, last_name').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`).limit(3),
          supabase.from('accounts').select('id, name').ilike('name', `%${query}%`).limit(3),
          supabase.from('invoices').select('id, invoice_number, description').or(`invoice_number.ilike.%${query}%,description.ilike.%${query}%`).limit(3)
        ]);

        if (deals.data) {
          suggestions.push(...deals.data.map(d => ({
            id: d.id,
            name: `Deal: ${d.name}`,
            type: 'deal' as const,
            prefix: '!' as const
          })));
        }

        if (leads.data) {
          suggestions.push(...leads.data.map(l => ({
            id: l.id,
            name: `Lead: ${l.first_name} ${l.last_name}`,
            type: 'lead' as const,
            prefix: '!' as const
          })));
        }

        if (accounts.data) {
          suggestions.push(...accounts.data.map(a => ({
            id: a.id,
            name: `Account: ${a.name}`,
            type: 'account' as const,
            prefix: '!' as const
          })));
        }

        if (invoices.data) {
          suggestions.push(...invoices.data.map(i => ({
            id: i.id,
            name: `Invoice: ${i.invoice_number} - ${i.description || 'No description'}`,
            type: 'invoice' as const,
            prefix: '!' as const
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }

    setSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
    setSelectedSuggestionIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setNewMessage(value);
    setCursorPosition(cursorPos);

    // Check for mention triggers
    const beforeCursor = value.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/[@#!](\w*)$/);
    
    if (mentionMatch) {
      const [fullMatch, query] = mentionMatch;
      const startPos = cursorPos - fullMatch.length;
      const mentionType = fullMatch[0];
      
      setCurrentMention({
        text: query,
        start: startPos,
        type: mentionType
      });
      
      if (query.length >= 0) {
        fetchSuggestions(query, mentionType);
      }
    } else {
      setShowSuggestions(false);
      setCurrentMention({ text: '', start: 0, type: '' });
    }
  };

  const insertMention = (suggestion: MentionSuggestion) => {
    const beforeMention = newMessage.substring(0, currentMention.start);
    const afterMention = newMessage.substring(cursorPosition);
    const mentionText = `${suggestion.prefix}${suggestion.name}`;
    
    const newText = beforeMention + mentionText + ' ' + afterMention;
    setNewMessage(newText);
    setShowSuggestions(false);
    
    // Focus input after insertion
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[selectedSuggestionIndex]) {
          insertMention(suggestions[selectedSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse mentions and references
      const mentions = [...newMessage.matchAll(/@([^@#!\s]+)/g)].map(m => m[1]);
      const taskRefs = [...newMessage.matchAll(/#([^@#!\s]+)/g)].map(m => m[1]);
      const entityRefs = [...newMessage.matchAll(/!([^@#!\s]+)/g)].map(m => m[1]);

      let messageType = 'text';
      let metadata = null;

      if (mentions.length > 0 || taskRefs.length > 0 || entityRefs.length > 0) {
        messageType = 'rich_mention';
        metadata = {
          mentions,
          task_references: taskRefs,
          entity_references: entityRefs
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
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-3 h-3" />;
      case 'task': return <Hash className="w-3 h-3" />;
      case 'deal': return <TrendingUp className="w-3 h-3" />;
      case 'lead': return <Users className="w-3 h-3" />;
      case 'account': return <FileText className="w-3 h-3" />;
      case 'invoice': return <CreditCard className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
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
                {message.metadata.mentions?.map((mention: string, i: number) => (
                  <Badge key={`mention-${i}`} variant="outline" className="text-xs">
                    <AtSign className="w-3 h-3 mr-1" />
                    {mention}
                  </Badge>
                ))}
                {message.metadata.task_references?.map((task: string, i: number) => (
                  <Badge key={`task-${i}`} variant="outline" className="text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    {task}
                  </Badge>
                ))}
                {message.metadata.entity_references?.map((entity: string, i: number) => (
                  <Badge key={`entity-${i}`} variant="outline" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {entity}
                  </Badge>
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
      <Card className="h-full">
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {teamName} Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
                <p className="text-xs mt-1">
                  Use @ for users, # for tasks, ! for deals/leads/accounts/invoices
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mx-4 mb-2 bg-card border rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.id}`}
                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-muted ${
                  index === selectedSuggestionIndex ? 'bg-muted' : ''
                }`}
                onClick={() => insertMention(suggestion)}
              >
                {getTypeIcon(suggestion.type)}
                <span className="text-sm">{suggestion.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {suggestion.type}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Type a message... @ for users, # for tasks, ! for deals/leads/accounts"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Pro tip: Use @ to mention users, # to reference tasks, ! for deals/leads/accounts/invoices
          </div>
        </div>
      </CardContent>
    </Card>
  );
}