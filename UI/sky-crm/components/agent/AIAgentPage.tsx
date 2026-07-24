import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { Avatar } from '../ui/Avatar';
import { mockGeminiResponse } from '../../services/geminiService';
import { Card, CardContent } from '../ui/Card';
import { ChatMessage } from '../../types';

interface AIAgentPageProps {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const actionTags = {
    "Create": ['Add Lead', 'Add Deal', 'Add Project', 'Add Account'],
    "View & Analyze": ['View Leads', 'View Deals', 'Generate Analytics', 'Revenue Chart', 'Deals Chart', 'Projects Chart'],
    "Strategize": ['Create Mind Map'],
};

export const AIAgentPage: React.FC<AIAgentPageProps> = ({ messages, setMessages }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (prompt?: string) => {
        const userMessage = prompt || input;
        if (!userMessage.trim() || isLoading) return;

        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setIsLoading(true);

        const aiResponse = await mockGeminiResponse(userMessage);
        
        setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        setIsLoading(false);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend();
    };

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto">
            <div className="flex-shrink-0 mb-6 text-center">
                <h1 className="text-3xl font-bold">AI Agent</h1>
                <p className="text-muted-foreground mt-1">Your smart assistant for managing your CRM.</p>
            </div>

            <Card className="flex-grow flex flex-col">
                <CardContent className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                    <Icons.logo className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>
                                <p className="text-sm leading-relaxed">{typeof msg.text === 'string' ? msg.text : ''}</p>
                            </div>
                            {msg.sender === 'user' && (
                                <Avatar src="https://picsum.photos/seed/user1/40/40" alt="User" className="w-8 h-8 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                             <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                <Icons.logo className="w-5 h-5" />
                            </div>
                            <div className="max-w-md p-3 rounded-lg bg-secondary">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75"></span>
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="border-t p-4">
                    <div className="mb-3 space-y-3">
                        {Object.entries(actionTags).map(([category, tags]) => (
                            <div key={category}>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2">{category}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button 
                                            key={tag} 
                                            onClick={() => handleSend(tag)}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            disabled={isLoading}
                            className="flex-grow px-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="submit" disabled={isLoading} className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            <Icons.send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </Card>
        </div>
    );
};
