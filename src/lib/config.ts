const config = {
  app: {
    name: process.env.APP_NAME || "AI Insurance Platform",
    version: process.env.APP_VERSION || "0.1.0",
    url: process.env.APP_URL || "http://localhost:3000",
    environment: process.env.NODE_ENV || "development",
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || "2592000", 10),
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  email: {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@aiinsurance.com",
  },
  storage: {
    bucket: process.env.S3_BUCKET || "ai-insurance-uploads",
    region: process.env.AWS_REGION || "us-east-1",
    accessKey: process.env.AWS_ACCESS_KEY_ID || "",
    secretKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.AI_MODEL || "gpt-4",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "4096", 10),
  },
  features: {
    enableMFA: process.env.ENABLE_MFA === "true",
    enableAuditLog: process.env.ENABLE_AUDIT_LOG !== "false",
    enableFraudDetection: process.env.ENABLE_FRAUD_DETECTION !== "false",
    enableAIUnderwriting: process.env.ENABLE_AI_UNDERWRITING !== "false",
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== "false",
  },
  limits: {
    maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || "10485760", 10),
    maxQueryResults: parseInt(process.env.MAX_QUERY_RESULTS || "100", 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || "http://localhost:3000").split(","),
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const;

export function validateConfig() {
  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
  ] as const;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export function getConfig() {
  return config;
}

export default config;
