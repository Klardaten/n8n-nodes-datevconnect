import type { JsonValue } from "./datevConnectClient";

const JSON_CONTENT_TYPE = "application/json;charset=utf-8";
const DEFAULT_ERROR_PREFIX = "DATEV Order Management request failed";
const ORDER_MANAGEMENT_BASE_PATH = "datev/api/order-management/v1";

type RequestMethod = "GET" | "PUT" | "POST";

interface BaseOrderManagementRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  fetchImpl?: typeof fetch;
}

interface SendRequestOptions extends BaseOrderManagementRequestOptions {
  path: string;
  method: RequestMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: JsonValue;
}

function normaliseBaseUrl(host: string): string {
  if (!host) {
    throw new Error("DATEVconnect host must be provided");
  }

  return host.endsWith("/") ? host : `${host}/`;
}

function buildUrl(
  host: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): URL {
  const baseUrl = normaliseBaseUrl(host);
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(trimmedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function readResponseBody(response: Response): Promise<JsonValue | undefined> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return (await response.json()) as JsonValue;
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text.length > 0 ? (text as unknown as JsonValue) : undefined;
  } catch {
    return undefined;
  }
}

function buildErrorMessage(response: Response, body: JsonValue | undefined): string {
  const statusPart = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`.trim();
  const prefix = `${DEFAULT_ERROR_PREFIX}${statusPart ? ` (${statusPart})` : ""}`;

  if (body && typeof body === "object") {
    if ("message" in body && typeof body.message === "string") {
      return `${prefix}: ${body.message}`;
    }
    if ("error" in body && typeof body.error === "string") {
      const description = "error_description" in body && typeof body.error_description === "string"
        ? body.error_description
        : undefined;
      return `${prefix}: ${body.error}${description ? `: ${description}` : ""}`;
    }
  }

  if (typeof body === "string" && body.trim().length > 0) {
    return `${prefix}: ${body}`;
  }

  return prefix;
}

async function sendRequest(options: SendRequestOptions): Promise<JsonValue | undefined> {
  const { host, token, clientInstanceId, path, method, query, body, fetchImpl = fetch } = options;
  const url = buildUrl(host, path, query);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "x-client-instance-id": clientInstanceId,
    Accept: JSON_CONTENT_TYPE,
  };

  const init: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    headers["content-type"] = JSON_CONTENT_TYPE;
    init.body = JSON.stringify(body);
  }

  const response = await fetchImpl(url, init);
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(response, responseBody));
  }

  return responseBody;
}

export interface FetchOrderTypesOptions extends BaseOrderManagementRequestOptions {
  top?: number;
  skip?: number;
}

export interface FetchClientGroupOptions extends BaseOrderManagementRequestOptions {
  clientId: string;
}

export interface FetchOrdersOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  costRate?: number;
  expand?: string;
  top?: number;
  skip?: number;
}

export interface FetchOrderOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  select?: string;
  costRate?: number;
  expand?: string;
}

export interface UpdateOrderOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  order: JsonValue;
}

export interface FetchOrderMonthlyValuesOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  select?: string;
  costRate?: number;
}

export interface FetchOrdersMonthlyValuesOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  costRate?: number;
  top?: number;
  skip?: number;
}

export interface FetchOrderCostItemsOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  select?: string;
}

export interface FetchOrdersCostItemsOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchOrderStateWorkOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  select?: string;
}

export interface FetchOrdersStateWorkOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchSubordersStateBillingOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  select?: string;
}

export interface FetchSubordersStateBillingAllOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface UpdateSuborderOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  suborderId: number;
  suborder: JsonValue;
}

export interface FetchOrderExpensePostingsOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  select?: string;
}

export interface FetchExpensePostingsOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface CreateExpensePostingOptions extends BaseOrderManagementRequestOptions {
  orderId: number;
  suborderId: number;
  automaticIntegration?: boolean;
  deleteMassdataOnFailure?: boolean;
  expensePosting: JsonValue;
}

export interface FetchInvoiceOptions extends BaseOrderManagementRequestOptions {
  invoiceId: number;
}

export interface FetchInvoicesOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchEmployeeCapacitiesOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchEmployeesWithGroupOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchEmployeeQualificationsOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchEmployeeCostRatesOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchChargeRatesOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchOrderManagementCostCentersOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchFeesOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchFeePlansOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  filter?: string;
  top?: number;
  skip?: number;
}

export interface FetchSelfClientsOptions extends BaseOrderManagementRequestOptions {
  select?: string;
  top?: number;
  skip?: number;
}

export async function fetchOrderTypes(options: FetchOrderTypesOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/ordertypes`,
    method: "GET",
    query: {
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchClientGroup(options: FetchClientGroupOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/clientgroup`,
    method: "GET",
    query: { clientid: options.clientId },
  });
}

export async function fetchOrders(options: FetchOrdersOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      costrate: options.costRate,
      top: options.top,
      skip: options.skip,
      expand: options.expand,
    },
  });
}

export async function fetchOrder(options: FetchOrderOptions): Promise<JsonValue | undefined> {
  const { orderId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}`,
    method: "GET",
    query: {
      select: rest.select,
      costrate: rest.costRate,
      expand: rest.expand,
    },
  });
}

