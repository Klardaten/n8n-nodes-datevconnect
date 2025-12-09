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
  bodyUsed: boolean = false;
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean = false;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType = 'basic';
  readonly url: string = '';

  private _body: unknown;
  private _bodyParsed: boolean = false;
  private _bodyBytes?: Uint8Array;
  private _bodyText?: string;

  constructor(body: unknown, status: number, statusText: string, headers: Record<string, string> = {}) {
    this._body = body;
    this.status = status;
    this.statusText = statusText;
    this.ok = status >= 200 && status < 300;
    this.headers = new Headers(headers);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    this.bodyUsed = true;
    const bytes = await this.bytes();
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  }

  async blob(): Promise<Blob> {
    this.bodyUsed = true;
    const bytes = await this.arrayBuffer();
    const type = this.headers.get('content-type') || undefined;
    return new Blob([bytes], type ? { type } : undefined);
  }

  async bytes(): Promise<Uint8Array> {
    this.bodyUsed = true;

    if (this._bodyBytes) return this._bodyBytes;

    if (this._body instanceof ArrayBuffer) {
      this._bodyBytes = new Uint8Array(this._body);
      return this._bodyBytes;
    }

    if (ArrayBuffer.isView(this._body)) {
      const view = this._body as ArrayBufferView;
      this._bodyBytes = new Uint8Array(
        view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
      );
      return this._bodyBytes;
    }

    if (typeof Blob !== 'undefined' && this._body instanceof Blob) {
      this._bodyBytes = new Uint8Array(await this._body.arrayBuffer());
      return this._bodyBytes;
    }

    if (typeof this._body === 'string') {
      this._bodyBytes = new TextEncoder().encode(this._body);
      return this._bodyBytes;
    }

    if (this._body === undefined || this._body === null) {
      this._bodyBytes = new Uint8Array();
      return this._bodyBytes;
    }

    if (typeof this._body === 'object') {
      this._bodyBytes = new TextEncoder().encode(JSON.stringify(this._body));
      return this._bodyBytes;
    }

    this._bodyBytes = new TextEncoder().encode(String(this._body));
    return this._bodyBytes;
  }

  async formData(): Promise<FormData> {
    throw new Error('formData() not implemented');
  }

  async json(): Promise<unknown> {
    if (this._bodyParsed) return this._body;

    if (typeof this._body === 'string') {
      this._bodyParsed = true;
      this.bodyUsed = true;
      this._body = JSON.parse(this._body);
      return this._body;
    }

    if (
      typeof this._body === 'object' &&
      this._body !== null &&
      !(this._body instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(this._body) &&
      !(typeof Blob !== 'undefined' && this._body instanceof Blob)
    ) {
      this._bodyParsed = true;
      this.bodyUsed = true;
      return this._body;
    }

    const textBody = await this.text();
    this._body = JSON.parse(textBody);
    this._bodyParsed = true;
    return this._body;
  }

  async text(): Promise<string> {
    if (this._bodyText !== undefined) {
      this.bodyUsed = true;
      return this._bodyText;
    }

    if (typeof this._body === 'string') {
      this._bodyParsed = true;
      this.bodyUsed = true;
      this._bodyText = this._body;
      return this._bodyText;
    }

    if (
      typeof this._body === 'object' &&
      this._body !== null &&
      !(this._body instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(this._body) &&
      !(typeof Blob !== 'undefined' && this._body instanceof Blob)
    ) {
      this._bodyParsed = true;
      this.bodyUsed = true;
      this._bodyText = JSON.stringify(this._body);
      return this._bodyText;
    }

    const decoder = new TextDecoder();
    this._bodyText = decoder.decode(await this.bytes());
    this._bodyParsed = true;
    return this._bodyText;
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
