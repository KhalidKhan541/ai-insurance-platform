import { z } from 'zod';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export const AIProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'azure',
  'mistral',
  'local',
]);

export type AIProvider = z.infer<typeof AIProviderSchema>;

export const AIModelSchema = z.enum([
  'gpt-4o',
  'gpt-4o-mini',
  'claude-sonnet-4-20250514',
  'claude-3-5-haiku-20241022',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'mistral-large',
  'mistral-medium',
  'local-llama-3',
]);

export type AIModel = z.infer<typeof AIModelSchema>;

export interface AIRequest {
  id: string;
  provider: AIProvider;
  model: AIModel;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  responseFormat?: 'text' | 'json';
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIResponse {
  id: string;
  provider: AIProvider;
  model: AIModel;
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  usage: AIUsage;
  latencyMs: number;
  cached: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface AIFunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  required?: string[];
}

export interface AIFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIServiceConfig {
  defaultProvider: AIProvider;
  defaultModel: AIModel;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
  rateLimitRequestsPerMinute: number;
  fallbackProviders: AIProvider[];
  costThresholdUsd: number;
  logRequests: boolean;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  orgId?: string;
  projectId?: string;
  maxConcurrent: number;
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export interface CacheEntry {
  key: string;
  response: AIResponse;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

export interface RateLimitState {
  provider: AIProvider;
  requests: number;
  tokens: number;
  windowStart: Date;
  blocked: boolean;
  blockedUntil?: Date;
}

const MODEL_COSTS: Record<AIModel, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  'claude-sonnet-4-20250514': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-3-5-haiku-20241022': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'gemini-1.5-pro': { input: 1.25 / 1_000_000, output: 5 / 1_000_000 },
  'gemini-1.5-flash': { input: 0.075 / 1_000_000, output: 0.3 / 1_000_000 },
  'mistral-large': { input: 2 / 1_000_000, output: 6 / 1_000_000 },
  'mistral-medium': { input: 0.27 / 1_000_000, output: 0.81 / 1_000_000 },
  'local-llama-3': { input: 0, output: 0 },
};

const PROVIDER_MODELS: Record<AIProvider, AIModel[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  azure: ['gpt-4o', 'gpt-4o-mini'],
  mistral: ['mistral-large', 'mistral-medium'],
  local: ['local-llama-3'],
};

class AICache {
  private store = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTtlMs: number;

  constructor(maxSize: number, defaultTtlMs: number) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  generateKey(request: AIRequest): string {
    const content = request.messages
      .map((m) => `${m.role}:${m.content}`)
      .join('|');
    const params = JSON.stringify({
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      responseFormat: request.responseFormat,
    });
    return Buffer.from(`${content}::${params}`).toString('base64url');
  }

  get(key: string): CacheEntry | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (new Date() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.hitCount++;
    return entry;
  }

  set(key: string, response: AIResponse, ttlMs?: number): void {
    if (this.store.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    const ttl = ttlMs || this.defaultTtlMs;
    this.store.set(key, {
      key,
      response,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      hitCount: 0,
    });
  }

  private evictLeastUsed(): void {
    let minHits = Infinity;
    let minKey = '';
    for (const [key, entry] of this.store) {
      if (entry.hitCount < minHits) {
        minHits = entry.hitCount;
        minKey = key;
      }
    }
    if (minKey) this.store.delete(minKey);
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): { size: number; hitRate: number; totalHits: number } {
    let totalHits = 0;
    for (const entry of this.store.values()) {
      totalHits += entry.hitCount;
    }
    return {
      size: this.store.size,
      hitRate: this.store.size > 0 ? totalHits / this.store.size : 0,
      totalHits,
    };
  }
}

class RateLimiter {
  private limits = new Map<AIProvider, RateLimitState>();

  constructor(
    private requestsPerMinute: number,
    private tokensPerMinute: number
  ) {}

  canProceed(provider: AIProvider): boolean {
    const state = this.limits.get(provider);
    if (!state) return true;
    if (state.blocked && state.blockedUntil) {
      if (new Date() < state.blockedUntil) return false;
      state.blocked = false;
    }
    this.resetIfNeeded(state);
    return state.requests < this.requestsPerMinute;
  }

