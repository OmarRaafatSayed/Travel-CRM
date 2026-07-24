import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  MessageSquarePlus,
  Settings,
  History,
  Loader2,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { geminiService } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationState {
  type: 'create_lead' | 'create_deal' | 'create_task' | 'create_account' | null;
  step: number;
  data: Record<string, any>;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  last_message: string;
}

export default function AIAssistant() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({ type: null, step: 0, data: {} });
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'testing' | 'active' | 'error'>('testing');
  const [intentCache, setIntentCache] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === 'ar';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test API once per session and load chat sessions
  useEffect(() => {
    const testApiAndLoadChats = async () => {
      if (!user?.id || !organization?.id) return;
      
      // Check localStorage for API status
      const storedStatus = localStorage.getItem('gemini_api_status');
      const lastTest = localStorage.getItem('gemini_api_test_time');
      const now = Date.now();
      
      // Test if no stored status or last test was more than 1 hour ago
      if (!storedStatus || !lastTest || (now - parseInt(lastTest)) > 3600000) {
        try {
          setApiStatus('testing');
          
          const testPromise = geminiService.generateResponse('Test');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          );
          
          const testResponse = await Promise.race([testPromise, timeoutPromise]);
          
          if (testResponse && typeof testResponse === 'string' && testResponse.length > 0) {
            setApiStatus('active');
            localStorage.setItem('gemini_api_status', 'active');
            localStorage.setItem('gemini_api_test_time', now.toString());
            console.log('✅ Gemini API test successful');
          } else {
            setApiStatus('error');
            localStorage.setItem('gemini_api_status', 'error');
            localStorage.setItem('gemini_api_test_time', now.toString());
          }
        } catch (error) {
          console.error('❌ API test failed:', error);
          setApiStatus('error');
          localStorage.setItem('gemini_api_status', 'error');
          localStorage.setItem('gemini_api_test_time', now.toString());
        }
      } else {
        // Use stored status
        setApiStatus(storedStatus as 'active' | 'error');
      }
      
      // Load chat sessions from ai_chat_sessions
      const { data: sessions } = await supabase
        .from('ai_chat_sessions')
        .select('id, session_name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (sessions && sessions.length > 0) {
        setChatSessions(sessions.map((s: any) => ({
          id: s.id,
          title: s.session_name || 'New Conversation',
          created_at: s.created_at,
          last_message: ''
        })));
        
        // Load latest session
        setCurrentSessionId(sessions[0].id);
        await loadSessionMessages(sessions[0].id);
      } else {
        startNewChat();
      }
    };
    
    testApiAndLoadChats();
  }, [user?.id, organization?.id]);

  const loadSessionMessages = async (sessionId: string) => {
    const { data: messages } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (messages) {
      const sessionMessages = messages.map((msg: any) => ({
        id: msg.id,
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.message,
        timestamp: new Date(msg.created_at)
      }));
      setMessages(sessionMessages);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!user?.id || !currentSessionId) return;
    
    await supabase.from('ai_chat_messages').insert({
      session_id: currentSessionId,
      sender: message.role,
      message: message.content
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      let aiResponse: string;
      
      // Handle conversation flow
      if (conversationState.type) {
        aiResponse = await handleConversationFlow(userInput);
      } else {
        // Check if starting new conversation
        const intentResult = await detectIntent(userInput);
        if (intentResult) {
          aiResponse = intentResult;
        } else {
          // Check API status before using Gemini
          if (apiStatus !== 'active') {
            aiResponse = isRTL 
              ? 'عذراً، المساعد الذكي غير متاح حالياً. يرجى المحاولة لاحقاً.'
              : 'Sorry, AI assistant is currently unavailable. Please try again later.';
          } else {
            // Use Gemini for general queries with shorter prompt
            const prompt = isRTL 
              ? `أنت مساعد CRM. أجب باختصار:\n${userInput}`
              : `You are a CRM assistant. Answer briefly:\n${userInput}`;
            aiResponse = await geminiService.generateResponse(prompt);
          }
        }
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      await saveMessage(aiMessage);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isRTL ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Sorry, there was an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const detectIntent = async (input: string): Promise<string | null> => {
    const inputKey = input.toLowerCase().trim();
    
    // Check cache first
    if (intentCache.has(inputKey)) {
      const cachedIntent = intentCache.get(inputKey);
      return await handleAIIntent(cachedIntent, input);
    }
    
    // Fast pattern matching for common requests
    const fastIntent = getFastIntent(input);
    if (fastIntent) {
      intentCache.set(inputKey, fastIntent);
      return await handleAIIntent(fastIntent, input);
    }
    
    // Use AI for complex requests
    try {
      const intentPrompt = `Analyze and respond with JSON only:
{"action":"create_lead|create_deal|create_task|create_account|show_leads|show_deals|show_tasks|show_accounts|show_report|general","data":{}}

Message: "${input}"`;

      const response = await geminiService.generateResponse(intentPrompt);
      const jsonMatch = response.match(/\{[^}]*\}/);
      
      if (jsonMatch) {
        const intent = JSON.parse(jsonMatch[0]);
        intentCache.set(inputKey, intent);
        return await handleAIIntent(intent, input);
      }
    } catch (error) {
      console.error('Intent detection failed:', error);
    }
    
    return null;
  };

  const getFastIntent = (input: string) => {
    const lower = input.toLowerCase();
    
    // Arabic patterns
    if (lower.includes('عايز') || lower.includes('اعمل') || lower.includes('أنشئ')) {
      if (lower.includes('ليد') || lower.includes('عميل')) return { action: 'create_lead', data: {} };
      if (lower.includes('صفقة')) return { action: 'create_deal', data: {} };
      if (lower.includes('مهمة')) return { action: 'create_task', data: {} };
      if (lower.includes('حساب') || lower.includes('شركة')) return { action: 'create_account', data: {} };
    }
    
    if (lower.includes('اعرض') || lower.includes('شوف')) {
      if (lower.includes('ليد') || lower.includes('عميل')) return { action: 'show_leads', data: {} };
      if (lower.includes('صفقات')) return { action: 'show_deals', data: {} };
      if (lower.includes('مهام')) return { action: 'show_tasks', data: {} };
      if (lower.includes('حسابات')) return { action: 'show_accounts', data: {} };
      if (lower.includes('تقرير')) return { action: 'show_report', data: {} };
    }
    
    // English patterns
    if (lower.includes('create') || lower.includes('add') || lower.includes('new')) {
      if (lower.includes('lead')) return { action: 'create_lead', data: {} };
      if (lower.includes('deal')) return { action: 'create_deal', data: {} };
      if (lower.includes('task')) return { action: 'create_task', data: {} };
      if (lower.includes('account')) return { action: 'create_account', data: {} };
    }
    
    if (lower.includes('show') || lower.includes('list') || lower.includes('display')) {
      if (lower.includes('lead')) return { action: 'show_leads', data: {} };
      if (lower.includes('deal')) return { action: 'show_deals', data: {} };
      if (lower.includes('task')) return { action: 'show_tasks', data: {} };
      if (lower.includes('account')) return { action: 'show_accounts', data: {} };
      if (lower.includes('report')) return { action: 'show_report', data: {} };
    }
    
    return null;
  };

  const handleAIIntent = async (intent: any, originalInput: string): Promise<string> => {
    const { action, data } = intent;
    
    switch (action) {
      case 'create_lead':
        if (data.first_name && data.last_name && data.email) {
          // Create lead directly with provided data
          return await createLeadWithData({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || '+1234567890',
            company: data.company || 'Unknown Company'
          });
        } else {
          // Start conversation flow
          setConversationState({ type: 'create_lead', step: 1, data });
          return isRTL ? 'ممتاز! دعني أساعدك في إنشاء عميل محتمل جديد. ما هو الاسم الأول؟' : 'Great! Let me help you create a new lead. What\'s the first name?';
        }
        
      case 'create_deal':
        if (data.deal_name && data.deal_value) {
          return await createDealWithData({
            name: data.deal_name,
            value: data.deal_value,
            stage: 'lead'
          });
        } else {
          setConversationState({ type: 'create_deal', step: 1, data });
          return isRTL ? 'رائع! سأساعدك في إنشاء صفقة جديدة. ما هو اسم الصفقة؟' : 'Excellent! I\'ll help you create a new deal. What\'s the deal name?';
        }
        
      case 'create_task':
        if (data.task_title) {
          return await createTaskWithData({
            title: data.task_title,
            description: data.task_description || 'Task created by AI',
            priority: data.priority || 'medium'
          });
        } else {
          setConversationState({ type: 'create_task', step: 1, data });
          return isRTL ? 'حسناً! دعني أساعدك في إنشاء مهمة جديدة. ما هو عنوان المهمة؟' : 'Perfect! Let me help you create a new task. What\'s the task title?';
        }
        
      case 'create_account':
        if (data.company) {
          return await createAccountWithData({
            name: data.company,
            email: data.email || 'info@company.com',
            industry: 'business',
            city: 'Cairo'
          });
        } else {
          setConversationState({ type: 'create_account', step: 1, data });
          return isRTL ? 'ممتاز! سأساعدك في إنشاء حساب جديد. ما هو اسم الشركة؟' : 'Great! I\'ll help you create a new account. What\'s the company name?';
        }
        
      case 'show_leads':
        return await getLeads();
      case 'show_deals':
        return await getDeals();
      case 'show_tasks':
        return await getTasks();
      case 'show_accounts':
        return await getAccounts();
      case 'show_report':
        return await generateReport();
        
      default:
        return null;
    }
  };

  const handleConversationFlow = async (input: string): Promise<string> => {
    const { type, step, data } = conversationState;
    
    if (type === 'create_lead') {
      return await handleLeadCreation(input, step, data);
    } else if (type === 'create_deal') {
      return await handleDealCreation(input, step, data);
    } else if (type === 'create_task') {
      return await handleTaskCreation(input, step, data);
    } else if (type === 'create_account') {
      return await handleAccountCreation(input, step, data);
    }
    
    return 'Something went wrong. Please try again.';
  };

  const handleLeadCreation = async (input: string, step: number, data: any): Promise<string> => {
    const newData = { ...data };
    
    switch (step) {
      case 1:
        newData.first_name = input;
        setConversationState({ type: 'create_lead', step: 2, data: newData });
        return isRTL ? 'شكراً! الآن ما هو الاسم الأخير؟' : 'Thanks! Now what\'s the last name?';
      
      case 2:
        newData.last_name = input;
        setConversationState({ type: 'create_lead', step: 3, data: newData });
        return isRTL ? 'ممتاز! ما هو البريد الإلكتروني؟' : 'Great! What\'s the email address?';
      
      case 3:
        newData.email = input;
        setConversationState({ type: 'create_lead', step: 4, data: newData });
        return isRTL ? 'رائع! ما هو رقم الهاتف؟' : 'Perfect! What\'s the phone number?';
      
      case 4:
        newData.phone = input;
        setConversationState({ type: 'create_lead', step: 5, data: newData });
        return isRTL ? 'ممتاز! ما هو اسم الشركة؟' : 'Excellent! What\'s the company name?';
      
      case 5:
        newData.company = input;
        return await createLeadWithData(newData);
      
      default:
        setConversationState({ type: null, step: 0, data: {} });
        return isRTL ? 'حدث خطأ. دعنا نبدأ من جديد.' : 'Something went wrong. Let\'s start over.';
    }
  };

  const handleDealCreation = async (input: string, step: number, data: any): Promise<string> => {
    const newData = { ...data };
    
    switch (step) {
      case 1:
        newData.name = input;
        setConversationState({ type: 'create_deal', step: 2, data: newData });
        return isRTL ? 'ممتاز! ما هي قيمة الصفقة بالدولار؟' : 'Great! What\'s the deal value in USD?';
      
      case 2:
        newData.value = parseFloat(input) || 0;
        setConversationState({ type: 'create_deal', step: 3, data: newData });
        return isRTL ? 'رائع! ما هي مرحلة الصفقة؟ (lead, qualified, proposal, negotiation, closed_won, closed_lost)' : 'Perfect! What\'s the deal stage? (lead, qualified, proposal, negotiation, closed_won, closed_lost)';
      
      case 3:
        newData.stage = input;
        return await createDealWithData(newData);
      
      default:
        setConversationState({ type: null, step: 0, data: {} });
        return isRTL ? 'حدث خطأ. دعنا نبدأ من جديد.' : 'Something went wrong. Let\'s start over.';
    }
  };

  const handleTaskCreation = async (input: string, step: number, data: any): Promise<string> => {
    const newData = { ...data };
    
    switch (step) {
      case 1:
        newData.title = input;
        setConversationState({ type: 'create_task', step: 2, data: newData });
        return isRTL ? 'ممتاز! ما هو وصف المهمة؟' : 'Great! What\'s the task description?';
      
      case 2:
        newData.description = input;
        setConversationState({ type: 'create_task', step: 3, data: newData });
        return isRTL ? 'رائع! ما هي أولوية المهمة؟ (low, medium, high)' : 'Perfect! What\'s the task priority? (low, medium, high)';
      
      case 3:
        newData.priority = input;
        return await createTaskWithData(newData);
      
      default:
        setConversationState({ type: null, step: 0, data: {} });
        return isRTL ? 'حدث خطأ. دعنا نبدأ من جديد.' : 'Something went wrong. Let\'s start over.';
    }
  };

  const handleAccountCreation = async (input: string, step: number, data: any): Promise<string> => {
    const newData = { ...data };
    
    switch (step) {
      case 1:
        newData.name = input;
        setConversationState({ type: 'create_account', step: 2, data: newData });
        return isRTL ? 'ممتاز! ما هو البريد الإلكتروني للشركة؟' : 'Great! What\'s the company email?';
      
      case 2:
        newData.email = input;
        setConversationState({ type: 'create_account', step: 3, data: newData });
        return isRTL ? 'رائع! ما هو مجال الشركة؟' : 'Perfect! What\'s the company industry?';
      
      case 3:
        newData.industry = input;
        setConversationState({ type: 'create_account', step: 4, data: newData });
        return isRTL ? 'ممتاز! في أي مدينة تقع الشركة؟' : 'Excellent! In which city is the company located?';
      
      case 4:
        newData.city = input;
        return await createAccountWithData(newData);
      
      default:
        setConversationState({ type: null, step: 0, data: {} });
        return isRTL ? 'حدث خطأ. دعنا نبدأ من جديد.' : 'Something went wrong. Let\'s start over.';
    }
  };

  const createLeadWithData = async (leadData: any): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          source: 'ai_assistant',
          status: 'new',
          organization_id: organization.id,
          created_by: user?.id,
          score: 50
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setConversationState({ type: null, step: 0, data: {} });
      
      return isRTL 
        ? `✅ **تم إنشاء العميل المحتمل بنجاح!**\n\n📊 **تفاصيل العميل:**\n- الاسم: ${data.first_name} ${data.last_name}\n- البريد الإلكتروني: ${data.email}\n- الهاتف: ${data.phone}\n- الشركة: ${data.company}\n- الحالة: ${data.status}\n\nهل تريد إنشاء شيء آخر؟`
        : `✅ **Lead created successfully!**\n\n📊 **Lead Details:**\n- Name: ${data.first_name} ${data.last_name}\n- Email: ${data.email}\n- Phone: ${data.phone}\n- Company: ${data.company}\n- Status: ${data.status}\n\nWould you like to create something else?`;
    } catch (error) {
      setConversationState({ type: null, step: 0, data: {} });
      return `❌ Error creating lead: ${error.message}`;
    }
  };

  const createDealWithData = async (dealData: any): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          name: dealData.name,
          value: dealData.value,
          stage: dealData.stage,
          probability: dealData.stage === 'lead' ? 25 : dealData.stage === 'qualified' ? 50 : dealData.stage === 'proposal' ? 75 : 90,
          organization_id: organization.id,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setConversationState({ type: null, step: 0, data: {} });
      
      return isRTL 
        ? `✅ **تم إنشاء الصفقة بنجاح!**\n\n💰 **تفاصيل الصفقة:**\n- الاسم: ${data.name}\n- القيمة: $${data.value?.toLocaleString()}\n- المرحلة: ${data.stage}\n- الاحتمالية: ${data.probability}%\n\nهل تريد إنشاء شيء آخر؟`
        : `✅ **Deal created successfully!**\n\n💰 **Deal Details:**\n- Name: ${data.name}\n- Value: $${data.value?.toLocaleString()}\n- Stage: ${data.stage}\n- Probability: ${data.probability}%\n\nWould you like to create something else?`;
    } catch (error) {
      setConversationState({ type: null, step: 0, data: {} });
      return `❌ Error creating deal: ${error.message}`;
    }
  };

  const createTaskWithData = async (taskData: any): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          status: 'todo',
          priority: taskData.priority,
          organization_id: organization.id,
          created_by: user?.id,
          progress: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setConversationState({ type: null, step: 0, data: {} });
      
      return isRTL 
        ? `✅ **تم إنشاء المهمة بنجاح!**\n\n📋 **تفاصيل المهمة:**\n- العنوان: ${data.title}\n- الوصف: ${data.description}\n- الحالة: ${data.status}\n- الأولوية: ${data.priority}\n\nهل تريد إنشاء شيء آخر؟`
        : `✅ **Task created successfully!**\n\n📋 **Task Details:**\n- Title: ${data.title}\n- Description: ${data.description}\n- Status: ${data.status}\n- Priority: ${data.priority}\n\nWould you like to create something else?`;
    } catch (error) {
      setConversationState({ type: null, step: 0, data: {} });
      return `❌ Error creating task: ${error.message}`;
    }
  };

  const createAccountWithData = async (accountData: any): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          name: accountData.name,
          email: accountData.email,
          industry: accountData.industry,
          city: accountData.city,
          country: 'Egypt',
          organization_id: organization.id,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setConversationState({ type: null, step: 0, data: {} });
      
      return isRTL 
        ? `✅ **تم إنشاء الحساب بنجاح!**\n\n🏢 **تفاصيل الحساب:**\n- الاسم: ${data.name}\n- البريد الإلكتروني: ${data.email}\n- المجال: ${data.industry}\n- الموقع: ${data.city}, ${data.country}\n\nهل تريد إنشاء شيء آخر؟`
        : `✅ **Account created successfully!**\n\n🏢 **Account Details:**\n- Name: ${data.name}\n- Email: ${data.email}\n- Industry: ${data.industry}\n- Location: ${data.city}, ${data.country}\n\nWould you like to create something else?`;
    } catch (error) {
      setConversationState({ type: null, step: 0, data: {} });
      return `❌ Error creating account: ${error.message}`;
    }
  };

  const getLeads = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization.id)
        .limit(5);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return '📋 No leads found in your organization.';
      }
      
      let result = `📊 **Recent Leads (${data.length}):**\n\n`;
      data.forEach((lead, index) => {
        result += `${index + 1}. **${lead.first_name} ${lead.last_name}**\n`;
        result += `   📧 ${lead.email}\n`;
        result += `   🏢 ${lead.company}\n`;
        result += `   📈 Score: ${lead.score}/100\n\n`;
      });
      
      return result;
    } catch (error) {
      return `❌ Error fetching leads: ${error.message}`;
    }
  };

  const getDeals = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('organization_id', organization.id)
        .limit(5);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return '💼 No deals found in your organization.';
      }
      
      let result = `💰 **Recent Deals (${data.length}):**\n\n`;
      data.forEach((deal, index) => {
        result += `${index + 1}. **${deal.name}**\n`;
        result += `   💵 Value: $${deal.value?.toLocaleString() || 0}\n`;
        result += `   📊 Stage: ${deal.stage}\n`;
        result += `   🎯 Probability: ${deal.probability || 0}%\n\n`;
      });
      
      return result;
    } catch (error) {
      return `❌ Error fetching deals: ${error.message}`;
    }
  };

  const getTasks = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organization.id)
        .limit(5);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return '📋 No tasks found in your organization.';
      }
      
      let result = `✅ **Recent Tasks (${data.length}):**\n\n`;
      data.forEach((task, index) => {
        result += `${index + 1}. **${task.title}**\n`;
        result += `   📊 Status: ${task.status}\n`;
        result += `   🔥 Priority: ${task.priority}\n`;
        result += `   📈 Progress: ${task.progress || 0}%\n\n`;
      });
      
      return result;
    } catch (error) {
      return `❌ Error fetching tasks: ${error.message}`;
    }
  };

  const getAccounts = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('organization_id', organization.id)
        .limit(5);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return '🏢 No accounts found in your organization.';
      }
      
      let result = `🏢 **Recent Accounts (${data.length}):**\n\n`;
      data.forEach((account, index) => {
        result += `${index + 1}. **${account.name}**\n`;
        result += `   📧 ${account.email}\n`;
        result += `   🏭 Industry: ${account.industry}\n`;
        result += `   📍 Location: ${account.city}, ${account.country}\n\n`;
      });
      
      return result;
    } catch (error) {
      return `❌ Error fetching accounts: ${error.message}`;
    }
  };

  const generateReport = async (): Promise<string> => {
    try {
      const [leadsRes, dealsRes, tasksRes, accountsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('organization_id', organization.id),
        supabase.from('deals').select('*').eq('organization_id', organization.id),
        supabase.from('tasks').select('*').eq('organization_id', organization.id),
        supabase.from('accounts').select('*').eq('organization_id', organization.id)
      ]);
      
      const leads = leadsRes.data || [];
      const deals = dealsRes.data || [];
      const tasks = tasksRes.data || [];
      const accounts = accountsRes.data || [];
      
      const totalRevenue = deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0);
      const activeTasks = tasks.filter(t => t.status !== 'completed').length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      
      return `📊 **Organization Report**\n\n` +
             `📈 **Overview:**\n` +
             `• Total Leads: ${leads.length}\n` +
             `• Total Deals: ${deals.length}\n` +
             `• Total Accounts: ${accounts.length}\n` +
             `• Total Tasks: ${tasks.length}\n\n` +
             `💰 **Revenue:**\n` +
             `• Total Revenue: $${totalRevenue.toLocaleString()}\n\n` +
             `✅ **Tasks:**\n` +
             `• Active Tasks: ${activeTasks}\n` +
             `• Completed Tasks: ${completedTasks}\n` +
             `• Completion Rate: ${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%`;
    } catch (error) {
      return `❌ Error generating report: ${error.message}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    setConversationState({ type: null, step: 0, data: {} });
    
    const welcomeMessage = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: isRTL 
        ? 'مرحباً! أنا مساعدك الذكي. يمكنني مساعدتك في إنشاء العملاء المحتملين والصفقات والمهام. ما الذي تريد إنشاؤه؟'
        : 'Hello! I\'m your AI assistant. I can help you create leads, deals, tasks, and accounts. What would you like to create?',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    saveMessage(welcomeMessage);
  };

  const loadChatSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setConversationState({ type: null, step: 0, data: {} });
    await loadSessionMessages(sessionId);
  };

  const deleteChatSession = async (sessionId: string) => {
    await supabase
      .from('ai_chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user?.id);
    
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (currentSessionId === sessionId) {
      startNewChat();
    }
    
    setDeleteConfirm(null);
  };

  return (
    <div className={cn(
      "flex h-screen bg-gradient-to-br from-background via-background to-muted/20",
      isRTL && "rtl"
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-border bg-card/50 backdrop-blur-sm flex flex-col",
        isRTL ? "border-l" : "border-r"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          
          <Button 
            onClick={startNewChat}
            className="w-full bg-primary hover:bg-primary/90"
            size="sm"
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            {isRTL ? 'محادثة جديدة' : 'New Chat'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isRTL ? 'المحادثات السابقة' : 'Recent Chats'}
            </p>
            <div className="space-y-1">
              {chatSessions.map((session) => (
                <div 
                  key={session.id}
                  className={cn(
                    "group relative p-2 rounded-lg hover:bg-muted/50 transition-colors",
                    currentSessionId === session.id && "bg-muted"
                  )}
                >
                  <div 
                    onClick={() => loadChatSession(session.id)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm text-foreground truncate pr-6">
                      {session.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString(isRTL ? 'ar' : 'en')}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity",
                      isRTL ? "left-1" : "right-1"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(session.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <div className="p-2 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'لا توجد محادثات سابقة' : 'No recent chats'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <div className={cn(
            "flex items-center gap-3",
            isRTL && "flex-row-reverse"
          )}>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'متصل' : 'Online'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">
              {isRTL ? 'حذف المحادثة' : 'Delete Chat'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRTL 
                ? 'هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this chat? This action cannot be undone.'
              }
            </p>
            <div className={cn(
              "flex gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteChatSession(deleteConfirm)}
              >
                {isRTL ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className={cn(isRTL && "text-right")}>
                <h1 className="text-lg font-semibold text-foreground">
                  {isRTL ? 'المساعد الذكي' : 'AI Assistant'}
                </h1>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    apiStatus === 'active' && "bg-green-500 animate-pulse",
                    apiStatus === 'testing' && "bg-yellow-500 animate-pulse",
                    apiStatus === 'error' && "bg-red-500"
                  )}></div>
                  <p className="text-xs text-muted-foreground">
                    {apiStatus === 'active' && (isRTL ? 'نشط الآن' : 'Active now')}
                    {apiStatus === 'testing' && (isRTL ? 'جاري الاختبار...' : 'Testing...')}
                    {apiStatus === 'error' && (isRTL ? 'خطأ في الاتصال' : 'Connection error')}
                  </p>
                </div>
              </div>
            </div>
            
            <Badge 
              variant={apiStatus === 'active' ? 'default' : apiStatus === 'error' ? 'destructive' : 'secondary'} 
              className="gap-1"
            >
              <Sparkles className="w-3 h-3" />
              {apiStatus === 'active' && (isRTL ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered')}
              {apiStatus === 'testing' && (isRTL ? 'جاري الاختبار...' : 'Testing API...')}
              {apiStatus === 'error' && (isRTL ? 'خطأ في API' : 'API Error')}
            </Badge>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  message.role === 'user' && !isRTL && "flex-row-reverse",
                  message.role === 'user' && isRTL && "",
                  message.role === 'assistant' && isRTL && "flex-row-reverse"
                )}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  {message.role === 'assistant' ? (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className={cn(
                  "flex-1 space-y-1",
                  message.role === 'user' && !isRTL && "text-right",
                  message.role === 'user' && isRTL && "text-left"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {message.role === 'assistant' 
                        ? (isRTL ? 'المساعد' : 'Assistant')
                        : (isRTL ? 'أنت' : 'You')
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString(isRTL ? 'ar' : 'en', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <Card className={cn(
                    "p-4",
                    message.role === 'assistant' 
                      ? "bg-card border-border" 
                      : "bg-primary border-primary"
                  )}>
                    {message.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-black">
                        {message.content}
                      </p>
                    )}
                  </Card>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={cn(
                "flex gap-3 animate-in fade-in",
                isRTL && "flex-row-reverse"
              )}>
                <Avatar className="w-10 h-10">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                </Avatar>
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {isRTL ? 'جاري الكتابة...' : 'Typing...'}
                    </span>
                  </div>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            <div className={cn(
              "flex gap-3 items-end",
              isRTL && "flex-row-reverse"
            )}>
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                  className={cn(
                    "min-h-[52px] pr-4 py-3 resize-none bg-background border-border focus-visible:ring-primary",
                    isRTL && "text-right"
                  )}
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="lg"
                className="h-[52px] px-6 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className={cn("w-5 h-5", !isRTL && "mr-2", isRTL && "ml-2")} />
                    {isRTL ? 'إرسال' : 'Send'}
                  </>
                )}
              </Button>
            </div>
            
            <p className={cn(
              "text-xs text-muted-foreground mt-2",
              isRTL && "text-right"
            )}>
              {isRTL 
                ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد'
                : 'Press Enter to send, Shift+Enter for new line'
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
