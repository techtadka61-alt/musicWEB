import { apiResponseSchema } from '@wedding/shared';
import { z } from 'zod';

const envelopeSchema = apiResponseSchema(z.unknown());

function invalidResponse(statusCode: number): ApiError {
  return new ApiError(
    'Server response did not match the expected format',
    'invalid-response',
    statusCode,
  );
}

export type ApiErrorKind = 'network' | 'http' | 'invalid-response';

/** Single error type for every API failure, so UI code handles one shape. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly statusCode: number | null = null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

type RequestFn = <TSchema extends z.ZodType>(
  path: string,
  dataSchema: TSchema,
  init?: { signal?: AbortSignal; keepalive?: boolean },
) => Promise<z.infer<TSchema>>;

export interface HttpClient {
  get: RequestFn;
  /** POST without a body (the API's only POST actions take their input from the URL). */
  post: RequestFn;
}

/**
 * Typed fetch wrapper: unwraps the shared `{ success, data | error }` envelope and validates
 * `data` at runtime, so a backend contract change surfaces as an explicit error, not as
 * `undefined` deep inside a component.
 */
export function createHttpClient({ baseUrl, fetchImpl = fetch }: HttpClientOptions): HttpClient {
  const request =
    (method: 'GET' | 'POST'): RequestFn =>
    async (path, dataSchema, init) => {
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          method,
          headers: { Accept: 'application/json' },
          signal: init?.signal,
          keepalive: init?.keepalive,
        });
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
        throw new ApiError('Unable to reach the server', 'network');
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new ApiError(
          `Server returned a non-JSON response (HTTP ${response.status})`,
          'invalid-response',
          response.status,
        );
      }

      // Two steps: validate the envelope, then the payload. A generic discriminated union
      // cannot be narrowed by TypeScript, and this keeps both checks fully typed.
      const envelope = envelopeSchema.safeParse(json);
      if (!envelope.success) {
        throw invalidResponse(response.status);
      }
      if (!envelope.data.success) {
        const { message, statusCode, code } = envelope.data.error;
        throw new ApiError(message, 'http', statusCode, code);
      }

      const data = dataSchema.safeParse(envelope.data.data);
      if (!data.success) {
        throw invalidResponse(response.status);
      }
      return data.data;
    };

  return { get: request('GET'), post: request('POST') };
}
