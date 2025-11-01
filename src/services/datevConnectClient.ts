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

interface BaseRequestOptions {
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
}

export interface FetchNextFreeClientNumberOptions extends BaseRequestOptions {
  start: number;
  range?: number;
}

export interface FetchTaxAuthoritiesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
}

export interface FetchRelationshipsOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
}

export interface FetchRelationshipTypesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
}

export interface FetchLegalFormsOptions extends BaseRequestOptions {
  select?: string;
  nationalRight?: string;
}

export interface FetchCorporateStructuresOptions extends BaseRequestOptions {
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
}

export interface FetchClientGroupTypesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
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
}

export interface FetchAreaOfResponsibilitiesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
}

export interface FetchAddresseesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
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
    const message =
      ("message" in body && typeof body.message === "string"
        ? body.message
        : undefined) ||
      ("error" in body && typeof body.error === "string" ? body.error : undefined);
    if (message) {
      return `${prefix}: ${message}`;
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/deletion-log`,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: TAX_AUTHORITIES_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: RELATIONSHIPS_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, nationalRight } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: LEGAL_FORMS_PATH,
    method: "GET",
    query: {
      select,
      "national-right": nationalRight,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CORPORATE_STRUCTURES_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: EMPLOYEES_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: COUNTRY_CODES_PATH,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected country codes payload.`);
  }

  return body;
}

export async function fetchClientGroupTypes(options: FetchClientGroupTypesOptions): Promise<JsonValue> {
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENT_GROUP_TYPES_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENT_CATEGORY_TYPES_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: BANKS_PATH,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected banks payload.`);
  }

  return body;
}

export async function fetchAreaOfResponsibilities(options: FetchAreaOfResponsibilitiesOptions): Promise<JsonValue> {
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: AREA_OF_RESPONSIBILITIES_PATH,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected area of responsibilities payload.`);
  }

  return body;
}

export async function fetchAddressees(options: FetchAddresseesOptions): Promise<JsonValue> {
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: ADDRESSEES_PATH,
    method: "GET",
    query: {
      select,
      filter,
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
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: ADDRESSEES_DELETION_LOG_PATH,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected addressees deletion log payload.`);
  }

  return body;
}