export async function updateOrder(options: UpdateOrderOptions): Promise<JsonValue | undefined> {
  const { orderId, order, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}`,
    method: "PUT",
    body: order,
  });
}

export async function fetchOrderMonthlyValues(
  options: FetchOrderMonthlyValuesOptions,
): Promise<JsonValue | undefined> {
  const { orderId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/monthlyvalues`,
    method: "GET",
    query: {
      select: rest.select,
      costrate: rest.costRate,
    },
  });
}

export async function fetchOrdersMonthlyValues(
  options: FetchOrdersMonthlyValuesOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/monthlyvalues`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      costrate: options.costRate,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchOrderCostItems(
  options: FetchOrderCostItemsOptions,
): Promise<JsonValue | undefined> {
  const { orderId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/costitems`,
    method: "GET",
    query: { select: rest.select },
  });
}

export async function fetchOrdersCostItems(
  options: FetchOrdersCostItemsOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/costitems`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchOrderStateWork(
  options: FetchOrderStateWorkOptions,
): Promise<JsonValue | undefined> {
  const { orderId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/orderstatework`,
    method: "GET",
    query: { select: rest.select },
  });
}

export async function fetchOrdersStateWork(
  options: FetchOrdersStateWorkOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/orderstatework`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchSubordersStateBilling(
  options: FetchSubordersStateBillingOptions,
): Promise<JsonValue | undefined> {
  const { orderId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/subordersstatebilling`,
    method: "GET",
    query: { select: rest.select },
  });
}

export async function fetchSubordersStateBillingAll(
  options: FetchSubordersStateBillingAllOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/subordersstatebilling`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function updateSuborder(options: UpdateSuborderOptions): Promise<JsonValue | undefined> {
  const { orderId, suborderId, suborder, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/suborders/${encodeURIComponent(suborderId)}`,
    method: "PUT",
    body: suborder,
  });
}

export async function fetchOrderExpensePostings(
  options: FetchOrderExpensePostingsOptions,
): Promise<JsonValue | undefined> {
  const { orderId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/expensepostings`,
    method: "GET",
    query: { select: rest.select },
  });
}

export async function fetchExpensePostings(
  options: FetchExpensePostingsOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/expensepostings`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function createExpensePosting(
  options: CreateExpensePostingOptions,
): Promise<JsonValue | undefined> {
  const { orderId, suborderId, expensePosting, automaticIntegration, deleteMassdataOnFailure, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/orders/${encodeURIComponent(orderId)}/suborders/${encodeURIComponent(suborderId)}/expensepostings`,
    method: "POST",
    query: {
      automaticintegration: automaticIntegration,
      deletemassdataonfailure: deleteMassdataOnFailure,
    },
    body: expensePosting,
  });
}

export async function fetchInvoice(options: FetchInvoiceOptions): Promise<JsonValue | undefined> {
  const { invoiceId, ...rest } = options;
  return sendRequest({
    ...rest,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/invoices/${encodeURIComponent(invoiceId)}`,
    method: "GET",
  });
}

export async function fetchInvoices(options: FetchInvoicesOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/invoices`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchEmployeeCapacities(
  options: FetchEmployeeCapacitiesOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/employeecapacities`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchEmployeesWithGroup(
  options: FetchEmployeesWithGroupOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/employeeswithgroup`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchEmployeeQualifications(
  options: FetchEmployeeQualificationsOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/employeesqualification`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchEmployeeCostRates(
  options: FetchEmployeeCostRatesOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/employeescostrate`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchChargeRates(options: FetchChargeRatesOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/chargerates`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchOrderManagementCostCenters(
  options: FetchOrderManagementCostCentersOptions,
): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/costcenters`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchFees(options: FetchFeesOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/fees`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchFeePlans(options: FetchFeePlansOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/feeplans`,
    method: "GET",
    query: {
      select: options.select,
      filter: options.filter,
      top: options.top,
      skip: options.skip,
    },
  });
}

export async function fetchSelfClients(options: FetchSelfClientsOptions): Promise<JsonValue | undefined> {
  return sendRequest({
    ...options,
    path: `${ORDER_MANAGEMENT_BASE_PATH}/selfclients`,
    method: "GET",
    query: {
      select: options.select,
      top: options.top,
      skip: options.skip,
    },
  });
}
