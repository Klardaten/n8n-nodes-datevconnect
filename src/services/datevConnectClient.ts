export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AuthenticateOptions {
  host: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
}

export interface AuthenticateResponse extends Record<string, JsonValue> {
  access_token: string;
}

export interface BaseRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  fetchImpl?: typeof fetch;
}

export interface FetchClientsOptions extends BaseRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  top?: number;
  skip?: number;
  select?: string;
  filter?: string;
}

export interface FetchClientOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface CreateClientOptions extends BaseRequestOptions {
  client: JsonValue;
  maxNumber?: number;
}

export interface UpdateClientOptions extends BaseRequestOptions {
  clientId: string;
  client: JsonValue;
}

export interface FetchClientResponsibilitiesOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface UpdateClientResponsibilitiesOptions extends BaseRequestOptions {
  clientId: string;
  responsibilities: JsonValue;
}

export interface FetchClientCategoriesOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface UpdateClientCategoriesOptions extends BaseRequestOptions {
  clientId: string;
  categories: JsonValue;
}

export interface FetchClientGroupsOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface UpdateClientGroupsOptions extends BaseRequestOptions {
  clientId: string;
  groups: JsonValue;
}

export interface FetchClientDeletionLogOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchNextFreeClientNumberOptions extends BaseRequestOptions {
  start: number;
  range?: number;
}

export interface FetchTaxAuthoritiesOptions extends BaseRequestOptions {
  top?: number;
  skip?: number;
  select?: string;
  filter?: string;
}

export interface FetchRelationshipsOptions extends BaseRequestOptions {
  top?: number;
  skip?: number;
  select?: string;
  filter?: string;
}

export interface FetchRelationshipTypesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
}

export interface FetchLegalFormsOptions extends BaseRequestOptions {
  top?: number;
  skip?: number;
  select?: string;
  nationalRight?: string;
}

export interface FetchCorporateStructuresOptions extends BaseRequestOptions {
  top?: number;
  skip?: number;
  select?: string;
  filter?: string;
}

export interface FetchCorporateStructureOptions extends BaseRequestOptions {
  organizationId: string;
  select?: string;
}

export interface FetchEstablishmentOptions extends BaseRequestOptions {
  organizationId: string;
  establishmentId: string;
  select?: string;
}

export interface FetchEmployeesOptions extends BaseRequestOptions {
  top?: number;
  skip?: number;
  select?: string;
  filter?: string;
}

export interface FetchEmployeeOptions extends BaseRequestOptions {
  employeeId: string;
  select?: string;
}

export interface CreateEmployeeOptions extends BaseRequestOptions {
  employee: JsonValue;
}

export interface UpdateEmployeeOptions extends BaseRequestOptions {
  employeeId: string;
  employee: JsonValue;
}

export interface FetchCountryCodesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchClientGroupTypesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchClientGroupTypeOptions extends BaseRequestOptions {
  clientGroupTypeId: string;
  select?: string;
}

export interface CreateClientGroupTypeOptions extends BaseRequestOptions {
  clientGroupType: JsonValue;
}

export interface UpdateClientGroupTypeOptions extends BaseRequestOptions {
  clientGroupTypeId: string;
  clientGroupType: JsonValue;
}

export interface FetchClientCategoryTypesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchClientCategoryTypeOptions extends BaseRequestOptions {
  clientCategoryTypeId: string;
  select?: string;
}

export interface CreateClientCategoryTypeOptions extends BaseRequestOptions {
  clientCategoryType: JsonValue;
}

export interface UpdateClientCategoryTypeOptions extends BaseRequestOptions {
  clientCategoryTypeId: string;
  clientCategoryType: JsonValue;
}

export interface FetchBanksOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAreaOfResponsibilitiesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAddresseesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAddresseeOptions extends BaseRequestOptions {
  addresseeId: string;
  select?: string;
  expand?: string;
}

export interface CreateAddresseeOptions extends BaseRequestOptions {
  addressee: JsonValue;
  nationalRight?: string;
}

export interface UpdateAddresseeOptions extends BaseRequestOptions {
  addresseeId: string;
  addressee: JsonValue;
}

export interface FetchAddresseesDeletionLogOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

const JSON_CONTENT_TYPE = "application/json";

const DEFAULT_ERROR_PREFIX = "DATEVconnect request failed";

function normaliseBaseUrl(host: string): string {
  if (!host) {
    throw new Error("DATEVconnect host must be provided");
  }

  return host.endsWith("/") ? host : `${host}/`;
}

