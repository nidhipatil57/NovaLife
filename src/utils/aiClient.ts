/**
 * Calls the Google Gemini API with automatic retries and exponential backoff.
 * If the primary model (gemini-2.5-flash) is rate-limited (429) or unavailable (503),
 * it automatically falls back to gemma-4-31b-it which has separate quota limits.
 */
export async function callGeminiWithRetry(
  apiKey: string,
  body: any,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<any> {
  try {
    // Attempt with primary model
    return await executeRequestWithRetry("gemini-2.5-flash", apiKey, body, maxRetries, initialDelayMs);
  } catch (err: any) {
    const isRateLimitOrUnavailable = err.message && (
      err.message.includes('429') || 
      err.message.includes('503') ||
      err.message.includes('quota') ||
      err.message.includes('limit')
    );

    if (isRateLimitOrUnavailable) {
      console.warn("Gemini 2.5 Flash rate limited or unavailable. Falling back to gemma-4-31b-it...");
      try {
        return await executeRequestWithRetry("gemma-4-31b-it", apiKey, body, maxRetries, initialDelayMs);
      } catch (fallbackErr) {
        console.error("Fallback to gemma-4-31b-it failed:", fallbackErr);
        throw err; // throw original error if fallback also fails
      }
    }
    throw err;
  }
}

async function executeRequestWithRetry(
  modelName: string,
  apiKey: string,
  body: any,
  maxRetries: number,
  initialDelayMs: number
): Promise<any> {
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        return await response.json();
      }

      // Retry on transient status codes
      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        console.warn(`Gemini API (${modelName}) temporary error ${response.status}. Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next attempt
          continue;
        }
      }

      // Throw immediately for bad requests or auth errors (400, 401, 403, 404)
      const errorText = await response.text();
      let message = response.statusText;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.error?.message || message;
      } catch (e) {}
      
      throw new Error(`API returned status ${response.status}: ${message}`);
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`Network/API error in Gemini call (${modelName}): ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export async function streamGeminiContent(
  apiKey: string,
  body: any,
  onChunk: (text: string) => void
): Promise<string> {
  try {
    return await executeStreamRequest("gemini-2.5-flash", apiKey, body, onChunk);
  } catch (err: any) {
    const isRateLimitOrUnavailable = err.message && (
      err.message.includes('429') || 
      err.message.includes('503') ||
      err.message.includes('quota') ||
      err.message.includes('limit')
    );

    if (isRateLimitOrUnavailable) {
      console.warn("Gemini 2.5 Flash rate limited or unavailable. Falling back to gemma-4-31b-it for streaming...");
      try {
        return await executeStreamRequest("gemma-4-31b-it", apiKey, body, onChunk);
      } catch (fallbackErr) {
        console.error("Streaming fallback to gemma-4-31b-it failed:", fallbackErr);
        throw err;
      }
    }
    throw err;
  }
}

async function executeStreamRequest(
  modelName: string,
  apiKey: string,
  body: any,
  onChunk: (text: string) => void
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = response.statusText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.error?.message || message;
    } catch (e) {}
    throw new Error(`API returned status ${response.status}: ${message}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  if (!reader) {
    throw new Error('Response body reader not available.');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      let braceCount = 0;
      let startIdx = -1;
      let i = 0;
      while (i < buffer.length) {
        const char = buffer[i];
        if (char === '{') {
          if (braceCount === 0) {
            startIdx = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && startIdx !== -1) {
            const jsonStr = buffer.substring(startIdx, i + 1);
            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                fullText += textChunk;
                onChunk(textChunk);
              }
            } catch (e) {
              // Ignore incomplete JSON
            }
            buffer = buffer.substring(i + 1);
            i = -1;
            startIdx = -1;
          }
        }
        i++;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}
