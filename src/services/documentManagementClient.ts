import type { JsonValue } from './datevConnectClient';

export interface DocumentManagementAuthenticateOptions {
  host: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
}

export interface DocumentManagementAuthenticateResponse extends Record<string, JsonValue> {
  access_token: string;
}

interface BaseDocumentManagementRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  fetchImpl?: typeof fetch;
}

// Documents endpoint interfaces
export interface FetchDocumentsOptions extends BaseDocumentManagementRequestOptions {
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchDocumentOptions extends BaseDocumentManagementRequestOptions {
  documentId: string;
}

export interface CreateDocumentOptions extends BaseDocumentManagementRequestOptions {
  document: JsonValue;
}

export interface UpdateDocumentOptions extends BaseDocumentManagementRequestOptions {
  documentId: string;
  document: JsonValue;
}

export interface DeleteDocumentOptions extends BaseDocumentManagementRequestOptions {
  documentId: string;
}

// Document Files endpoint interfaces
export interface FetchDocumentFileOptions extends BaseDocumentManagementRequestOptions {
  fileId: string;
}

export interface UploadDocumentFileOptions extends BaseDocumentManagementRequestOptions {
  binaryData: BodyInit;
}

// Domains endpoint interfaces
export interface FetchDomainsOptions extends BaseDocumentManagementRequestOptions {
  filter?: string;
}

// Document States endpoint interfaces
export interface FetchDocumentStatesOptions extends BaseDocumentManagementRequestOptions {
  filter?: string;
}

export interface FetchDocumentStateOptions extends BaseDocumentManagementRequestOptions {
  stateId: string;
}

export interface CreateDocumentStateOptions extends BaseDocumentManagementRequestOptions {
  state: JsonValue;
}

// Info endpoint interfaces
export interface FetchInfoOptions extends BaseDocumentManagementRequestOptions {}

// Secure Areas endpoint interfaces
export interface FetchSecureAreasOptions extends BaseDocumentManagementRequestOptions {}

// Property Templates endpoint interfaces  
export interface FetchPropertyTemplatesOptions extends BaseDocumentManagementRequestOptions {
  filter?: string;
}

// Individual Properties endpoint interfaces
export interface FetchIndividualPropertiesOptions extends BaseDocumentManagementRequestOptions {}

// Individual References1 endpoint interfaces
export interface FetchIndividualReferences1Options extends BaseDocumentManagementRequestOptions {
  top?: number;
  skip?: number;
}

export interface CreateIndividualReference1Options extends BaseDocumentManagementRequestOptions {
  individualReference: JsonValue;
}

// Individual References2 endpoint interfaces
export interface FetchIndividualReferences2Options extends BaseDocumentManagementRequestOptions {
  top?: number;
  skip?: number;
}

export interface CreateIndividualReference2Options extends BaseDocumentManagementRequestOptions {
  individualReference: JsonValue;
}

const DOCUMENT_MANAGEMENT_BASE_PATH = '/datev/api/dms/v2';

/**
 * Document Management API Client for DATEV DMS
 */
export class DocumentManagementClient {
  /**
   * Authenticate with the Document Management API
   */
  static async authenticate(options: DocumentManagementAuthenticateOptions): Promise<DocumentManagementAuthenticateResponse> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}/datev/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: options.email,
        password: options.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as DocumentManagementAuthenticateResponse;
    
    if (!data.access_token) {
      throw new Error('Authentication response does not include an access token');
    }