function buildHeaders(headers: Record<string, string | undefined>): HeadersInit {
  return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function readResponseBody(response: Response): Promise<JsonValue | string | undefined> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
    try {
      return (await response.json()) as JsonValue;
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

function extractErrorMessage(
  response: Response,
  body: JsonValue | string | undefined,
): string {
  const statusPart = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`.trim();
  const prefix = `${DEFAULT_ERROR_PREFIX}${statusPart ? ` (${statusPart})` : ""}`;

  if (typeof body === "string" && body.trim().length > 0) {
    return `${prefix}: ${body.trim()}`;
  }

  if (body && typeof body === "object") {
    const errorDescription = "error_description" in body && typeof body.error_description === "string"
      ? body.error_description
      : undefined;

    const message =
      ("message" in body && typeof body.message === "string"
        ? body.message
        : undefined) ||
      ("error" in body && typeof body.error === "string" ? body.error : undefined);
    if (message) {
      return `${prefix}: ${message}${errorDescription ? `: ${errorDescription}` : ""}`;
    }
  }

  return prefix;
}

async function ensureSuccess(response: Response): Promise<JsonValue | undefined> {
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(response, body));
  }

  if (body && typeof body === "object") {
    return body as JsonValue;
  }

  if (body === undefined) {
    return undefined;
  }

  throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected JSON response body.`);
}

export async function authenticate(options: AuthenticateOptions): Promise<AuthenticateResponse> {
  const { host, email, password, fetchImpl = fetch } = options;
  const baseUrl = normaliseBaseUrl(host);
  const url = new URL("api/auth/login", baseUrl);

  const response = await fetchImpl(url, {
    method: "POST",
    headers: buildHeaders({
      "content-type": JSON_CONTENT_TYPE,
    }),
    body: JSON.stringify({ email, password }),
  });

  const body = await ensureSuccess(response);

  if (!body || typeof body !== "object" || !("access_token" in body) || typeof body.access_token !== "string") {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Authentication response missing access_token.`);
  }

  return body as AuthenticateResponse;
}

const MASTER_DATA_BASE_PATH = "datevconnect/master-data/v1";
const CLIENTS_PATH = `${MASTER_DATA_BASE_PATH}/clients`;
const TAX_AUTHORITIES_PATH = `${MASTER_DATA_BASE_PATH}/tax-authorities`;
const RELATIONSHIPS_PATH = `${MASTER_DATA_BASE_PATH}/relationships`;
const RELATIONSHIP_TYPES_PATH = `${MASTER_DATA_BASE_PATH}/relationship-types`;
const LEGAL_FORMS_PATH = `${MASTER_DATA_BASE_PATH}/legal-forms`;
const CORPORATE_STRUCTURES_PATH = `${MASTER_DATA_BASE_PATH}/corporate-structures`;
const EMPLOYEES_PATH = `${MASTER_DATA_BASE_PATH}/employees`;
const COUNTRY_CODES_PATH = `${MASTER_DATA_BASE_PATH}/country-codes`;
const CLIENT_GROUP_TYPES_PATH = `${MASTER_DATA_BASE_PATH}/client-group-types`;
const CLIENT_CATEGORY_TYPES_PATH = `${MASTER_DATA_BASE_PATH}/client-category-types`;
const BANKS_PATH = `${MASTER_DATA_BASE_PATH}/banks`;
const AREA_OF_RESPONSIBILITIES_PATH = `${MASTER_DATA_BASE_PATH}/area-of-responsibilities`;
const ADDRESSEES_PATH = `${MASTER_DATA_BASE_PATH}/addressees`;
const ADDRESSEES_DELETION_LOG_PATH = `${ADDRESSEES_PATH}/deletion-log`;

type RequestMethod = "GET" | "POST" | "PUT";

interface MasterDataRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  path: string;
  method: RequestMethod;
  query?: Record<string, string | number | undefined | null>;
  body?: JsonValue;
  fetchImpl?: typeof fetch;
}

function buildApiUrl(host: string, path: string): URL {
  const baseUrl = normaliseBaseUrl(host);
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(trimmedPath, baseUrl);
}

async function sendMasterDataRequest(
  options: MasterDataRequestOptions,
): Promise<JsonValue | undefined> {
  const { host, token, clientInstanceId, path, method, query, body, fetchImpl = fetch } = options;
  const url = buildApiUrl(host, path);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchImpl(url, {
    method,
    headers: buildHeaders({
      accept: JSON_CONTENT_TYPE,
      authorization: `Bearer ${token}`,
      "content-type": JSON_CONTENT_TYPE,
      "x-client-instance-id": clientInstanceId,
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return ensureSuccess(response);
}

export async function fetchClients(options: FetchClientsOptions): Promise<JsonValue> {
  const { top, skip, select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENTS_PATH,
    method: "GET",
    query: {
      top,
      skip,
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected clients payload.`);
  }

  return body;
}

export async function fetchClient(options: FetchClientOptions): Promise<JsonValue> {
  const { clientId, select } = options;
  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client payload.`);
  }

  return body;
}

export async function createClient(options: CreateClientOptions): Promise<JsonValue | undefined> {
  const { client, maxNumber } = options;

  return sendMasterDataRequest({
    ...options,
    path: CLIENTS_PATH,
    method: "POST",
    query: {
      "max-number": maxNumber,
    },
    body: client,
  });
}

export async function updateClient(options: UpdateClientOptions): Promise<JsonValue | undefined> {
  const { clientId, client } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}`,
    method: "PUT",
    body: client,
  });
}

