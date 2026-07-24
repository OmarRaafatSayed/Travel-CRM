import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  Bot,
  ExternalLink,
  Users,
  Target,
  Calendar
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  widget?: 'deal' | 'lead' | 'meeting' | null;
  widgetData?: any;
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

const mockWidgets = {
  deal: {
    title: "Tech Solutions Ltd Deal",
    value: "LE 45,000",
    stage: "Proposal",
    probability: 75,
    nextAction: "Follow up on proposal review"
  },
  lead: {
    title: "New Lead: Cairo Fashion House",
    source: "Website Contact Form",
    score: 85,
    nextAction: "Schedule discovery call"
  },
  meeting: {
    title: "Client Meeting Scheduled",
    client: "Delta Construction",
    date: "Tomorrow, 2:00 PM",
    location: "Office Conference Room"
  }
};

export function ChatBot({ isOpen, onToggle }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you with leads, deals, scheduling, and more. Try asking me about a specific deal or client.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let botResponse: ChatMessage;
      
      // Simple pattern matching for demo
      const input = inputValue.toLowerCase();
      
      if (input.includes('deal') || input.includes('tech solutions')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: 'I found the Tech Solutions Ltd deal for you. Here are the current details:',
          sender: 'bot',
          timestamp: new Date(),
          widget: 'deal',
          widgetData: mockWidgets.deal
        };
      } else if (input.includes('lead') || input.includes('cairo fashion')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: 'Here\'s information about the Cairo Fashion House lead:',
          sender: 'bot',
          timestamp: new Date(),
          widget: 'lead',
          widgetData: mockWidgets.lead
        };
      } else if (input.includes('meeting') || input.includes('schedule')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: 'I can help you with meeting scheduling. Here\'s your next upcoming meeting:',
          sender: 'bot',
          timestamp: new Date(),
          widget: 'meeting',
          widgetData: mockWidgets.meeting
        };
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: 'I can help you with:\n• Lead and deal information\n• Scheduling meetings\n• Generating reports\n• Finding client details\n\nWhat would you like to know?',
          sender: 'bot',
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const renderWidget = (widget: string, data: any) => {
    switch (widget) {
      case 'deal':
        return (
          <Card className="mt-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {data.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium text-foreground">{data.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stage:</span>
                  <Badge className="bg-warning/20 text-warning-foreground">{data.stage}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Probability:</span>
                  <span className="font-medium text-foreground">{data.probability}%</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Next Action:</p>
                  <p className="text-sm text-foreground">{data.nextAction}</p>
                </div>
                <Button size="sm" className="w-full mt-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Full Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'lead':
        return (
          <Card className="mt-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {data.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-medium text-foreground">{data.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score:</span>
                  <Badge className="bg-success/20 text-success-foreground">{data.score}/100</Badge>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Next Action:</p>
                  <p className="text-sm text-foreground">{data.nextAction}</p>
                </div>
                <Button size="sm" className="w-full mt-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Lead Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'meeting':
        return (
          <Card className="mt-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {data.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium text-foreground">{data.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{data.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-foreground">{data.location}</span>
                </div>
                <Button size="sm" className="w-full mt-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View in Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-strong z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border-border shadow-strong z-50 flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>AI Assistant</span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div className="space-y-1">
                <div className={`p-3 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
                {message.widget && message.widgetData && renderWidget(message.widget, message.widgetData)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
              <Bot className="w-3 h-3" />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about leads, deals, or schedule..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 border-border"
          />
          <Button onClick={handleSendMessage} size="sm" className="bg-primary hover:bg-primary-hover">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}