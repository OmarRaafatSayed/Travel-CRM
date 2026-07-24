// This is a mock service to simulate Gemini API responses for the UI.
// In a real application, you would import and use @google/genai here.
// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responses: Record<string, string> = {
    'add lead': "Of course. To add a new lead, I'll need their name, company, and email address. What are the details?",
    'add deal': "Let's get this deal in the pipeline. What is the deal's title, which client is it for, and what's the estimated value?",
    'add project': "I can set up a new project. What should we name it, and which client does it belong to?",
    'add account': "Adding a new account. Is this a client, partner, or another type of organization? I'll need the company name to start.",
    'view leads': "I'm pulling up the list of all active leads right now. You can see them on the 'Deals' page, filtered by the 'New Lead' stage.",
    'view deals': "Navigating you to the Deals Pipeline. You can see all opportunities organized by stage.",
    'generate analytics': "I'm compiling a comprehensive analytics report. It will cover key metrics like deal conversion rates, revenue trends, and project velocity. I'll let you know when it's ready.",
    'revenue chart': "Here is the revenue chart. It looks like there's a strong upward trend this month! You can find more details on the Analytics page.",
    'deals chart': "Displaying the deals distribution chart. It seems 'Proposal' and 'Negotiation' are your most active stages right now.",
    'leads chart': "Here's a breakdown of lead sources for the last quarter. It appears 'Organic Search' is your top-performing channel.",
    'projects chart': "I'm showing the current status of all projects. Most are 'In Progress' and on track.",
    'create mind map': "Excellent idea. I'm creating a mind map for your 'Q4 Growth Strategy'. Key nodes will be 'New Market Expansion', 'Product Line Diversification', and 'Strategic Partnerships'. Here's the visualization.",
    'default': "I can help with that. For better client communication, try sending a brief weekly update email. It keeps them in the loop and shows proactive engagement."
};

export const mockGeminiResponse = (prompt: string): Promise<string> => {
    console.log(`Mocking Gemini call for prompt: "${prompt}"`);
    const lowerCasePrompt = prompt.toLowerCase();
    
    const matchedKey = Object.keys(responses).find(key => lowerCasePrompt.includes(key));
    const response = matchedKey ? responses[matchedKey] : responses['default'];

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(response);
        }, 1200); // Simulate network delay
    });
};