export async function fetchClientResponsibilities(
  options: FetchClientResponsibilitiesOptions,
): Promise<JsonValue> {
  const { clientId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/responsibilities`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected responsibilities payload.`);
  }

  return body;
}

export async function updateClientResponsibilities(
  options: UpdateClientResponsibilitiesOptions,
): Promise<JsonValue | undefined> {
  const { clientId, responsibilities } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/responsibilities`,
    method: "PUT",
    body: responsibilities,
  });
}

export async function fetchClientCategories(
  options: FetchClientCategoriesOptions,
): Promise<JsonValue> {
  const { clientId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-categories`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client categories payload.`);
  }

  return body;
}

export async function updateClientCategories(
  options: UpdateClientCategoriesOptions,
): Promise<JsonValue | undefined> {
  const { clientId, categories } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-categories`,
    method: "PUT",
    body: categories,
  });
}

export async function fetchClientGroups(options: FetchClientGroupsOptions): Promise<JsonValue> {
  const { clientId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-groups`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client groups payload.`);
  }

  return body;
}

export async function updateClientGroups(
  options: UpdateClientGroupsOptions,
): Promise<JsonValue | undefined> {
  const { clientId, groups } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-groups`,
    method: "PUT",
    body: groups,
  });
}

export async function fetchClientDeletionLog(
  options: FetchClientDeletionLogOptions,
): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/deletion-log`,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client deletion log payload.`);
  }

  return body;
}

export async function fetchNextFreeClientNumber(
  options: FetchNextFreeClientNumberOptions,
): Promise<JsonValue> {
  const { start, range } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/next-free-number`,
    method: "GET",
    query: {
      start,
      range,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected next free number payload.`);
  }

  return body;
}

export async function fetchTaxAuthorities(
  options: FetchTaxAuthoritiesOptions,
): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: TAX_AUTHORITIES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected tax authorities payload.`);
  }

  return body;
}

export async function fetchRelationships(
  options: FetchRelationshipsOptions,
): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: RELATIONSHIPS_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected relationships payload.`);
  }

  return body;
}

export async function fetchRelationshipTypes(
  options: FetchRelationshipTypesOptions,
): Promise<JsonValue> {
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: RELATIONSHIP_TYPES_PATH,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected relationship types payload.`);
  }

  return body;
}

export async function fetchLegalForms(
  options: FetchLegalFormsOptions,
): Promise<JsonValue> {
  const { select, nationalRight, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: LEGAL_FORMS_PATH,
    method: "GET",
    query: {
      select,
      "national-right": nationalRight,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected legal forms payload.`);
  }

  return body;
}

export async function fetchCorporateStructures(
  options: FetchCorporateStructuresOptions,
): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CORPORATE_STRUCTURES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected corporate structures payload.`);
  }

  return body;
}

export async function fetchCorporateStructure(
  options: FetchCorporateStructureOptions,
): Promise<JsonValue> {
  const { organizationId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CORPORATE_STRUCTURES_PATH}/${encodeURIComponent(organizationId)}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected corporate structure payload.`);
  }

  return body;
}

export async function fetchEstablishment(
  options: FetchEstablishmentOptions,
): Promise<JsonValue> {
  const { organizationId, establishmentId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CORPORATE_STRUCTURES_PATH}/${encodeURIComponent(organizationId)}/establishments/${encodeURIComponent(establishmentId)}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected establishment payload.`);
  }

  return body;
}

export async function fetchEmployees(options: FetchEmployeesOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: EMPLOYEES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected employees payload.`);
  }

  return body;
}

export async function fetchEmployee(options: FetchEmployeeOptions): Promise<JsonValue> {
  const { employeeId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected employee payload.`);
  }

  return body;
}

export async function createEmployee(options: CreateEmployeeOptions): Promise<JsonValue | undefined> {
  const { employee } = options;

  return sendMasterDataRequest({
    ...options,
    path: EMPLOYEES_PATH,
    method: "POST",
    body: employee,
  });
}

export async function updateEmployee(options: UpdateEmployeeOptions): Promise<JsonValue | undefined> {
  const { employeeId, employee } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${EMPLOYEES_PATH}/${encodeURIComponent(employeeId)}`,
    method: "PUT",
    body: employee,
  });
}

export async function fetchCountryCodes(options: FetchCountryCodesOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: COUNTRY_CODES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected country codes payload.`);
  }

  return body;
}

export async function fetchClientGroupTypes(options: FetchClientGroupTypesOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENT_GROUP_TYPES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client group types payload.`);
  }

  return body;
}

export async function fetchClientGroupType(options: FetchClientGroupTypeOptions): Promise<JsonValue> {
  const { clientGroupTypeId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENT_GROUP_TYPES_PATH}/${clientGroupTypeId}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client group type payload.`);
  }

  return body;
}

