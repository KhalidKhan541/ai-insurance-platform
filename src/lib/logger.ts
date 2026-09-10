import winston from "winston";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: consoleFormat }),
];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: logFormat,
  transports,
  defaultMeta: { service: "ai-insurance-platform" },
});

export function createChildLogger(meta: Record<string, unknown>) {
  return logger.child(meta);
}

export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  logger.info("HTTP Request", {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
}

export function logError(
  message: string,
  error: Error,
  context?: Record<string, unknown>
) {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

export function logAudit(
  action: string,
  entity: string,
  entityId: string,
  userId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  logger.info("Audit Log", {
    action,
    entity,
    entityId,
    userId,
    oldValues,
    newValues,
  });
}

export function logSecurity(
  event: string,
  userId?: string,
  ip?: string,
  details?: Record<string, unknown>
) {
  logger.warn("Security Event", {
    event,
    userId,
    ip,
    ...details,
  });
}

export default logger;
