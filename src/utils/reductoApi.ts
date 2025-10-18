// src/services/reductoApi.ts
import Reducto from "reductoai";

// Optional: if you use this in a browser-only Vite app and see fetch/FormData issues,
// uncomment one of these shims:
// import "reductoai/shims/web";   // browser
// import "reductoai/shims/node";  // node

export interface ReductoApiResponse {
  success: boolean;
  data?: { text: string; confidence?: number };
  error?: string;
}

export class ReductoApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ReductoApiError";
    this.status = status;
  }
}

type SupportedFileType =
  | "application/pdf"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain"
  | "image/jpeg"
  | "image/jpg"
  | "image/png";

export interface ReductoApiServiceOptions {
  /**
   * Force mock mode (useful for demos, offline, or quota issues).
   * Defaults to true in "development" if VITE_REDUCTO_API_KEY is missing.
   */
  mock?: boolean;
  /** Max file size in MB (default 10MB). */
  maxSizeMB?: number;
  /**
   * If you must avoid CORS from the browser, set this to your backend proxy path
   * (e.g., "/api/reducto/parse"). When present, the service will POST FormData to the proxy
   * instead of calling the SDK directly in the browser.
   */
  proxyParsePath?: string;
}

export class ReductoApiService {
  private apiKey?: string;
  private client?: Reducto;
  private readonly maxSizeBytes: number;
  private mock: boolean;
  private readonly proxyParsePath?: string;

  private static readonly SUPPORTED_TYPES: SupportedFileType[] = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  constructor(opts: ReductoApiServiceOptions = {}) {
    this.apiKey = import.meta.env.VITE_REDUCTO_API_KEY;
    this.mock =
      typeof opts.mock === "boolean"
        ? opts.mock
        : (!this.apiKey && import.meta.env.MODE === "development"); // auto-mock in dev if no key
    this.maxSizeBytes = (opts.maxSizeMB ?? 10) * 1024 * 1024;
    this.proxyParsePath = opts.proxyParsePath || import.meta.env.VITE_PROXY_PARSE || undefined;

    console.log('🔧 ReductoApiService initialized:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      mock: this.mock,
      proxyPath: this.proxyParsePath,
      mode: import.meta.env.MODE
    });