export async function createClientGroupType(options: CreateClientGroupTypeOptions): Promise<JsonValue | undefined> {
  const { clientGroupType } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENT_GROUP_TYPES_PATH,
    method: "POST",
    body: clientGroupType,
  });

  return body;
}

export async function updateClientGroupType(options: UpdateClientGroupTypeOptions): Promise<JsonValue | undefined> {
  const { clientGroupTypeId, clientGroupType } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENT_GROUP_TYPES_PATH}/${clientGroupTypeId}`,
    method: "PUT",
    body: clientGroupType,
  });

  return body;
}

export async function fetchClientCategoryTypes(options: FetchClientCategoryTypesOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENT_CATEGORY_TYPES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client category types payload.`);
  }

  return body;
}

export async function fetchClientCategoryType(options: FetchClientCategoryTypeOptions): Promise<JsonValue> {
  const { clientCategoryTypeId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENT_CATEGORY_TYPES_PATH}/${clientCategoryTypeId}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client category type payload.`);
  }

  return body;
}

export async function createClientCategoryType(options: CreateClientCategoryTypeOptions): Promise<JsonValue | undefined> {
  const { clientCategoryType } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENT_CATEGORY_TYPES_PATH,
    method: "POST",
    body: clientCategoryType,
  });

  return body;
}

export async function updateClientCategoryType(options: UpdateClientCategoryTypeOptions): Promise<JsonValue | undefined> {
  const { clientCategoryTypeId, clientCategoryType } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENT_CATEGORY_TYPES_PATH}/${clientCategoryTypeId}`,
    method: "PUT",
    body: clientCategoryType,
  });

  return body;
}

export async function fetchBanks(options: FetchBanksOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: BANKS_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected banks payload.`);
  }

  return body;
}

export async function fetchAreaOfResponsibilities(options: FetchAreaOfResponsibilitiesOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: AREA_OF_RESPONSIBILITIES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected area of responsibilities payload.`);
  }

  return body;
}

export async function fetchAddressees(options: FetchAddresseesOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: ADDRESSEES_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected addressees payload.`);
  }

  return body;
}

export async function fetchAddressee(options: FetchAddresseeOptions): Promise<JsonValue> {
  const { addresseeId, select, expand } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${ADDRESSEES_PATH}/${addresseeId}`,
    method: "GET",
    query: {
      select,
      expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected addressee payload.`);
  }

  return body;
}

export async function createAddressee(options: CreateAddresseeOptions): Promise<JsonValue | undefined> {
  const { addressee, nationalRight } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: ADDRESSEES_PATH,
    method: "POST",
    query: {
      "national-right": nationalRight,
    },
    body: addressee,
  });

  return body;
}

export async function updateAddressee(options: UpdateAddresseeOptions): Promise<JsonValue | undefined> {
  const { addresseeId, addressee } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${ADDRESSEES_PATH}/${addresseeId}`,
    method: "PUT",
    body: addressee,
  });

  return body;
}

