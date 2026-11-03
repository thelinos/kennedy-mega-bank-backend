const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];

export const getAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;

  if (!configuredOrigins?.trim()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS must be configured in production');
    }

    return LOCAL_DEVELOPMENT_ORIGINS;
  }

  const origins = configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);

  if (origins.includes('*')) {
    throw new Error('Wildcard CORS origins are not allowed when credentials are enabled');
  }

  for (const origin of origins) {
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }

    if (
      (parsedOrigin.protocol !== 'https:' && parsedOrigin.protocol !== 'http:') ||
      parsedOrigin.origin !== origin
    ) {
      throw new Error(`CORS origin must be an exact HTTP(S) origin: ${origin}`);
    }
  }

  return [...new Set(origins)];
};