  recordRequest(provider: AIProvider, tokens: number): void {
    let state = this.limits.get(provider);
    if (!state) {
      state = {
        provider,
        requests: 0,
        tokens: 0,
        windowStart: new Date(),
        blocked: false,
      };
      this.limits.set(provider, state);
    }
    this.resetIfNeeded(state);
    state.requests++;
    state.tokens += tokens;
    if (
      state.requests >= this.requestsPerMinute ||
      state.tokens >= this.tokensPerMinute
    ) {
      state.blocked = true;
      state.blockedUntil = new Date(Date.now() + 60_000);
    }
  }

  private resetIfNeeded(state: RateLimitState): void {
    const now = new Date();
    if (now.getTime() - state.windowStart.getTime() >= 60_000) {
      state.requests = 0;
      state.tokens = 0;
      state.windowStart = now;
      state.blocked = false;
    }
  }

  getState(provider: AIProvider): RateLimitState | undefined {
    return this.limits.get(provider);
  }
}

class AIProviderClient {
  private config: AIServiceConfig;
  private providerConfigs: Map<AIProvider, ProviderConfig> = new Map();
  private cache: AICache;
  private rateLimiter: RateLimiter;
  private requestCount = 0;
  private totalCostUsd = 0;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      defaultProvider: 'openai',
      defaultModel: 'gpt-4o',
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 30_000,
      cacheEnabled: true,
      cacheTtlMs: 3_600_000,
      rateLimitRequestsPerMinute: 60,
      fallbackProviders: ['anthropic', 'google'],
      costThresholdUsd: 100,
      logRequests: true,
      ...config,
    };

    this.cache = new AICache(1000, this.config.cacheTtlMs);
    this.rateLimiter = new RateLimiter(
      this.config.rateLimitRequestsPerMinute,
      1_000_000
    );

    this.initializeProviderConfigs();
  }

  private initializeProviderConfigs(): void {
    const providers: Array<[AIProvider, Partial<ProviderConfig>]> = [
      [
        'openai',
        {
          apiKey: env.OPENAI_API_KEY,
          baseUrl: 'https://api.openai.com/v1',
          maxConcurrent: 10,
          requestsPerMinute: 60,
          tokensPerMinute: 150_000,
        },
      ],
      [
        'anthropic',
        {
          apiKey: env.ANTHROPIC_API_KEY,
          baseUrl: 'https://api.anthropic.com/v1',
          maxConcurrent: 10,
          requestsPerMinute: 60,
          tokensPerMinute: 100_000,
        },
      ],
      [
        'google',
        {
          apiKey: env.GOOGLE_AI_API_KEY,
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          maxConcurrent: 10,
          requestsPerMinute: 60,
          tokensPerMinute: 120_000,
        },
      ],
      [
        'azure',
        {
          apiKey: env.AZURE_OPENAI_API_KEY || '',
          baseUrl: env.AZURE_OPENAI_ENDPOINT || '',
          projectId: env.AZURE_OPENAI_PROJECT_ID,
          maxConcurrent: 10,
          requestsPerMinute: 60,
          tokensPerMinute: 100_000,
        },
      ],
      [
        'mistral',
        {
          apiKey: env.MISTRAL_API_KEY || '',
          baseUrl: 'https://api.mistral.ai/v1',
          maxConcurrent: 5,
          requestsPerMinute: 30,
          tokensPerMinute: 50_000,
        },
      ],
      [
        'local',
        {
          apiKey: '',
          baseUrl: env.LOCAL_LLM_ENDPOINT || 'http://localhost:11434',
          maxConcurrent: 3,
          requestsPerMinute: 20,
          tokensPerMinute: 30_000,
        },
      ],
    ];

    for (const [provider, cfg] of providers) {
      this.providerConfigs.set(provider, cfg as ProviderConfig);
    }
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this.requestCount++;

    if (this.config.logRequests) {
      logger.info('AI request initiated', {
        id: request.id,
        provider: request.provider,
        model: request.model,
        messageCount: request.messages.length,
      });
    }

    if (this.config.cacheEnabled && !request.stream) {
      const cacheKey = this.cache.generateKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.info('Cache hit', { id: request.id, cacheKey });
        return { ...cached.response, cached: true, id: request.id };
      }
    }