export async function fetchAddresseesDeletionLog(options: FetchAddresseesDeletionLogOptions): Promise<JsonValue> {
  const { select, filter, top, skip } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: ADDRESSEES_DELETION_LOG_PATH,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected addressees deletion log payload.`);
  }

  return body;
}

// Accounting API interfaces and functions
export interface FetchAccountingClientsOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
  expand?: string;
}

export interface FetchAccountingClientOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
  expand?: string;
}

export interface FetchFiscalYearsOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchFiscalYearOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
}

export interface FetchAccountsReceivableOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
  expand?: string;
}

export interface FetchAccountsReceivableCondensedOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAccountReceivableOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountsReceivableId: string;
  select?: string;
  expand?: string;
}

export interface FetchAccountsPayableOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
  expand?: string;
}

export interface FetchAccountsPayableCondensedOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAccountPayableOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountsPayableId: string;
  select?: string;
  expand?: string;
}

export interface FetchAccountPostingsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAccountPostingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountPostingId: string;
  select?: string;
}

export interface FetchAccountingSequencesOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  top?: number;
  skip?: number;
}

export interface FetchAccountingSequenceOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountingSequenceId: string;
  select?: string;
}

export interface CreateAccountingSequenceOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountingSequence: JsonValue;
}

export interface FetchAccountingRecordsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountingSequenceId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAccountingRecordOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountingSequenceId: string;
  accountingRecordId: string;
  select?: string;
}

export interface FetchPostingProposalRulesIncomingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  top?: number;
  skip?: number;
}

export interface FetchPostingProposalRulesOutgoingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  top?: number;
  skip?: number;
}

export interface FetchPostingProposalRulesCashRegisterOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  top?: number;
  skip?: number;
}

export interface FetchPostingProposalRuleIncomingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  ruleId: string;
  select?: string;
}

export interface FetchPostingProposalRuleOutgoingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  ruleId: string;
  select?: string;
}

export interface FetchPostingProposalRuleCashRegisterOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  ruleId: string;
  select?: string;
}

export interface BatchPostingProposalsIncomingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  postingProposals: JsonValue;
}

export interface BatchPostingProposalsOutgoingOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  postingProposals: JsonValue;
}

export interface BatchPostingProposalsCashRegisterOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  postingProposals: JsonValue;
}

export interface FetchAccountingSumsAndBalancesOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchAccountingSumsAndBalanceOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountingSumsAndBalancesId: string;
}

export interface FetchDebitorsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
  expand?: string;
}

export interface FetchDebitorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  debitorId: string;
  select?: string;
  expand?: string;
}

export interface CreateDebitorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  debitor: JsonValue;
}

export interface UpdateDebitorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  debitorId: string;
  debitor: JsonValue;
}

export interface FetchNextAvailableDebitorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  startAt?: string;
}

export interface FetchCreditorsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
  expand?: string;
}

export interface FetchCreditorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  creditorId: string;
  select?: string;
  expand?: string;
}

export interface CreateCreditorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  creditor: JsonValue;
}

export interface UpdateCreditorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  creditorId: string;
  creditor: JsonValue;
}

export interface FetchNextAvailableCreditorOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  startAt?: string;
}

export interface FetchGeneralLedgerAccountsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchGeneralLedgerAccountOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  generalLedgerAccountId: string;
  select?: string;
}

export interface FetchUtilizedGeneralLedgerAccountsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  top?: number;
  skip?: number;
}

// Terms of Payment interfaces
export interface FetchTermsOfPaymentOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  skip?: number;
  top?: number;
}

export interface FetchTermOfPaymentOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  termOfPaymentId: string;
  select?: string;
}

export interface CreateTermOfPaymentOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  termOfPaymentData: JsonValue;
}

export interface UpdateTermOfPaymentOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  termOfPaymentId: string;
  termOfPaymentData: JsonValue;
}

// Stocktaking Data interfaces
export interface FetchStocktakingDataOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  filter?: string;
  select?: string;
  skip?: number;
  top?: number;
}

export interface FetchStocktakingDataByAssetOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  assetId: string;
  select?: string;
  skip?: number;
  top?: number;
}

export interface UpdateStocktakingDataOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  assetId: string;
  stocktakingData: JsonValue;
}

// Cost Systems interfaces
export interface FetchCostSystemsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  skip?: number;
  top?: number;
}

export interface FetchCostSystemOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  select?: string;
}

// Cost Centers interfaces
export interface FetchCostCentersOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  select?: string;
  top?: number;
  skip?: number;
}

export interface FetchCostCenterOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  costCenterId: string;
  select?: string;
}

// Cost Center Properties interfaces
export interface FetchCostCenterPropertiesOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  select?: string;
  skip?: number;
  top?: number;
}

export interface FetchCostCenterPropertyOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  costCenterPropertyId: string;
  select?: string;
}

// Internal Cost Services interfaces
export interface CreateInternalCostServiceOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  internalCostServiceData: JsonValue;
}

// Cost Sequences interfaces
export interface FetchCostSequencesOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  select?: string;
  skip?: number;
  top?: number;
}

export interface FetchCostSequenceOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  costSequenceId: string;
  select?: string;
}

export interface CreateCostSequenceOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  costSequenceId: string;
  costSequenceData: JsonValue;
}

export interface FetchCostAccountingRecordsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  costSystemId: string;
  costSequenceId: string;
  select?: string;
  skip?: number;
  top?: number;
}

// Accounting Statistics interfaces
export interface FetchAccountingStatisticsOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  filter?: string;
  skip?: number;
  top?: number;
}

// Accounting Transaction Keys interfaces
export interface FetchAccountingTransactionKeysOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  skip?: number;
  top?: number;
}

export interface FetchAccountingTransactionKeyOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  accountingTransactionKeyId: string;
  select?: string;
  filter?: string;
  skip?: number;
  top?: number;
}

// Various Addresses interfaces
export interface FetchVariousAddressesOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  select?: string;
  skip?: number;
  top?: number;
  expand?: string;
}

export interface FetchVariousAddressOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  variousAddressId: string;
  select?: string;
  skip?: number;
  top?: number;
  expand?: string;
}

export interface CreateVariousAddressOptions extends BaseRequestOptions {
  clientId: string;
  fiscalYearId: string;
  variousAddressData: JsonValue;
}

const ACCOUNTING_BASE_PATH = "datevconnect/accounting/v1";

async function sendAccountingRequest(
  options: MasterDataRequestOptions,
): Promise<JsonValue | undefined> {
  const { host, token, clientInstanceId, path, method, query, body, fetchImpl = fetch } = options;
  const url = buildApiUrl(host, path);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchImpl(url, {
    method,
    headers: buildHeaders({
      accept: JSON_CONTENT_TYPE,
      authorization: `Bearer ${token}`,
      "content-type": JSON_CONTENT_TYPE,
      "x-client-instance-id": clientInstanceId,
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return ensureSuccess(response);
}

export async function fetchAccountingClients(options: FetchAccountingClientsOptions): Promise<JsonValue> {
  const { select, filter, top, skip, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients`,
    method: "GET",
    query: {
      select,
      filter,
      top,
      skip,
      expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting clients payload.`);
  }

  return body;
}

export async function fetchAccountingClient(options: FetchAccountingClientOptions): Promise<JsonValue> {
  const { clientId, select, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}`,
    method: "GET",
    query: {
      select: select,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting client payload.`);
  }

  return body;
}

export async function fetchFiscalYears(options: FetchFiscalYearsOptions): Promise<JsonValue> {
  const { clientId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected fiscal years payload.`);
  }

  return body;
}

