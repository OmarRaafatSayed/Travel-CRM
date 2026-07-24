import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { MessageCircle, Send, Paperclip, Hash, AtSign } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  message_type: string;
  metadata: any;
  user_id: string;
  created_at: string;
}

interface TeamChatProps {
  teamId: string;
  teamName: string;
}

export function TeamChat({ teamId, teamName }: TeamChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [draggedElement, setDraggedElement] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      supabase.removeAllChannels();
    };
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // Validate teamId is a valid UUID format
      if (!teamId || teamId === 'default' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId)) {
        console.warn('Invalid team ID provided to TeamChat:', teamId);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('team_chat')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let messageContent = newMessage;
      let messageType = 'text';
      let metadata = null;

      // Handle mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = [...newMessage.matchAll(mentionRegex)];
      if (mentions.length > 0) {
        messageType = 'mention';
        metadata = { mentions: mentions.map(m => m[1]) };
      }

      // Handle hashtags (for referencing tasks/deals)
      const hashtagRegex = /#(\w+)/g;
      const hashtags = [...newMessage.matchAll(hashtagRegex)];
      if (hashtags.length > 0) {
        messageType = 'reference';
        metadata = { references: hashtags.map(h => h[1]) };
      }

      // Handle drag and drop references
      if (draggedElement) {
        messageType = 'element_reference';
        messageContent = `${newMessage} [Referenced: ${draggedElement.type} - ${draggedElement.name}]`;
        metadata = { element: draggedElement };
      }

      const { error } = await supabase
        .from('team_chat')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: messageContent,
          message_type: messageType,
          metadata: metadata
        });

      if (error) throw error;

      setNewMessage("");
      setDraggedElement(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('common.error'),
        description: t('team_chat.failed_to_send'),
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

  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = message.user_id === 'current-user'; // Replace with actual user check

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : 'order-2'}`}>
          {!isCurrentUser && (
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-primary">U</span>
              </div>
              <span className="text-xs text-muted-foreground">User</span>
            </div>
          )}
          <div
            className={`px-3 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm">{message.message}</p>
            {message.message_type === 'mention' && (
              <Badge variant="outline" className="mt-1 text-xs">
                <AtSign className="w-3 h-3 mr-1" />
                {t('team_chat.mention')}
              </Badge>
            )}
            {message.message_type === 'reference' && (
              <Badge variant="outline" className="mt-1 text-xs">
                <Hash className="w-3 h-3 mr-1" />
                {t('team_chat.reference')}
              </Badge>
            )}
            {message.message_type === 'element_reference' && (
            <div className="mt-2 p-2 bg-background/10 rounded text-xs">
              {t('team_chat.referenced')}: {message.metadata?.element?.name}
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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      setDraggedElement(data);
      toast({
        title: t('team_chat.element_added'),
        description: `${data.name} ${t('team_chat.element_reference_message')}`,
      });
    } catch (error) {
      console.error('Error handling drop:', error);
    }
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
          {teamName} {t('team_chat.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-2"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('team_chat.no_messages_yet')}</p>
                <p className="text-xs mt-1">
                  {t('team_chat.drag_tasks_message')}
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

        {/* Dragged Element Preview */}
        {draggedElement && (
          <div className="mx-4 mb-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="w-4 h-4" />
              <span>{t('team_chat.will_reference')}: {draggedElement.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDraggedElement(null)}
                className="ml-auto h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('team_chat.type_message_placeholder')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}