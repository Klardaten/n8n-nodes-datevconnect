/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "bun:test";
import { Accounting } from "../../nodes/Accounting/Accounting.node";

describe("Accounting node", () => {
  test("node description is properly configured", () => {
    const accountingNode = new Accounting();

    expect(accountingNode.description.displayName).toBe(
      "Klardaten DATEVconnect: Accounting",
    );
    expect(accountingNode.description.name).toBe("accounting");
    expect(accountingNode.description.group).toEqual(["transform"]);
    expect(accountingNode.description.version).toBe(1);

    // Check that all expected resources are available
    const resourceProperty = accountingNode.description.properties?.find(
      (p) => p.name === "resource",
    );
    expect(resourceProperty).toBeDefined();
    expect(resourceProperty?.type).toBe("options");

    const resourceOptions = (resourceProperty as any)?.options;
    expect(resourceOptions).toHaveLength(20);

    const resourceValues = resourceOptions?.map((opt: any) => opt.value);
    expect(resourceValues).toContain("client");
    expect(resourceValues).toContain("fiscalYear");
    expect(resourceValues).toContain("accountsReceivable");
    expect(resourceValues).toContain("accountsPayable");
    expect(resourceValues).toContain("accountPosting");
    expect(resourceValues).toContain("accountingSequence");
    expect(resourceValues).toContain("postingProposals");
    expect(resourceValues).toContain("accountingSumsAndBalances");
    expect(resourceValues).toContain("businessPartners");
    expect(resourceValues).toContain("generalLedgerAccounts");
    expect(resourceValues).toContain("termsOfPayment");
    expect(resourceValues).toContain("stocktakingData");
    expect(resourceValues).toContain("costSystems");
    expect(resourceValues).toContain("costCentersUnits");
    expect(resourceValues).toContain("costCenterProperties");
    expect(resourceValues).toContain("internalCostServices");
    expect(resourceValues).toContain("costSequences");
    expect(resourceValues).toContain("accountingStatistics");
    expect(resourceValues).toContain("accountingTransactionKeys");
    expect(resourceValues).toContain("variousAddresses");
  });

  test("has correct credentials configuration", () => {
    const accountingNode = new Accounting();

    expect(accountingNode.description.credentials).toHaveLength(1);
    expect(accountingNode.description.credentials?.[0].name).toBe(
      "datevConnectApi",
    );
    expect(accountingNode.description.credentials?.[0].required).toBe(true);
  });

  test("has proper structure like MasterData node", () => {
    const accountingNode = new Accounting();

    expect(accountingNode.description.requestDefaults).toBeUndefined();
    expect(accountingNode.description.description).toBe(
      "Interact with DATEV Accounting API",
    );
    expect(accountingNode.description.defaults.name).toBe("Accounting");
  });

  test("resource operations are properly configured", () => {
    const accountingNode = new Accounting();
    const properties = accountingNode.description.properties || [];

    // Check client operations
    const clientOperations = properties.find(
      (p) =>
        p.name === "operation" &&
        (p as any).displayOptions?.show?.resource?.includes("client"),
    );
    expect(clientOperations).toBeDefined();

    // Check fiscal year operations
    const fiscalYearOperations = properties.find(
      (p) =>
        p.name === "operation" &&
        (p as any).displayOptions?.show?.resource?.includes("fiscalYear"),
    );
    expect(fiscalYearOperations).toBeDefined();

    // Check accounts receivable operations
    const accountsReceivableOperations = properties.find(
      (p) =>
        p.name === "operation" &&
        (p as any).displayOptions?.show?.resource?.includes(
          "accountsReceivable",
        ),
    );
    expect(accountsReceivableOperations).toBeDefined();

    // Verify accounts receivable has getCondensed operation
    const arOptions = (accountsReceivableOperations as any)?.options;
    const arOperationValues = arOptions?.map((opt: any) => opt.value);
    expect(arOperationValues).toContain("getCondensed");
  });

  test("query parameters are available for list operations", () => {
    const accountingNode = new Accounting();
    const properties = accountingNode.description.properties || [];

    // Check that limit (top) parameter exists
    const topParam = properties.find((p) => p.name === "top");
    expect(topParam).toBeDefined();
    expect(topParam?.type).toBe("number");
    expect(topParam?.default).toBe(100);

    // Check that skip parameter exists
    const skipParam = properties.find((p) => p.name === "skip");
    expect(skipParam).toBeDefined();
    expect(skipParam?.type).toBe("number");
    expect(skipParam?.default).toBe(0);

    // Check that select parameter exists
    const selectParam = properties.find((p) => p.name === "select");
    expect(selectParam).toBeDefined();
    expect(selectParam?.type).toBe("string");

    // Check that filter parameter exists
    const filterParam = properties.find((p) => p.name === "filter");
    expect(filterParam).toBeDefined();
    expect(filterParam?.type).toBe("string");
  });

  test("ID parameters are properly configured", () => {
    const accountingNode = new Accounting();
    const properties = accountingNode.description.properties || [];

    // Client ID parameter
    const clientIdParams = properties.filter((p) => p.name === "clientId");
    expect(clientIdParams.length).toBeGreaterThan(0);

    // Fiscal Year ID parameter
    const fiscalYearIdParams = properties.filter(
      (p) => p.name === "fiscalYearId",
    );
    expect(fiscalYearIdParams.length).toBeGreaterThan(0);

    // Accounts Receivable ID parameter
    const accountsReceivableIdParam = properties.find(
      (p) => p.name === "accountsReceivableId",
    );
    expect(accountsReceivableIdParam).toBeDefined();

    // Account Posting ID parameter
    const accountPostingIdParam = properties.find(
      (p) => p.name === "accountPostingId",
    );
    expect(accountPostingIdParam).toBeDefined();

    // Accounting Sequence ID parameter
    const accountingSequenceIdParam = properties.find(
      (p) => p.name === "accountingSequenceId",
    );
    expect(accountingSequenceIdParam).toBeDefined();
  });
});