export async function fetchFiscalYear(options: FetchFiscalYearOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected fiscal year payload.`);
  }

  return body;
}

export async function fetchAccountsReceivable(options: FetchAccountsReceivableOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounts-receivable`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounts receivable payload.`);
  }

  return body;
}

export async function fetchAccountsReceivableCondensed(options: FetchAccountsReceivableCondensedOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounts-receivable/condensed`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected condensed accounts receivable payload.`);
  }

  return body;
}

export async function fetchAccountReceivable(options: FetchAccountReceivableOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountsReceivableId, select, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounts-receivable/${encodeURIComponent(accountsReceivableId)}`,
    method: "GET",
    query: {
      select: select,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected account receivable payload.`);
  }

  return body;
}

export async function fetchAccountsPayable(options: FetchAccountsPayableOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounts-payable`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounts payable payload.`);
  }

  return body;
}

export async function fetchAccountsPayableCondensed(options: FetchAccountsPayableCondensedOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounts-payable/condense`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected condensed accounts payable payload.`);
  }

  return body;
}

export async function fetchAccountPayable(options: FetchAccountPayableOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountsPayableId, select, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounts-payable/${encodeURIComponent(accountsPayableId)}`,
    method: "GET",
    query: {
      select: select,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected account payable payload.`);
  }

  return body;
}

export async function fetchAccountPostings(options: FetchAccountPostingsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/account-postings`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected account postings payload.`);
  }

  return body;
}

export async function fetchAccountPosting(options: FetchAccountPostingOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountPostingId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/account-postings/${encodeURIComponent(accountPostingId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected account posting payload.`);
  }

  return body;
}

export async function fetchAccountingSequences(options: FetchAccountingSequencesOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sequences-processed`,
    method: "GET",
    query: {
      select: select,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting sequences payload.`);
  }

  return body;
}

export async function fetchAccountingSequence(options: FetchAccountingSequenceOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountingSequenceId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sequences-processed/${encodeURIComponent(accountingSequenceId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting sequence payload.`);
  }

  return body;
}

export async function createAccountingSequence(options: CreateAccountingSequenceOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, accountingSequence } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sequences`,
    method: "POST",
    body: accountingSequence,
  });
}

export async function fetchAccountingRecords(options: FetchAccountingRecordsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountingSequenceId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sequences-processed/${encodeURIComponent(accountingSequenceId)}/accounting-records`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting records payload.`);
  }

  return body;
}

export async function fetchAccountingRecord(options: FetchAccountingRecordOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountingSequenceId, accountingRecordId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sequences-processed/${encodeURIComponent(accountingSequenceId)}/accounting-records/${encodeURIComponent(accountingRecordId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting record payload.`);
  }

  return body;
}

export async function fetchPostingProposalRulesIncoming(options: FetchPostingProposalRulesIncomingOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposal-rules-incoming-invoices`,
    method: "GET",
    query: {
      select: select,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected posting proposal rules incoming payload.`);
  }

  return body;
}

export async function fetchPostingProposalRulesOutgoing(options: FetchPostingProposalRulesOutgoingOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposal-rules-outgoing-invoices`,
    method: "GET",
    query: {
      select: select,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected posting proposal rules outgoing payload.`);
  }

  return body;
}

export async function fetchPostingProposalRulesCashRegister(options: FetchPostingProposalRulesCashRegisterOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposal-rules-cash-register`,
    method: "GET",
    query: {
      select: select,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected posting proposal rules cash register payload.`);
  }

  return body;
}

export async function fetchPostingProposalRuleIncoming(options: FetchPostingProposalRuleIncomingOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, ruleId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposal-rules-incoming-invoices/${encodeURIComponent(ruleId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected posting proposal rule incoming payload.`);
  }

  return body;
}

export async function fetchPostingProposalRuleOutgoing(options: FetchPostingProposalRuleOutgoingOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, ruleId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposal-rules-outgoing-invoices/${encodeURIComponent(ruleId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected posting proposal rule outgoing payload.`);
  }

  return body;
}

export async function fetchPostingProposalRuleCashRegister(options: FetchPostingProposalRuleCashRegisterOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, ruleId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposal-rules-cash-register/${encodeURIComponent(ruleId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected posting proposal rule cash register payload.`);
  }

  return body;
}

export async function batchPostingProposalsIncoming(options: BatchPostingProposalsIncomingOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, postingProposals } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposals-incoming-invoices/batch`,
    method: "POST",
    body: postingProposals,
  });
}

export async function batchPostingProposalsOutgoing(options: BatchPostingProposalsOutgoingOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, postingProposals } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposals-outgoing-invoices/batch`,
    method: "POST",
    body: postingProposals,
  });
}

