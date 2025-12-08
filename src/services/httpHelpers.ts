/**
 * HTTP helpers for wrapping n8n's httpRequest to work like fetch()
 */

import type { IHttpRequestOptions } from 'n8n-workflow';

// Type for n8n's httpRequest helper
export type HttpRequestHelper = (options: IHttpRequestOptions) => Promise<unknown>;

/**
 * Response-like wrapper for n8n httpRequest responses
 */
class HttpResponse {
  readonly body: ReadableStream<Uint8Array> | null = null;
  readonly bodyUsed: boolean = false;
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean = false;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType = 'basic';
  readonly url: string = '';

  private _body: unknown;
  private _bodyParsed: boolean = false;

  constructor(body: unknown, status: number, statusText: string, headers: Record<string, string> = {}) {
    this._body = body;
    this.status = status;
    this.statusText = statusText;
    this.ok = status >= 200 && status < 300;
    this.headers = new Headers(headers);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('arrayBuffer() not implemented');
  }

  async blob(): Promise<Blob> {
    throw new Error('blob() not implemented');
  }

  async bytes(): Promise<Uint8Array> {
    throw new Error('bytes() not implemented');
  }

  async formData(): Promise<FormData> {
    throw new Error('formData() not implemented');
  }

  async json(): Promise<unknown> {
    if (this._bodyParsed) return this._body;
    this._bodyParsed = true;
    
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }

  async text(): Promise<string> {
    if (this._bodyParsed) {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
    }
    this._bodyParsed = true;
    
    if (typeof this._body === 'string') {
      return this._body;
    }
    return JSON.stringify(this._body);
  }

  clone(): Response {
    const headersObj: Record<string, string> = {};
    this.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    return new HttpResponse(this._body, this.status, this.statusText, headersObj) as Response;
  }
}

/**
 * Creates a fetch-like function using n8n's httpRequest helper
 */
export function createFetchFromHttpHelper(httpHelper: HttpRequestHelper): typeof fetch {
  const fetchFunction = async (input: URL | RequestInfo | string, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    const headers: Record<string, string> = {};

    // Extract headers from init
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }

    try {
      const response = await httpHelper({
        url,
        method,
        headers,
        body: init?.body,
        returnFullResponse: true,
      });

      // n8n's httpRequest returns { body, headers, statusCode, statusMessage }
      const responseObj = response as Record<string, unknown>;
      const status = (responseObj.statusCode || 200) as number;
      const statusText = (responseObj.statusMessage || '') as string;
      const responseHeaders = (responseObj.headers || {}) as Record<string, string>;

      return new HttpResponse(responseObj.body, status, statusText, responseHeaders) as Response;
    } catch (error: unknown) {
      // Handle errors from n8n httpRequest
      const errorObj = error as Record<string, unknown>;
      const response = errorObj.response as Record<string, unknown> | undefined;
      const status = (errorObj.statusCode || response?.statusCode || 500) as number;
      const statusText = (errorObj.statusMessage || errorObj.message || 'Internal Server Error') as string;
      const body = response?.body || errorObj.body || errorObj.message;
      const headers = (response?.headers || errorObj.headers || {}) as Record<string, string>;

      return new HttpResponse(body, status, statusText, headers) as Response;
    }
  };
  
  return fetchFunction as typeof fetch;
}
