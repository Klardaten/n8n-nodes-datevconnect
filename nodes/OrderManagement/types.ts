import type { IDataObject } from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";
import type { HttpRequestHelper } from "../../src/services/shared";

export interface OrderManagementCredentials {
  host: string;
  email: string;
  password: string;
  clientInstanceId: string;
}

export interface AuthContext {
  host: string;
  token: string;
  clientInstanceId: string;
  httpHelper?: HttpRequestHelper;
}

export type Resource =
  | "order"
  | "orderType"
  | "clientGroup"
  | "invoice"
  | "employee"
  | "fee"
  | "costCenter"
  | "selfClient";

export type OrderOperation =
  | "getAll"
  | "get"
  | "update"
  | "getMonthlyValuesForOrder"
  | "getMonthlyValuesAll"
  | "getCostItemsForOrder"
  | "getCostItemsAll"
  | "getStateWork"
  | "getStateWorkAll"
  | "getSubordersStateBilling"
  | "getSubordersStateBillingAll"
  | "getExpensePostingsForOrder"
  | "getExpensePostingsAll"
  | "updateSuborder"
  | "createExpensePosting";

export type OrderTypeOperation = "getAll";

export type ClientGroupOperation = "get";

export type InvoiceOperation = "getAll" | "get";

export type EmployeeOperation =
  | "getCapacities"
  | "getWithGroup"
  | "getQualifications"
  | "getCostRates"
  | "getChargeRates";

export type FeeOperation = "getFees" | "getFeePlans";

export type CostCenterOperation = "getAll";

export type SelfClientOperation = "getAll";

export type Operation =
  | OrderOperation
  | OrderTypeOperation
  | ClientGroupOperation
  | InvoiceOperation
  | EmployeeOperation
  | FeeOperation
  | CostCenterOperation
  | SelfClientOperation;

export type NormalizedData = IDataObject[];

export type SendSuccessFunction = (payload?: JsonValue) => void;