export async function batchPostingProposalsCashRegister(options: BatchPostingProposalsCashRegisterOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, postingProposals } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/posting-proposals-cash-register/batch`,
    method: "POST",
    body: postingProposals,
  });
}

export async function fetchAccountingSumsAndBalances(options: FetchAccountingSumsAndBalancesOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sums-and-balances`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting sums and balances payload.`);
  }

  return body;
}

export async function fetchAccountingSumsAndBalance(options: FetchAccountingSumsAndBalanceOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountingSumsAndBalancesId } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-sums-and-balances/${encodeURIComponent(accountingSumsAndBalancesId)}`,
    method: "GET",
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting sums and balance payload.`);
  }

  return body;
}

export async function fetchDebitors(options: FetchDebitorsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/debitors`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected debitors payload.`);
  }

  return body;
}

export async function fetchDebitor(options: FetchDebitorOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, debitorId, select, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/debitors/${encodeURIComponent(debitorId)}`,
    method: "GET",
    query: {
      select: select,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected debitor payload.`);
  }

  return body;
}

export async function createDebitor(options: CreateDebitorOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, debitor } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/debitors`,
    method: "POST",
    body: debitor,
  });
}

export async function updateDebitor(options: UpdateDebitorOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, debitorId, debitor } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/debitors/${encodeURIComponent(debitorId)}`,
    method: "PUT",
    body: debitor,
  });
}

export async function fetchNextAvailableDebitor(options: FetchNextAvailableDebitorOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, startAt } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/debitors/next-available`,
    method: "GET",
    query: {
      "start-at": startAt,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected next available debitor payload.`);
  }

  return body;
}

export async function fetchCreditors(options: FetchCreditorsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/creditors`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected creditors payload.`);
  }

  return body;
}

export async function fetchCreditor(options: FetchCreditorOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, creditorId, select, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/creditors/${encodeURIComponent(creditorId)}`,
    method: "GET",
    query: {
      select: select,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected creditor payload.`);
  }

  return body;
}

export async function createCreditor(options: CreateCreditorOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, creditor } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/creditors`,
    method: "POST",
    body: creditor,
  });
}

export async function updateCreditor(options: UpdateCreditorOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, creditorId, creditor } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/creditors/${encodeURIComponent(creditorId)}`,
    method: "PUT",
    body: creditor,
  });
}

export async function fetchNextAvailableCreditor(options: FetchNextAvailableCreditorOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, startAt } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/creditors/next-available`,
    method: "GET",
    query: {
      "start-at": startAt,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected next available creditor payload.`);
  }

  return body;
}

export async function fetchGeneralLedgerAccounts(options: FetchGeneralLedgerAccountsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/general-ledger-accounts`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected general ledger accounts payload.`);
  }

  return body;
}

export async function fetchGeneralLedgerAccount(options: FetchGeneralLedgerAccountOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, generalLedgerAccountId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/general-ledger-accounts/${encodeURIComponent(generalLedgerAccountId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected general ledger account payload.`);
  }

  return body;
}

export async function fetchUtilizedGeneralLedgerAccounts(options: FetchUtilizedGeneralLedgerAccountsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/general-ledger-accounts/utilized`,
    method: "GET",
    query: {
      select: select,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected utilized general ledger accounts payload.`);
  }

  return body;
}

// Terms of Payment functions
export async function fetchTermsOfPayment(options: FetchTermsOfPaymentOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/terms-of-payment`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected terms of payment payload.`);
  }

  return body;
}

export async function fetchTermOfPayment(options: FetchTermOfPaymentOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, termOfPaymentId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/terms-of-payment/${encodeURIComponent(termOfPaymentId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected term of payment payload.`);
  }

  return body;
}

export async function createTermOfPayment(options: CreateTermOfPaymentOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, termOfPaymentData } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/terms-of-payment`,
    method: "POST",
    body: termOfPaymentData,
  });
}