    if (!this.rateLimiter.canProceed(request.provider)) {
      const fallback = this.findAvailableFallback(request.provider);
      if (fallback) {
        logger.warn('Rate limited, using fallback', {
          original: request.provider,
          fallback,
        });
        request.provider = fallback;
      } else {
        throw new AIProviderError(
          'RATE_LIMITED',
          `Rate limit exceeded for ${request.provider}`,
          request.provider
        );
      }
    }

    let lastError: Error | null = null;
    const providersToTry = [request.provider, ...this.config.fallbackProviders];

    for (const provider of providersToTry) {
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          const response = await this.executeRequest({
            ...request,
            provider,
          });
          const latencyMs = Date.now() - startTime;

          this.rateLimiter.recordRequest(
            provider,
            response.usage.totalTokens
          );
          this.totalCostUsd += response.usage.estimatedCostUsd;

          if (this.totalCostUsd > this.config.costThresholdUsd) {
            logger.warn('Cost threshold exceeded', {
              totalCost: this.totalCostUsd,
              threshold: this.config.costThresholdUsd,
            });
          }

          const finalResponse: AIResponse = {
            ...response,
            latencyMs,
          };

          if (this.config.cacheEnabled && !request.stream) {
            const cacheKey = this.cache.generateKey(request);
            this.cache.set(cacheKey, finalResponse);
          }

          if (this.config.logRequests) {
            logger.info('AI request completed', {
              id: request.id,
              provider,
              model: request.model,
              latencyMs,
              tokens: response.usage.totalTokens,
              cost: response.usage.estimatedCostUsd,
            });
          }

          return finalResponse;
        } catch (error) {
          lastError = error as Error;
          logger.warn('AI request failed, retrying', {
            id: request.id,
            provider,
            attempt,
            error: lastError.message,
          });

          if (attempt < this.config.maxRetries) {
            await this.delay(
              this.config.retryDelayMs * Math.pow(2, attempt - 1)
            );
          }
        }
      }
    }

    throw new AIProviderError(
      'PROVIDER_FAILED',
      `All providers failed: ${lastError?.message}`,
      request.provider
    );
  }

  private async executeRequest(request: AIRequest): Promise<AIResponse> {
    const provider = request.provider;
    const config = this.providerConfigs.get(provider);
    if (!config) {
      throw new AIProviderError(
        'INVALID_PROVIDER',
        `No config for provider: ${provider}`,
        provider
      );
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timeout')),
        this.config.timeoutMs
      )
    );

    const requestPromise = this.sendToProvider(request, config);

    const result = await Promise.race([requestPromise, timeoutPromise]);
    return result;
  }

  private async sendToProvider(
    request: AIRequest,
    config: ProviderConfig
  ): Promise<AIResponse> {
    const body = this.buildRequestBody(request);
    const headers = this.buildHeaders(request.provider, config);

    const response = await fetch(`${config.baseUrl}${this.getEndpoint(request.provider)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AIProviderError(
        'API_ERROR',
        `Provider returned ${response.status}: ${errorBody}`,
        request.provider
      );
    }

    const data = await response.json();
    return this.parseResponse(request, data);
  }

  private buildRequestBody(request: AIRequest): Record<string, unknown> {
    const base: Record<string, unknown> = {
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name }),
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.topP !== undefined) base.top_p = request.topP;
    if (request.frequencyPenalty !== undefined)
      base.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined)
      base.presence_penalty = request.presencePenalty;
    if (request.stop) base.stop = request.stop;
    if (request.responseFormat === 'json') {
      base.response_format = { type: 'json_object' };
    }

    return base;
  }

  private buildHeaders(
    provider: AIProvider,
    config: ProviderConfig
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (provider) {
      case 'openai':
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        if (config.orgId) headers['OpenAI-Organization'] = config.orgId;
        break;
      case 'anthropic':
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'google':
        headers['x-goog-api-key'] = config.apiKey;
        break;
      case 'azure':
        headers['api-key'] = config.apiKey;
        break;
      case 'mistral':
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'local':
        break;
    }

    return headers;
  }

  private getEndpoint(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
      case 'azure':
        return '/chat/completions';
      case 'anthropic':
        return '/messages';
      case 'google':
        return '/models/gemini-1.5-pro:generateContent';
      case 'mistral':
        return '/chat/completions';
      case 'local':
        return '/api/chat';
      default:
        return '/chat/completions';
    }
  }

  private parseResponse(
    request: AIRequest,
    data: Record<string, unknown>
  ): AIResponse {
    const choices = data.choices as Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
    const choice = choices?.[0];
    const content = choice?.message?.content || '';
    const finishReason = this.mapFinishReason(
      choice?.finish_reason || 'stop'
    );

    const usage = data.usage as Record<string, number> | undefined;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = promptTokens + completionTokens;

    const costs = MODEL_COSTS[request.model];
    const estimatedCostUsd =
      promptTokens * costs.input + completionTokens * costs.output;

    return {
      id: request.id,
      provider: request.provider,
      model: request.model,
      content,
      finishReason,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
      },
      latencyMs: 0,
      cached: false,
    };
  }

  private mapFinishReason(
    reason: string
  ): 'stop' | 'length' | 'function_call' | 'content_filter' {
    const mapping: Record<
      string,
      'stop' | 'length' | 'function_call' | 'content_filter'
    > = {
      stop: 'stop',
      length: 'length',
      function_call: 'function_call',
      content_filter: 'content_filter',
    };
    return mapping[reason] || 'stop';
  }

  private findAvailableFallback(current: AIProvider): AIProvider | null {
    for (const provider of this.config.fallbackProviders) {
      if (provider !== current && this.rateLimiter.canProceed(provider)) {
        return provider;
      }
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async completeWithFunctions(
    request: AIRequest,
    functions: AIFunctionDefinition[]
  ): Promise<AIResponse & { functionCall?: AIFunctionCall }> {
    const functionMessage: AIMessage = {
      role: 'system',
      content: `Available functions: ${JSON.stringify(functions)}`,
    };

    const enhancedRequest: AIRequest = {
      ...request,
      messages: [functionMessage, ...request.messages],
    };

    const response = await this.complete(enhancedRequest);

    try {
      const parsed = JSON.parse(response.content);
      if (parsed.function_call) {
        return {
          ...response,
          functionCall: parsed.function_call as AIFunctionCall,
        };
      }
    } catch {
      // Not a function call response
    }

    return response;
  }

  async completeBatch(
    requests: AIRequest[]
  ): Promise<(AIResponse | AIProviderError)[]> {
    const results = await Promise.allSettled(
      requests.map((req) => this.complete(req))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') return result.value;
      return new AIProviderError(
        'BATCH_ERROR',
        result.reason?.message || 'Unknown error',
        'openai'
      );
    });
  }

  getStats(): {
    requestCount: number;
    totalCostUsd: number;
    cacheStats: { size: number; hitRate: number; totalHits: number };
    rateLimitStates: Record<string, RateLimitState>;
  } {
    const rateLimitStates: Record<string, RateLimitState> = {};
    for (const provider of PROVIDER_MODELS) {
      const state = this.rateLimiter.getState(provider as AIProvider);
      if (state) rateLimitStates[provider] = state;
    }

    return {
      requestCount: this.requestCount,
      totalCostUsd: this.totalCostUsd,
      cacheStats: this.cache.getStats(),
      rateLimitStates,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class AIProviderError extends Error {
  code: string;
  provider: AIProvider;

  constructor(code: string, message: string, provider: AIProvider) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.provider = provider;
  }
}

let clientInstance: AIProviderClient | null = null;

export function getAIProviderClient(
  config?: Partial<AIServiceConfig>
): AIProviderClient {
  if (!clientInstance) {
    clientInstance = new AIProviderClient(config);
  }
  return clientInstance;
}

export function resetAIProviderClient(): void {
  clientInstance = null;
}

export { AIProviderClient };
export type { AICache, RateLimiter };