    return data;
  }

  /**
   * 1. GET /documents - Get a list of documents
   */
  static async fetchDocuments(options: FetchDocumentsOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    const queryParams = new URLSearchParams();
    
    if (options.filter) queryParams.append('filter', options.filter);
    if (options.top) queryParams.append('top', options.top.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());

    const url = `${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * POST /documents - Create a new document
   */
  static async createDocument(options: CreateDocumentOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(options.document),
    });

    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.status} ${response.statusText}`);
    }

    // Handle 201 Created response with location header
    if (response.status === 201) {
      const location = response.headers.get('Location');
      return { success: true, location };
    }

    return await response.json() as JsonValue;
  }

  /**
   * 2. GET /document-files/{file-id} - Get a document file (binary)
   */
  static async fetchDocumentFile(options: FetchDocumentFileOptions): Promise<Response> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/document-files/${encodeURIComponent(options.fileId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document file: ${response.status} ${response.statusText}`);
    }

    return response; // Return raw response for binary data handling
  }

  /**
   * POST /document-files - Upload a single file
   */
  static async uploadDocumentFile(options: UploadDocumentFileOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/document-files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json;charset=utf-8',
      },
      body: options.binaryData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload document file: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 3. GET /domains - Get list of domains
   */
  static async fetchDomains(options: FetchDomainsOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    const queryParams = new URLSearchParams();
    
    if (options.filter) queryParams.append('filter', options.filter);

    const url = `${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/domains${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domains: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 4. GET /documentstates - Get all document states
   */
  static async fetchDocumentStates(options: FetchDocumentStatesOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    const queryParams = new URLSearchParams();
    
    if (options.filter) queryParams.append('filter', options.filter);

    const url = `${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documentstates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document states: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * GET /documentstates/{state-id} - Get a specific document state
   */
  static async fetchDocumentState(options: FetchDocumentStateOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documentstates/${encodeURIComponent(options.stateId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document state: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * POST /documentstates - Create a new document state
   */
  static async createDocumentState(options: CreateDocumentStateOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documentstates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(options.state),
    });

    if (!response.ok) {
      throw new Error(`Failed to create document state: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 5. GET /info - Get system information
   */
  static async fetchInfo(options: FetchInfoOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch info: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * DELETE /documents/{id} - Delete a document (soft delete)
   */
  static async deleteDocument(options: DeleteDocumentOptions): Promise<void> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documents/${options.documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * DELETE /documents/{id}/delete-permanently - Delete a document permanently (hard delete)
   */
  static async deleteDocumentPermanently(options: DeleteDocumentOptions): Promise<void> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/documents/${options.documentId}/delete-permanently`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to permanently delete document: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * GET /secure-areas - Get secure areas (only DATEV DMS)
   */
  static async fetchSecureAreas(options: FetchSecureAreasOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/secure-areas`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch secure areas: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * GET /property-templates - Get property templates (only DATEV DMS)
   */
  static async fetchPropertyTemplates(options: FetchPropertyTemplatesOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const queryParams = new URLSearchParams();
    if (options.filter) queryParams.append('filter', options.filter);

    const url = `${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/property-templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch property templates: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * GET /individual-properties - Get individual properties (only DATEV DMS)
   */
  static async fetchIndividualProperties(options: FetchIndividualPropertiesOptions): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/individual-properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch individual properties: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 13. GET /individual-references1 - Get individual references set 1
   */
  static async fetchIndividualReferences1(options: FetchIndividualReferences1Options): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    const queryParams = new URLSearchParams();
    
    if (options.top) queryParams.append('top', options.top.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    
    const url = `${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/individual-references1${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch individual references 1: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 14. POST /individual-references1 - Create individual reference in set 1
   */
  static async createIndividualReference1(options: CreateIndividualReference1Options): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/individual-references1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(options.individualReference),
    });

    if (!response.ok) {
      throw new Error(`Failed to create individual reference 1: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 15. GET /individual-references2 - Get individual references set 2
   */
  static async fetchIndividualReferences2(options: FetchIndividualReferences2Options): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    const queryParams = new URLSearchParams();
    
    if (options.top) queryParams.append('top', options.top.toString());
    if (options.skip) queryParams.append('skip', options.skip.toString());
    
    const url = `${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/individual-references2${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch individual references 2: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }

  /**
   * 16. POST /individual-references2 - Create individual reference in set 2
   */
  static async createIndividualReference2(options: CreateIndividualReference2Options): Promise<JsonValue> {
    const fetchImpl = options.fetchImpl || fetch;
    
    const response = await fetchImpl(`${options.host}${DOCUMENT_MANAGEMENT_BASE_PATH}/individual-references2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'X-DATEV-Client-Instance-Id': options.clientInstanceId,
        'Accept': 'application/json;charset=utf-8',
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(options.individualReference),
    });

    if (!response.ok) {
      throw new Error(`Failed to create individual reference 2: ${response.status} ${response.statusText}`);
    }

    return await response.json() as JsonValue;
  }
}