/**
 * AI Service
 * 
 * Handles integration with Google Generative AI (Gemini).
 * Provides intelligent insights for calls and customer data.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey) {
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✨ Gemini AI initialized');
    } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
    }
} else {
    console.warn('⚠️ GEMINI_API_KEY not found. AI features will be disabled.');
}

/**
 * Generate insights from call transcript
 * Returns: summary, intent, sentiment, key points, action items
 */
async function generateCallInsights(transcript, customerContext = {}) {
    if (!model) return null;

    try {
        const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');

        const prompt = `
            Analyze the following customer service call transcript (this may be an ongoing active call or a completed one) and provide a structured JSON response.
            
            Customer Context: ${JSON.stringify(customerContext)}
            
            Transcript:
            ${transcriptText}
            
            Response Format (JSON only):
            {
                "summary": "Brief 2-3 sentence summary of the conversation so far",
                "intent": "Primary reason for the call (e.g., purchase, support, inquiry, complaint)",
                "sentiment": "Overall sentiment (positive, neutral, negative)",
                "sentimentScore": "Score between -1 (negative) and 1 (positive)",
                "keyPoints": ["List of 3-5 important points discussed so far"],
                "actionItems": ["List of follow-up tasks (if any obvious ones)"],
                "outcome": "Status of the call (ongoing, resolved, pending)"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract JSON from response (remove markdown code blocks if present)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;

    } catch (error) {
        console.error('Error generating call insights:', error);
        return null;
    }
}

/**
 * Generate unified customer profile from disparate data
 * "Single folder" concept - aggregating emails, calls, and notes
 */
async function generateCustomerProfile(emails, calls, notes) {
    if (!model) return null;

    try {
        const dataContext = `
            Emails: ${JSON.stringify(emails.slice(0, 5))}
            Recent Calls: ${JSON.stringify(calls.slice(0, 5))}
            Agent Notes: ${JSON.stringify(notes)}
        `;

        const prompt = `
            Create a comprehensive customer profile based on the following interaction history.
            This is for an agent to quickly understand the customer's status and needs.

            Data:
            ${dataContext}

            Response Format (JSON only):
            {
                "profileSummary": "Consolidated overview of the customer relationship",
                "keyInterests": ["List of product/service interests"],
                "painPoints": ["List of recurring issues or complaints"],
                "communicationStyle": "Preferred style/tone",
                "urgencyLevel": "low/medium/high",
                "nextBestAction": "Recommended next step for the agent"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;

    } catch (error) {
        console.error('Error generating customer profile:', error);
        return null;
    }
}

module.exports = {
    generateCallInsights,
    generateCustomerProfile,
    isConfigured: () => !!model
};
