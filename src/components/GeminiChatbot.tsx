import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Bot, User, Settings, Sparkles, FileText, TrendingUp } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'report' | 'analysis' | 'recommendation';
}

interface GeminiSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface CRMContext {
  totalDeals: number;
  totalValue: number;
  recentDeals: any[];
  activeProjects: number;
  totalLeads: number;
  conversionRate: number;
}

export function GeminiChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [crmContext, setCrmContext] = useState<CRMContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [settings, setSettings] = useState<GeminiSettings>({
    apiKey: "configured",
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    maxTokens: 1000
  });

  useEffect(() => {
    loadSettings();
    fetchCRMContext();
    
    // Welcome message
    setMessages([{
      id: '1',
      message: "Hello! I'm your AI CRM assistant powered by Gemini. I can help you analyze your sales data, generate reports, and provide insights. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('gemini_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('gemini_settings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Gemini settings have been updated",
    });
    setShowSettings(false);
  };

  const fetchCRMContext = async () => {
    try {
      // Fetch deals
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (dealsError) throw dealsError;

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw projectsError;

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*');

      if (leadsError) throw leadsError;

      const totalDeals = deals?.length || 0;
      const totalValue = deals?.reduce((sum, deal) => sum + deal.value, 0) || 0;
      const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
      const totalLeads = leads?.length || 0;
      const wonDeals = deals?.filter(d => d.stage === 'closed_won').length || 0;
      const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      setCrmContext({
        totalDeals,
        totalValue,
        recentDeals: deals || [],
        activeProjects,
        totalLeads,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching CRM context:', error);
    }
  };

  const generateSystemPrompt = () => {
    if (!crmContext) return "You are a helpful CRM assistant.";

    return `You are an AI CRM assistant with access to the following business data:

    Current Business Metrics:
    - Total Deals: ${crmContext.totalDeals}
    - Total Pipeline Value: ${crmContext.totalValue.toLocaleString()} EGP
    - Active Projects: ${crmContext.activeProjects}
    - Total Leads: ${crmContext.totalLeads}
    - Conversion Rate: ${crmContext.conversionRate.toFixed(1)}%

    Recent Deals:
    ${crmContext.recentDeals.map(deal => 
      `- ${deal.name}: ${deal.value.toLocaleString()} EGP (${deal.stage})`
    ).join('\n')}

    You should:
    1. Provide insights based on this real data
    2. Generate actionable recommendations
    3. Create reports when requested
    4. Answer questions about sales performance
    5. Suggest improvements to sales processes
    6. Be concise but comprehensive in your responses

    Always reference the actual data when providing insights.`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: newMessage,
          systemPrompt: generateSystemPrompt(),
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        }
      });

      if (error) {
        throw error;
      }

      const botResponse = data?.response || "I'm sorry, I couldn't process your request.";

      // Determine message type
      let messageType: 'report' | 'analysis' | 'recommendation' | undefined;
      if (newMessage.toLowerCase().includes('report')) messageType = 'report';
      else if (newMessage.toLowerCase().includes('analyz') || newMessage.toLowerCase().includes('insight')) messageType = 'analysis';
      else if (newMessage.toLowerCase().includes('recommend') || newMessage.toLowerCase().includes('suggest')) messageType = 'recommendation';

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: "I'm sorry, I encountered an error while processing your request. Please check your API key and try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to get response from Gemini",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = (type: 'daily' | 'weekly' | 'monthly') => {
    const reportPrompt = `Generate a comprehensive ${type} CRM report including:
    1. Sales performance summary
    2. Pipeline analysis
    3. Key metrics and trends
    4. Actionable recommendations
    5. Areas of concern or opportunity
    
    Format it as a professional business report.`;
    
    setNewMessage(reportPrompt);
    sendMessage();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'report': return <FileText className="w-4 h-4" />;
      case 'analysis': return <TrendingUp className="w-4 h-4" />;
      case 'recommendation': return <Sparkles className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 h-[calc(100vh-2rem)]">
      {/* Quick Actions Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Quick Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('daily')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Daily Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('weekly')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Weekly Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('monthly')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Monthly Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-xs"
              onClick={() => setNewMessage("Analyze my sales pipeline performance")}
            >
              Pipeline Analysis
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-xs"
              onClick={() => setNewMessage("What are my top performing deals?")}
            >
              Top Deals
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-xs"
              onClick={() => setNewMessage("Give me recommendations to improve conversion rate")}
            >
              Improve Conversion
            </Button>
          </CardContent>
        </Card>

        {crmContext && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Total Deals:</span>
                <span className="font-medium">{crmContext.totalDeals}</span>
              </div>
              <div className="flex justify-between">
                <span>Pipeline Value:</span>
                <span className="font-medium">{crmContext.totalValue.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between">
                <span>Active Projects:</span>
                <span className="font-medium">{crmContext.activeProjects}</span>
              </div>
              <div className="flex justify-between">
                <span>Conversion Rate:</span>
                <span className="font-medium">{crmContext.conversionRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Interface */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Gemini CRM Assistant
            </CardTitle>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gemini Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      value={settings.model}
                      disabled
                      onChange={(e) => setSettings({...settings, model: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground mt-1">API key is securely stored on the server</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Temperature (0-1)</label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Tokens</label>
                    <Input
                      type="number"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                    />
                  </div>
                  <Button onClick={saveSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md`}>
                  <div className="flex items-center gap-2 mb-1">
                    {message.sender === 'bot' ? (
                      <Bot className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {message.sender === 'bot' ? 'Gemini Assistant' : 'You'}
                    </span>
                    {message.type && getMessageIcon(message.type)}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <pre className="text-sm whitespace-pre-wrap font-sans">{message.message}</pre>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Gemini Assistant</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me about your CRM data, request reports, or get insights..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                className="flex-1"
                disabled={isLoading || !settings.apiKey}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || isLoading || !settings.apiKey}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}