    if (!this.mock) {
      if (!this.apiKey) {
        console.warn('⚠️ Reducto API key not found. Set VITE_REDUCTO_API_KEY in your .env file. Using mock mode.');
        this.mock = true;
        return;
      }
      
      try {
        this.client = new Reducto({ apiKey: this.apiKey });
        console.log('✅ Reducto client initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Reducto client:', error);
        console.warn('⚠️ Falling back to mock mode');
        this.mock = true;
      }
    }
  }

  /** Public helper: list supported types (nice for UI) */
  getSupportedFileTypes(): string[] {
    return ["PDF", "DOC", "DOCX", "TXT", "JPG", "JPEG", "PNG"];
  }

  /** Public helper: max file size in MB */
  getMaxFileSizeMB(): number {
    return Math.round(this.maxSizeBytes / (1024 * 1024));
  }

  /** Quick health check (SDK init or proxy ping) */
  async testConnection(): Promise<boolean> {
    if (this.mock) {
      console.log('🔧 Mock mode - connection test always passes');
      return true;
    }
    
    try {
      console.log('🔍 Testing Reducto API connection...');
      
      if (this.proxyParsePath && this.proxyParsePath.trim() !== '') {
        // Test proxy endpoint
        const response = await fetch(this.proxyParsePath, {
          method: 'POST',
          body: new FormData(), // Empty form data for test
        });
        console.log('Proxy test response:', response.status, response.statusText);
        return response.status !== 404;
      } else {
        // Test direct SDK
        if (!this.client) {
          console.error('❌ No Reducto client available');
          return false;
        }
        
        // Try a simple operation to test the connection
        const tiny = new File([new Blob(["test"])], "test.txt", { type: "text/plain" });
        await this.parseDocument(tiny);
        console.log('✅ Direct SDK connection test successful');
        return true;
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });
      return false;
    }
  }

  /** High-level: extract plain text only (fastest happy-path) */
  async extractTextFromFile(file: File): Promise<string> {
    console.log('🔍 Starting text extraction for file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      mock: this.mock,
      proxyPath: this.proxyParsePath
    });

    this.validateFile(file);

    // Mock path
    if (this.mock) {
      console.log('🔧 Using mock extraction');
      await delay(500 + Math.random() * 800);
      return this.generateMockExtractedText(file);
    }

    // Proxy path (avoids CORS in browser)
    if (this.proxyParsePath && this.proxyParsePath.trim() !== '') {
      console.log('🌐 Using proxy path:', this.proxyParsePath);
      const text = await this.parseViaProxy(file);
      if (!text) throw new ReductoApiError("Failed to extract text (proxy)");
      return text;
    }

    // Direct SDK path
    try {
      console.log('📤 Uploading file to Reducto...');
      const upload = await this.client!.upload({ file });
      console.log('✅ File uploaded successfully:', upload);

      console.log('🔄 Parsing document...');
      const parsed = await this.client!.parse.run({
        input: upload.file_id, // Use file_id as input
      });

      console.log('📄 Parse response received:', parsed);

      // Handle async job response
      if ('job_id' in parsed) {
        console.log('⏳ Document processing is async, polling for results...', {
          jobId: parsed.job_id
        });
        return await this.pollForJobCompletion(parsed.job_id);
      }

      // Try to extract text from immediate response
      const text = 
        (parsed as any).output_text ?? 
        (parsed as any).text ?? 
        (parsed as any).data?.text ?? 
        (parsed as any).result?.text;

      if (!text) {
        console.error('❌ No text found in response:', {
          response: parsed,
          availableKeys: Object.keys(parsed),
          hasOutputText: 'output_text' in parsed,
          hasText: 'text' in parsed,
          hasData: 'data' in parsed,
          hasResult: 'result' in parsed
        });
        throw new ReductoApiError("Failed to extract text from response");
      }
      
      console.log('✅ Text extraction successful, length:', text.length);
      return text;
    } catch (err: any) {
      console.error('❌ Text extraction failed:', err);
      throw this.wrapError(err);
    }
  }

  /**
   * Full parse returning raw Reducto response (text + tables + figures if enabled).
   * Use this if you need structured outputs for RAG or UI highlights.
   */
  async parseDocument(
    file: File,
    opts?: {
      includeTables?: boolean;
      includeFigures?: boolean;
      htmlTables?: boolean;
      pages?: { start?: number; end?: number };
    }
  ): Promise<any> {
    this.validateFile(file);

    if (this.mock) {
      await delay(500 + Math.random() * 800);
      return {
        output_text: this.generateMockExtractedText(file),
        tables: opts?.includeTables ? [{ name: "MockTable", rows: 3, cols: 3 }] : [],
        figures: opts?.includeFigures ? [{ caption: "Mock figure" }] : [],
      };
    }

    if (this.proxyParsePath) {
      // Proxy can decide how much to return; here we just return text
      const text = await this.parseViaProxy(file);
      return { output_text: text };
    }

    try {
      const upload = await this.client!.upload({ file });
      const parsed = await this.client!.parse.run({
        input: upload.file_id, // Use file_id as input
      });

      return parsed;
    } catch (err: any) {
      throw this.wrapError(err);
    }
  }

  // ---------------------------
  // Internals
  // ---------------------------

  private validateFile(file: File) {
    const typeOk =
      ReductoApiService.SUPPORTED_TYPES.includes(file.type as SupportedFileType) ||
      /\.pdf$|\.doc$|\.docx$|\.txt$|\.jpg$|\.jpeg$|\.png$/i.test(file.name);

    if (!typeOk) {
      throw new ReductoApiError(
        `Unsupported file type: ${file.type || file.name}. Supported: ${this.getSupportedFileTypes().join(", ")}`
      );
    }
    if (file.size > this.maxSizeBytes) {
      const mb = (file.size / 1024 / 1024).toFixed(2);
      throw new ReductoApiError(
        `File too large: ${mb}MB. Maximum size is ${this.getMaxFileSizeMB()}MB.`
      );
    }
  }

  private async parseViaProxy(file: File): Promise<string | undefined> {
    try {
      console.log('🌐 Sending file to proxy:', {
        proxyPath: this.proxyParsePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const form = new FormData();
      form.append("file", file);
      
      const res = await fetch(this.proxyParsePath!, {
        method: "POST",
        body: form,
      });

      console.log('📡 Proxy response:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });

      if (!res.ok) {
        const msg = await safeText(res);
        console.error('❌ Proxy error response:', msg);
        
        // Handle 422 specifically
        if (res.status === 422) {
          throw new ReductoApiError(
            `Invalid file format or request. The proxy server couldn't process your file. Details: ${msg || res.statusText}`,
            res.status
          );
        }
        
        throw new ReductoApiError(
          `Proxy error ${res.status}: ${msg || res.statusText}`,
          res.status
        );
      }

      const json = (await res.json()) as ReductoApiResponse | any;
      console.log('📄 Proxy response data:', json);
      
      // support either your own proxy shape or the earlier interface
      const text = json?.data?.text ?? json?.output_text ?? json?.text;
      
      if (!text) {
        console.error('❌ No text in proxy response:', json);
        throw new ReductoApiError("No text extracted from proxy response");
      }
      
      return text;
    } catch (err: any) {
      console.error('❌ Proxy parsing failed:', err);
      throw this.wrapError(err);
    }
  }

  private async pollForJobCompletion(jobId: string, maxAttempts: number = 30): Promise<string> {
    console.log(`🔄 Polling job ${jobId} for completion...`);
    
    // Safety check - if client is not available, throw an error
    if (!this.client) {
      throw new ReductoApiError("Reducto client not available for job polling");
    }
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wait before polling (exponential backoff)
        await delay(Math.min(1000 * attempt, 5000));
        
        console.log(`📡 Polling attempt ${attempt}/${maxAttempts} for job ${jobId}`);
        
        // Poll the job status - get the full job result in one call
        const jobResult = await this.client.job.get(jobId);
        
        console.log('📊 Job result:', jobResult);
        
        if (jobResult.status === 'Completed') {
          // Extract text from the completed job result
          const result = jobResult.result;
          console.log('🔍 Debugging job result structure:', {
            result,
            resultKeys: result ? Object.keys(result) : 'no result',
            resultType: typeof result,
            resultStringified: JSON.stringify(result, null, 2)
          });
          
          if (result) {
            // The actual parse result is nested in result.result
            const parseResult = (result as any).result;
            console.log('🔍 Parse result structure:', {
              parseResult,
              parseResultKeys: parseResult ? Object.keys(parseResult) : 'no parse result',
              parseResultType: typeof parseResult
            });
            
            if (parseResult) {
              // Check if it's a FullResult with chunks
              if ((parseResult as any).type === 'full' && (parseResult as any).chunks) {
                const chunks = (parseResult as any).chunks;
                if (Array.isArray(chunks) && chunks.length > 0) {
                  // Extract text from all chunks
                  const text = chunks.map((chunk: any) => chunk.content).join('\n\n');
                  if (text && typeof text === 'string') {
                    console.log('✅ Job completed successfully, text length:', text.length);
                    return text;
                  }
                }
              }
              
              // Check if it's a URL result (large response)
              if ((parseResult as any).type === 'url' && (parseResult as any).url) {
                console.log('📄 Large response detected, fetching from URL:', (parseResult as any).url);
                try {
                  const response = await fetch((parseResult as any).url);
                  const urlResult = await response.json();
                  console.log('📄 URL result:', urlResult);
                  
                  // Try to extract text from URL result
                  if (urlResult.chunks && Array.isArray(urlResult.chunks)) {
                    const text = urlResult.chunks.map((chunk: any) => chunk.content).join('\n\n');
                    if (text && typeof text === 'string') {
                      console.log('✅ Job completed successfully from URL, text length:', text.length);
                      return text;
                    }
                  }
                } catch (urlError) {
                  console.error('❌ Failed to fetch result from URL:', urlError);
                }
              }
              
              // Fallback: Try other possible text locations in parseResult
              const text = 
                (parseResult as any).output_text ?? 
                (parseResult as any).text ?? 
                (parseResult as any).content ?? 
                (parseResult as any).data?.text ?? 
                (parseResult as any).data?.content;
              
              if (text && typeof text === 'string') {
                console.log('✅ Job completed successfully, text length:', text.length);
                return text;
              }
            }
            
            // Fallback: Try other possible text locations in the main result
            const text = 
              (result as any).output_text ?? 
              (result as any).text ?? 
              (result as any).content ?? 
              (result as any).data?.text ?? 
              (result as any).data?.content;
            
            if (text && typeof text === 'string') {
              console.log('✅ Job completed successfully, text length:', text.length);
              return text;
            }
          }
          console.error('❌ Job completed but no text found in result:', jobResult);
          throw new ReductoApiError("Job completed but no text found in result");
        } else if (jobResult.status === 'Failed') {
          const errorMsg = jobResult.reason || 'Unknown error';
          console.error('❌ Job failed:', errorMsg);
          throw new ReductoApiError(`Job failed: ${errorMsg}`);
        }
        
        // Job is still processing, continue polling
        console.log(`⏳ Job still processing (status: ${jobResult.status}), waiting...`);
        
      } catch (error: any) {
        console.error(`⚠️ Polling attempt ${attempt} failed:`, error);
        
        if (attempt === maxAttempts) {
          throw new ReductoApiError(`Job polling failed after ${maxAttempts} attempts: ${error.message}`);
        }
        
        // For non-final attempts, continue polling
        console.log(`🔄 Retrying in ${Math.min(1000 * (attempt + 1), 5000)}ms...`);
      }
    }
    
    throw new ReductoApiError(`Job did not complete within ${maxAttempts} attempts`);
  }

  private wrapError(err: any): ReductoApiError {
    if (err instanceof ReductoApiError) return err;
    
    console.error('🔍 Wrapping error:', {
      message: err?.message,
      status: err?.status || err?.response?.status,
      response: err?.response?.data,
      stack: err?.stack
    });
    
    let message = err?.message || "Unexpected Reducto error";
    const status = err?.status || err?.response?.status;
    
    // Handle specific error cases
    if (status === 422) {
      message = "Invalid request format or file type. Please check your file and try again.";
      if (err?.response?.data?.error) {
        message += ` Details: ${err.response.data.error}`;
      }
    } else if (status === 401) {
      message = "Invalid API key. Please check your Reducto API key.";
    } else if (status === 403) {
      message = "Access forbidden. Please check your API key permissions.";
    } else if (status === 429) {
      message = "Rate limit exceeded. Please try again later.";
    } else if (status === 500) {
      message = "Reducto API server error. Please try again later.";
    } else if (err?.response?.data?.error) {
      message = err.response.data.error;
    } else if (err?.response?.statusText) {
      message = err.response.statusText;
    }
    
    return new ReductoApiError(message, status);
  }

  private generateMockExtractedText(file: File): string {
    const name = file.name.toLowerCase();
    if (name.includes("insurance") || name.includes("policy")) {
      return `INSURANCE POLICY (MOCK)\n\nPolicy Number: POL-${randId()}\nCoverage: Outpatient up to $5,000/yr; Drugs up to $2,000/yr\nExclusions: Pre-existing (12m), Cosmetic, Experimental.\nProvider: Example Insurer\nEffective: 2024-01-01 → 2024-12-31\n\n(This is mock text for UI testing.)`;
    }
    if (name.includes("medical") || name.includes("health") || name.includes("record")) {
      return `MEDICAL NOTE (MOCK)\n\nPatient: John Doe\nVisit: ${new Date().toLocaleDateString()}\nComplaint: Chest discomfort on exertion.\nMeds: Lisinopril 10mg; Atorvastatin 20mg.\nPlan: Rest 48h; follow-up if persistent.\n\n(This is mock text for UI testing.)`;
    }
    return `DOCUMENT (MOCK)\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type || "unknown"}\n\nThis is mock extracted content for demo purposes.`;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function randId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// Singleton (optional)
export const reductoApi = new ReductoApiService({
  // mock: true,                 // force mock if you want
  // proxyParsePath: "/api/reducto/parse", // use if you need a backend proxy
});
