import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, createHttpClient } from '../src/services/api/http-client';

const schema = z.object({ name: z.string() });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clientReturning(response: Response | Error) {
  const fetchImpl = vi.fn<typeof fetch>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  return { client: createHttpClient({ baseUrl: 'http://api.test/api/v1', fetchImpl }), fetchImpl };
}

describe('createHttpClient().get', () => {
  it('returns unwrapped, validated data on success', async () => {
    const { client, fetchImpl } = clientReturning(
      jsonResponse({ success: true, data: { name: 'Hindi' } }),
    );
    await expect(client.get('/categories/hindi', schema)).resolves.toEqual({ name: 'Hindi' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api.test/api/v1/categories/hindi',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws an http ApiError carrying the server error envelope', async () => {
    const { client } = clientReturning(
      jsonResponse(
        {
          success: false,
          error: {
            statusCode: 404,
            code: 'NOT_FOUND',
            message: 'Category not found',
            path: '/api/v1/categories/x',
            timestamp: new Date().toISOString(),
          },
        },
        404,
      ),
    );
    const error = await client.get('/categories/x', schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'http',
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Category not found',
    });
  });

  it('throws invalid-response when data does not match the schema', async () => {
    const { client } = clientReturning(jsonResponse({ success: true, data: { name: 42 } }));
    await expect(client.get('/x', schema)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('throws invalid-response for non-JSON bodies (e.g. an Nginx 502 page)', async () => {
    const { client } = clientReturning(new Response('<html>Bad Gateway</html>', { status: 502 }));
    await expect(client.get('/x', schema)).rejects.toMatchObject({
      kind: 'invalid-response',
      statusCode: 502,
    });
  });

  it('throws a network ApiError when fetch itself fails', async () => {
    const { client } = clientReturning(new TypeError('Failed to fetch'));
    await expect(client.get('/x', schema)).rejects.toMatchObject({ kind: 'network' });
  });

  it('rethrows aborts untouched so React Query can cancel cleanly', async () => {
    const { client } = clientReturning(new DOMException('aborted', 'AbortError'));
    await expect(client.get('/x', schema)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('createHttpClient().post', () => {
  it('sends a POST (optionally keepalive) and validates the response like get', async () => {
    const { client, fetchImpl } = clientReturning(
      jsonResponse({ success: true, data: { name: 'counted' } }),
    );
    await expect(client.post('/songs/1/plays', schema, { keepalive: true })).resolves.toEqual({
      name: 'counted',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api.test/api/v1/songs/1/plays',
      expect.objectContaining({ method: 'POST', keepalive: true }),
    );
  });
});