export async function updateTermOfPayment(options: UpdateTermOfPaymentOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, termOfPaymentId, termOfPaymentData } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/terms-of-payment/${encodeURIComponent(termOfPaymentId)}`,
    method: "PUT",
    body: termOfPaymentData,
  });
}

// Stocktaking Data functions
export async function fetchStocktakingData(options: FetchStocktakingDataOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, filter, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/assets/stocktakings`,
    method: "GET",
    query: {
      filter: filter,
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected stocktaking data payload.`);
  }

  return body;
}

export async function fetchStocktakingDataByAsset(options: FetchStocktakingDataByAssetOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, assetId, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/assets/${encodeURIComponent(assetId)}/stocktaking/`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected stocktaking data by asset payload.`);
  }

  return body;
}

export async function updateStocktakingData(options: UpdateStocktakingDataOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, assetId, stocktakingData } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/assets/${encodeURIComponent(assetId)}/stocktaking/`,
    method: "PUT",
    body: stocktakingData,
  });
}

// Cost Systems functions
export async function fetchCostSystems(options: FetchCostSystemsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost systems payload.`);
  }

  return body;
}

export async function fetchCostSystem(options: FetchCostSystemOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost system payload.`);
  }

  return body;
}

// Cost Centers functions
export async function fetchCostCenters(options: FetchCostCentersOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, select, top, skip } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-centers`,
    method: "GET",
    query: {
      select: select,
      top: top,
      skip: skip,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost centers payload.`);
  }

  return body;
}

export async function fetchCostCenter(options: FetchCostCenterOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, costCenterId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-centers/${encodeURIComponent(costCenterId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost center payload.`);
  }

  return body;
}

// Cost Center Properties functions
export async function fetchCostCenterProperties(options: FetchCostCenterPropertiesOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-center-properties`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost center properties payload.`);
  }

  return body;
}

export async function fetchCostCenterProperty(options: FetchCostCenterPropertyOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, costCenterPropertyId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-center-properties/${encodeURIComponent(costCenterPropertyId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost center property payload.`);
  }

  return body;
}

// Internal Cost Services functions
export async function createInternalCostService(options: CreateInternalCostServiceOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, costSystemId, internalCostServiceData } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/internal-cost-services`,
    method: "POST",
    body: internalCostServiceData,
  });
}

// Cost Sequences functions
export async function fetchCostSequences(options: FetchCostSequencesOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-sequences`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost sequences payload.`);
  }

  return body;
}

export async function fetchCostSequence(options: FetchCostSequenceOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, costSequenceId, select } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-sequences/${encodeURIComponent(costSequenceId)}`,
    method: "GET",
    query: {
      select: select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost sequence payload.`);
  }

  return body;
}

export async function createCostSequence(options: CreateCostSequenceOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, costSystemId, costSequenceId, costSequenceData } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-sequences/${encodeURIComponent(costSequenceId)}`,
    method: "POST",
    body: costSequenceData,
  });
}

export async function fetchCostAccountingRecords(options: FetchCostAccountingRecordsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, costSystemId, costSequenceId, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/cost-systems/${encodeURIComponent(costSystemId)}/cost-sequences/${encodeURIComponent(costSequenceId)}/cost-accounting-records`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected cost accounting records payload.`);
  }

  return body;
}

// Accounting Statistics functions
export async function fetchAccountingStatistics(options: FetchAccountingStatisticsOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, filter, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-statistics`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting statistics payload.`);
  }

  return body;
}

// Accounting Transaction Keys functions
export async function fetchAccountingTransactionKeys(options: FetchAccountingTransactionKeysOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-transaction-keys`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting transaction keys payload.`);
  }

  return body;
}

export async function fetchAccountingTransactionKey(options: FetchAccountingTransactionKeyOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, accountingTransactionKeyId, select, filter, skip, top } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/accounting-transaction-keys/${encodeURIComponent(accountingTransactionKeyId)}`,
    method: "GET",
    query: {
      select: select,
      filter: filter,
      skip: skip,
      top: top,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected accounting transaction key payload.`);
  }

  return body;
}

// Various Addresses functions
export async function fetchVariousAddresses(options: FetchVariousAddressesOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, select, skip, top, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/various-addresses`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected various addresses payload.`);
  }

  return body;
}

export async function fetchVariousAddress(options: FetchVariousAddressOptions): Promise<JsonValue> {
  const { clientId, fiscalYearId, variousAddressId, select, skip, top, expand } = options;

  const body = await sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/various-addresses/${encodeURIComponent(variousAddressId)}`,
    method: "GET",
    query: {
      select: select,
      skip: skip,
      top: top,
      expand: expand,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected various address payload.`);
  }

  return body;
}

export async function createVariousAddress(options: CreateVariousAddressOptions): Promise<JsonValue | undefined> {
  const { clientId, fiscalYearId, variousAddressData } = options;

  return sendAccountingRequest({
    ...options,
    path: `${ACCOUNTING_BASE_PATH}/clients/${encodeURIComponent(clientId)}/fiscal-years/${encodeURIComponent(fiscalYearId)}/various-addresses`,
    method: "POST",
    body: variousAddressData,
  });
}
