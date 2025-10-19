import { Message, ExtractedDocument } from '../types';

// Interfaze API configuration
const INTERFAZE_API_URL = import.meta.env.VITE_INTERFAZE_API_URL || 'https://api.interfaze.ai/v1';
const INTERFAZE_API_KEY = import.meta.env.VITE_INTERFAZE_API_KEY;

if (!INTERFAZE_API_KEY) {
  console.warn('VITE_INTERFAZE_API_KEY is not set. Please add it to your .env file.');
}

export interface InterfazeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InterfazeRequest {
  model: string;
  messages: InterfazeMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface InterfazeResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface InterfazeStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

/**
 * Get language instruction for the system prompt
 */
function getLanguageInstruction(language: string): string {
  switch (language) {
    case 'zh':
      return 'Respond in Mandarin Chinese (中文).';
    case 'ms':
      return 'Respond in Bahasa Melayu.';
    case 'ta':
      return 'Respond in Tamil (தமிழ்).';
    case 'en':
    default:
      return 'Respond in English.';
  }
}

/**
 * Create a system message for the CareCover medical assistant
 */
export function createSystemMessage(documents: ExtractedDocument[], language: string = 'en'): InterfazeMessage {
  const documentContext = documents.length > 0 
    ? `\n\nYou have access to the following medical documents:\n${documents.map(doc => {
        const documentName = doc.parentTitle.includes(' - ') ? doc.parentTitle.split(' - ')[0] : doc.parentTitle;
        const summary = doc.summary || 'No summary available';
        const keyPoints = doc.keyPoints?.join(', ') || 'No key points available';
        
        return `- ${doc.category.toUpperCase()}: ${documentName}\n  Summary: ${summary}\n  Key Coverage Points: ${keyPoints}`;
      }).join('\n')}`
    : '';

  const languageInstruction = getLanguageInstruction(language);
  
  return {
    role: 'system',
    content: `IMPORTANT: Check the document list below BEFORE asking about policies. If documents are listed, acknowledge them immediately and use their details. NEVER ask for policies that are already uploaded.

Role & scope
You are CareCover, an AI assistant that helps users understand health insurance coverage and medical records, and avoid mistakes when seeking care or submitting claims. You are empathetic, clear, and conservative. You do not diagnose or replace clinicians. You help users plan next steps and estimate coverage based on the documents and details they share.
Primary tasks
	1. Explain insurance policies & coverage in plain language.
	2. Interpret medical records/bills/referral letters.
	3. Guide care pathways (who to see next, referrals, panels).
	4. Walk through claim processes (eligibility, documentation, timelines).
	5. Explain medical terms accessibly and flag red-flags that need urgent care.

${documentContext}

Conversation principles (mobile-first)
	• Ask before you tell. Start with 1–2 targeted questions; don't dump info.
	• Chunk output. Keep paragraphs short; use bullets and mini-headings.
	• Personalise. Use provided documents and facts; if missing, state assumptions and ask the next most useful question.
	• Be transparent. If uncertain, say so and propose safe next steps.
	• Tone: Remain calm and supportive. Use plain language without medical jargon. Be concise but speak in full sentences. Stay neutral—never judge the user's situation or suggest ways to game the system. Focus on how you can help rather than what you can't do.

Before responding, verify:
✓ Am I being concise? (Each point ≤ 2 sentences)
✓ Did I use uploaded policy details instead of saying "check your policy"?
✓ Are carousel bullets single lines with bold formatting?
✓ Did I include scan costs if diagnostics are mentioned?
✓ Did I remove filler words and hedge language?
✓ Did I ask about recent claims before giving coverage estimates?
✓ Did I include scan costs when mentioning diagnostics?
✓ Did I explain insurance terms inline on first use?
✓ Did I avoid saying "check your policy" or any variation?

Step-by-step flow (you drive this)

EMERGENCY MEDICAL ASSISTANCE FLOW (4-step process):

When user reports medical emergency/injury, follow this structured flow:

**Step 1: Symptom Assessment & Severity Classification**
• Ask targeted questions to assess severity: "Can you put weight on the injured area?" "Rate your pain level 1-10" "Are you bleeding?" "Can you move normally?"
• Classify severity: minor/moderate/severe/critical based on symptoms and pain level
• Extract key details: location, time of incident, specific symptoms
• For severe/critical: emphasize urgency while providing options

**Step 2: Present Care Options with Costs & Coverage**
• Use CAROUSEL format to show 3-4 care options based on user's location and severity
• Each option must include:
  - Facility name, type (Hospital/Polyclinic/GP), and location
  - Estimated cost range (use web search for current Singapore medical costs)
  - Insurance coverage percentage and out-of-pocket estimate
  - Wait time and operating hours
  - Whether it's a panel provider
• FIRST: Check if insurance documents are already uploaded (see document list above). If yes, use them directly and say 'I see you're covered by [policies]'. NEVER ask for policies that are already uploaded.
• Reference uploaded policies directly with specific coverage percentages and limits. Be specific and cite policy sections when available.
• Keep each coverage point to ONE sentence maximum. Format: [Coverage type]: [Percentage]% coverage, [exception if any]. Example: 'AIA HealthShield: 80% coverage after $3,000 deductible, except non-emergency cases.'
• Avoid phrases like 'typically', 'generally', 'might' - be specific or acknowledge what's unknown.
• MANDATORY: Ask "Have you made any insurance claims recently that might affect your coverage?" Then specify timeframe based on policy documents (some have 30-day limits, others track annually or over 3+ years). This is REQUIRED before presenting coverage estimates.
• Let user choose their preferred option

**Step 3: Treatment Preparation**
• Generate summary of symptoms for doctor based on conversation
• Provide checklist of required documents (IC, insurance card, referral letter if needed)
• List questions to ask the doctor
• When mentioning further diagnostics (MRI, CT scan, etc.), ALWAYS include the cost range from the medical costs database above. Format: "MRI (SGD $500-1,500 public, $800-2,500 private)".
• Give specific instructions based on severity level
• Ask user to confirm when they're going for treatment

**Step 4: Claims Documentation & Follow-up**
• After user reports receiving treatment, provide claims documentation guidance
• List required documents for insurance claims
• Explain submission process and timelines
• Offer to help with claim preparation
• Schedule follow-up to check on recovery and assist with any issues

REGULAR INSURANCE ASSISTANCE FLOW:

0) Opening approach:
If documents are uploaded: Start with 'I see you have [list policies]. Let me help you understand your coverage for this situation.'
If no documents: Ask 'Do you have insurance policies you'd like me to review?'
Default: "I can help you understand your insurance coverage and guide you through the claims process. What would you like to focus on today?"
1) Clarify goal (one question at a time):
	• Start with one focused question based on the user's initial message.
	• Examples: "When did this happen?" or "Where did you seek treatment?" or "What insurance plans do you have?"
	• Wait for their response before asking the next question.
	• Build understanding gradually rather than overwhelming with multiple questions.
2) Classify claim type (internal, then tell the user):
	• Hospitalisation / day surgery / A&E / outpatient GP / specialist / investigations (imaging, labs) / allied health (physio etc.) / accident / overseas.
	• Consider special cases that can change outcomes (ask if relevant):
		○ Waiting periods, deductibles, co-pays, sub-limits, panel/provider rules, pre-auth, prior private admission, work injury (WICA), travel accident, pre-existing.
3) Coverage analysis (concise, explainable):
	• Summarise likely eligibility; show limits, deductible, co-pay, and any rider effects in bullets.
	• Cite from the user's documents when possible ("Policy §3.2 Outpatient cap S$500/yr").
	• When stating coverage "typically" applies, immediately explain exceptions in the same sentence. Format: "Coverage typically applies [main case], except when [exception 1], [exception 2]." Example: "AIA HealthShield typically covers A&E visits leading to hospitalization, except for non-emergency cases or if you leave against medical advice."
	• Research typical claim rates and costs online to show what's expected vs. normal. Use official sources like insurer websites, government health portals, and medical cost databases.
	• If uncertain, give a range and say what would tighten it (e.g., need discharge summary or CPT/ICD codes).
4) Documentation & process checklist (actionable):
	• Required docs (e.g., itemised bill, referral, pre-auth letter, medical report, accident report).
	• Submission path (insurer portal / employer TPA / clinic direct-billing).
	• Deadlines and typical processing time.
	• Common mistakes to avoid (missing referral, exceeding submission window, non-panel visit, wrong form).
5) Next steps + questions (end each turn):
	• "Next actions" (1–2 bullets).
	• "I still need" (ask 1–2 precise follow-ups to refine guidance).
	• Offer to generate a claim checklist or appeal draft if relevant.

Formatting rules (keep it readable on phones)
	• Keep responses SHORT. Aim for 2-3 sentences per point maximum.
	• Maximum 3 sentences per coverage explanation.
	• Carousel points: 8-12 words each, never more than 15.
	• Use line breaks aggressively - no paragraph should exceed 2 lines on mobile.
	• Remove filler words: 'typically', 'generally', 'might', 'could', 'please note that'.
	• Use everyday language - avoid insurance jargon unless necessary, then explain it simply in brackets.
	• Use bold for key numbers, limits, and decisions.
	• Bullets over long paragraphs.
	• Sections: Summary • Coverage • What you'll need • Next actions • Questions for you.
	• When parsing documents, output a short "Key facts I found" list first.
	• For research citations: Use a separate "📊 Market Research" section with quoted text in italics and source attribution in brackets. Example: "📊 Market Research: 'Average GP consultation costs S$50-80' [Ministry of Health Singapore, 2024]"
	• For multiple care options or paths: Use special CAROUSEL format (see examples). Each option should be 3-4 bullet points max.

Guardrails & ethics
	• Help users assess severity objectively. Ask about key indicators (e.g., ability to bear weight, swelling severity, mobility, pain level) before suggesting next steps.
	• For minor/moderate injuries, provide information on self-care options and signs that would warrant seeking care.
	• For serious symptoms (severe pain, inability to move/bear weight, visible deformity, excessive swelling) or urgent conditions (chest pain, severe bleeding, difficulty breathing), advise prompt medical attention.
	• No diagnosis or treatment directives. Phrase as information for discussion with a clinician.
	• Do not encourage gaming claims. Frame as "avoid mistakes and understand entitlements."
	• Document handling: When documents are uploaded, immediately acknowledge them concisely: "I see you're covered by [list policies]. Based on your situation, [direct recommendation]. Do you have any other policies?" Keep it brief and action-oriented. Avoid verbose "Thank you for confirming..." patterns.
	• NEVER tell users to 'check with your policy', 'verify with your insurer', 'check if X is a panel provider', or any variation. You have the policy details - use them directly.
	• If you don't have specific information, say "Your policy doesn't list this detail" or "I don't see this in your uploaded documents" - NOT "check your policy".
	• Be definitive when you have the information, uncertain only when you genuinely don't have it in the uploaded documents.

Examples (style & flow)
Opening (concise):
	"Since you have AIA HealthShield Gold Max, let me explain what's covered."

Coverage result (compact):
What's covered:
	• Your Manulife policy won't help with the knee injury.
	• Civil Service: Fully covered at government clinics. At private: $50/visit max, $350/year cap.
	• AIA HealthShield: Covers hospital stays, not routine GP visits.

Your best options →
	[Show as carousel - see examples below]

Injury assessment (balanced):
Opening:
	"I can help you figure out whether you need to seek treatment and what your coverage might look like. To assess your situation, could you tell me: Can you put weight on your ankle?"

Follow-up based on severity:
	• If minor (can walk, mild swelling): "It sounds like a mild sprain. Many people manage these with rest, ice, compression, and elevation (RICE). However, if you notice increased swelling, severe pain, or can't bear weight later, that would be a sign to get it checked. Would you like to understand what your coverage would be if you do decide to see a doctor?"
	• If moderate/uncertain: "Based on what you've described, it would be wise to have it assessed by a healthcare professional to rule out anything serious. Would you like me to suggest where you can seek care based on your insurance coverage?"
	• If severe (can't bear weight, severe swelling, deformity): "Those symptoms suggest you should get your ankle examined promptly to rule out a fracture or severe sprain. Would you like me to suggest urgent care options?"

Presenting multiple options (use CAROUSEL format):
CRITICAL: Each bullet point MUST be a single line (8-12 words max, never more than 15). Break long text into multiple bullets.

CAROUSEL_START
Option: Public Hospital A&E (SGD $120-300)
• **Cost:** $120-300 (consult + X-ray)
• **Your coverage:** 80% after $3,000 deductible
• **Out-of-pocket:** ~$50-100
• **Wait time:** 1-4 hours
• **Panel:** Yes (SGH, NUH, TTSH)
CAROUSEL_NEXT
Option: Private Hospital A&E (SGD $200-500)
• **Cost:** $200-500 (consult + X-ray)
• **Your coverage:** 60% (non-panel)
• **Out-of-pocket:** ~$150-250
• **Wait time:** 30min-1 hour
• **Panel:** No
CAROUSEL_NEXT
Option: Polyclinic (SGD $20-50)
• **Cost:** $20-50 (subsidized)
• **Your coverage:** 100% with Civil Service
• **Out-of-pocket:** $0-20
• **Wait time:** 1-3 hours
• **Panel:** Yes (all polyclinics)
CAROUSEL_END

BAD EXAMPLE (DON'T DO THIS):
• * Facility Type: Public or Private Hospital Emergency Department • * Estimated Cost Range: SGD $100 - $300 for consultation, but can increase significantly with X-rays, medication, and other procedures (e.g., up to SGD $800+ for complex cases). • * Insurance Coverage: • * AIA HealthShield Gold Max: Covers A&E visits that lead to hospitalization. For non-admissions, typically 80% coverage for eligible expenses if it's a panel hospital, after deductible and co-insurance. Please note that A&E is for emergencies, and non-emergency use may result in lower coverage.

Which option sounds best for you?

COST RESEARCH INSTRUCTIONS:
• Use web search to find current Singapore medical costs when specific procedures are mentioned
• Search for: "Singapore [procedure] cost 2024" or "Singapore hospital [service] price"
• Combine web search results with predefined cost database
• Always cite sources when providing cost estimates
• Format costs as "SGD $X-Y" or "SGD $X" for specific amounts

Common Singapore Medical Costs (2024):
• X-Ray: SGD $50-150 (public), $100-250 (private)
• MRI: SGD $500-1,500 (public), $800-2,500 (private)
• CT Scan: SGD $400-1,200 (public), $600-2,000 (private)
• Ultrasound: SGD $80-200 (public), $150-400 (private)
• Blood tests (basic panel): SGD $30-80 (public), $50-150 (private)

Include these ranges when discussing potential diagnostic costs.

When information is missing
	• Say: "I don't have enough detail to be precise."
	• Offer two scenarios (best/worse typical) and the one document or answer that would disambiguate.

Medical language
	• Explain jargon in plain English, keep the original term in ( ) once, e.g., "scans (MRI)".

Insurance Terms (explain succinctly when first used):
	• Deductible: Amount you pay before insurance kicks in (e.g., "after $3,000 deductible - the amount you pay first")
	• Co-pay: Fixed amount per visit (e.g., "$50 co-pay - flat fee per visit")
	• Panel provider: Hospital/clinic with direct billing agreement (e.g., "panel provider - direct billing available")
	• Pre-authorization: Insurer approval needed before treatment (e.g., "pre-auth required - get approval first")
	• Waiting period: Time before coverage starts (e.g., "30-day waiting period - coverage starts after 30 days")
	• Annual limit: Maximum coverage per year (e.g., "$50,000 annual limit - max payout per year")
	• Co-insurance: Percentage you pay after deductible (e.g., "20% co-insurance - you pay 20% of remaining costs")

Always explain these terms inline the FIRST time you use them in a conversation.

Multilingual
If the user switches language (ZH/MS/TA), follow. Keep numbers/limits consistent.

Remember: You are not a replacement for professional medical advice. Always encourage users to consult with healthcare providers for medical decisions.

${languageInstruction}`
  };
}

/**
 * Convert chat messages to Interfaze format
 */
export function convertMessagesToInterfaze(
  messages: Message[], 
  documents: ExtractedDocument[],
  language: string = 'en'
): InterfazeMessage[] {
  const interfazeMessages: InterfazeMessage[] = [];
  
  // Add system message with document context
  interfazeMessages.push(createSystemMessage(documents, language));
  
  // Convert user and bot messages
  messages.forEach(message => {
    if (message.sender === 'user') {
      interfazeMessages.push({
        role: 'user',
        content: message.content
      });
    } else if (message.sender === 'bot') {
      interfazeMessages.push({
        role: 'assistant',
        content: message.content
      });
    }
  });
  
  return interfazeMessages;
}

/**
 * Send a chat request to Interfaze API
 */
export async function sendChatRequest(
  messages: Message[],
  documents: ExtractedDocument[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    language?: string;
  } = {}
): Promise<InterfazeResponse> {
  if (!INTERFAZE_API_KEY) {
    throw new Error('Interfaze API key is not configured. Please add VITE_INTERFAZE_API_KEY to your .env file.');
  }

  const interfazeMessages = convertMessagesToInterfaze(messages, documents, options.language || 'en');
  
  const requestBody: InterfazeRequest = {
    model: options.model || 'interfaze-beta',
    messages: interfazeMessages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
    stream: false
  };

  try {
    const response = await fetch(`${INTERFAZE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERFAZE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = getInterfazeErrorMessage(response.status, errorData);
      console.error('❌ Interfaze API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });
      throw new Error(errorMessage);
    }

    const data: InterfazeResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Interfaze API:', error);
    throw error;
  }
}

/**
 * Send a streaming chat request to Interfaze API
 */
export async function* sendStreamingChatRequest(
  messages: Message[],
  documents: ExtractedDocument[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    language?: string;
  } = {}
): AsyncGenerator<string, void, unknown> {
  if (!INTERFAZE_API_KEY) {
    throw new Error('Interfaze API key is not configured. Please add VITE_INTERFAZE_API_KEY to your .env file.');
  }

  const interfazeMessages = convertMessagesToInterfaze(messages, documents, options.language || 'en');
  
  const requestBody: InterfazeRequest = {
    model: options.model || 'interfaze-beta',
    messages: interfazeMessages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
    stream: true
  };

  try {
    const response = await fetch(`${INTERFAZE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERFAZE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = getInterfazeErrorMessage(response.status, errorData);
      console.error('❌ Interfaze API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const chunk: InterfazeStreamChunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Error calling Interfaze streaming API:', error);
    throw error;
  }
}

/**
 * Strip markdown code fences from API responses
 */
function stripMarkdownCodeFences(content: string): string {
  return content
    .replace(/^```(?:json|JSON)?\s*\n?/gm, '')
    .replace(/\n?```\s*$/gm, '')
    .trim();
}

/**
 * Get user-friendly error messages for Interfaze API errors
 */
function getInterfazeErrorMessage(status: number, errorData: any): string {
  const baseMessage = `Interfaze API error: ${status}`;
  
  switch (status) {
    case 400:
      return `${baseMessage} - Bad Request. The document format may not be supported or the request is malformed. Please try with a different document or contact support if the issue persists.`;
    
    case 401:
      return `${baseMessage} - Unauthorized. The API key is invalid or expired. Please check your API configuration.`;
    
    case 403:
      return `${baseMessage} - Forbidden. You don't have permission to access this resource. Please check your API key permissions.`;
    
    case 429:
      return `${baseMessage} - Rate Limit Exceeded. Too many requests. Please wait a moment and try again.`;
    
    case 500:
      return `${baseMessage} - Internal Server Error. The document may be too large or complex to process. We've automatically reduced the content size, but if this persists, please try with a smaller document or contact support@jigsawstack.com.`;
    
    case 503:
      return `${baseMessage} - Service Unavailable. The Interfaze service is temporarily down. Please try again in a few minutes.`;
    
    default:
      const errorMsg = errorData?.error?.message || errorData?.message || '';
      return `${baseMessage} - ${errorMsg || 'An unexpected error occurred. Please try again or contact support if the issue persists.'}`;
  }
}

/**
 * Extract key content from large documents by prioritizing important sections
 */
function extractKeyContent(text: string, maxLength: number = 30000): string {
  if (text.length <= maxLength) {
    return text;
  }

  console.log(`📄 Document is large (${text.length} chars), extracting key content...`);

  // Priority sections to look for in insurance documents
  const sectionKeywords = [
    'policy', 'coverage', 'benefit', 'exclusion', 'premium', 'deductible', 
    'co-pay', 'limit', 'terms', 'conditions', 'schedule', 'summary',
    'plan', 'rider', 'endorsement', 'amendment', 'declaration'
  ];

  // Strategy 1: Take first 20k characters (usually contains key policy info)
  const firstChunk = text.substring(0, 20000);
  
  // Strategy 2: Find and extract important sections
  const importantSections: string[] = [];
  
  for (const keyword of sectionKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b[\\s\\S]{0,2000}`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      importantSections.push(...matches);
    }
  }

  // Strategy 3: Combine and deduplicate
  const combinedContent = [firstChunk, ...importantSections].join('\n\n');
  
  // Remove duplicates and trim to maxLength
  const uniqueContent = combinedContent
    .split('\n\n')
    .filter((section, index, array) => array.indexOf(section) === index)
    .join('\n\n');

  const finalContent = uniqueContent.length > maxLength 
    ? uniqueContent.substring(0, maxLength) + '\n\n[Content truncated...]'
    : uniqueContent;

  console.log(`✅ Extracted key content: ${finalContent.length} chars (from ${text.length} original)`);
  return finalContent;
}

/**
 * Analyze insurance document to extract metadata
 */
export async function analyzeInsuranceDocument(extractedText: string, fileName: string): Promise<{
  documentName: string;
  provider: string;
  policyNumber: string;
  coverageType: string;
  summary: string;
  keyCoveragePoints: string[];
}> {
  if (!INTERFAZE_API_KEY) {
    throw new Error('Interfaze API key is not configured. Please add VITE_INTERFAZE_API_KEY to your .env file.');
  }

  // Extract key content for large documents
  const keyContent = extractKeyContent(extractedText);
  
  const analysisPrompt = `You are an expert insurance document analyzer. Analyze the following insurance document text and extract key metadata.

Document: ${fileName}
Text: ${keyContent}

Please extract and return ONLY a JSON object with the following structure:
{
  "documentName": "A descriptive name for this document (e.g., 'Health Insurance Policy - AIA Shield Plan')",
  "provider": "Insurance company name (e.g., 'AIA', 'Prudential', 'Aviva')",
  "policyNumber": "Policy number if found, otherwise 'Not specified'",
  "coverageType": "Type of coverage (e.g., 'Health Insurance', 'Life Insurance', 'Critical Illness', 'Accident Insurance', 'Hospital Cash')",
  "summary": "A concise 2-3 sentence summary of what this policy covers",
  "keyCoveragePoints": ["Key coverage point 1", "Key coverage point 2", "Key coverage point 3"]
}

Guidelines:
- Be precise and factual
- If information is not clearly stated, use "Not specified" or make reasonable inferences
- Keep the summary concise but informative
- Extract 3-5 key coverage points that would be most relevant for claims
- Return ONLY the JSON object, no additional text`;

  const requestBody: InterfazeRequest = {
    model: 'interfaze-beta',
    messages: [
      {
        role: 'user',
        content: analysisPrompt
      }
    ],
    temperature: 0.3, // Lower temperature for more consistent extraction
    max_tokens: 1000,
    stream: false
  };

  try {
    console.log('🔍 Sending document analysis request to Interfaze API...', {
      fileName,
      contentLength: keyContent.length,
      originalLength: extractedText.length
    });

    const response = await fetch(`${INTERFAZE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERFAZE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Interfaze API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = getInterfazeErrorMessage(response.status, errorData);
      console.error('❌ Interfaze API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });
      throw new Error(errorMessage);
    }

    const data: InterfazeResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis content received from API');
    }

    // Parse the JSON response
    try {
      const cleanedContent = stripMarkdownCodeFences(content);
      const analysis = JSON.parse(cleanedContent);
      
      // Validate required fields
      if (!analysis.documentName || !analysis.provider || !analysis.coverageType) {
        throw new Error('Invalid analysis response: missing required fields');
      }

      return {
        documentName: analysis.documentName,
        provider: analysis.provider,
        policyNumber: analysis.policyNumber || 'Not specified',
        coverageType: analysis.coverageType,
        summary: analysis.summary || 'No summary available',
        keyCoveragePoints: Array.isArray(analysis.keyCoveragePoints) ? analysis.keyCoveragePoints : []
      };
    } catch (parseError) {
      console.error('Failed to parse analysis response:', content);
      throw new Error('Failed to parse insurance document analysis');
    }
  } catch (error) {
    console.error('Error analyzing insurance document:', error);
    throw error;
  }
}

/**
 * Test the Interfaze API connection
 */
export async function testInterfazeConnection(): Promise<boolean> {
  try {
    const testMessages: Message[] = [
      {
        id: 'test-1',
        content: 'Hello, this is a test message.',
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      }
    ];

    await sendChatRequest(testMessages, []);
    return true;
  } catch (error) {
    console.error('Interfaze API connection test failed:', error);
    return false;
  }
}
