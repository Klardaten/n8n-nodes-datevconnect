import { describe, expect, test } from "bun:test";

import {
  authenticate,
  createClient,
  fetchClient,
  fetchClientCategories,
  fetchClientDeletionLog,
  fetchClientGroups,
  fetchClientResponsibilities,
  fetchClients,
  fetchNextFreeClientNumber,
  fetchTaxAuthorities,
  fetchRelationships,
  fetchRelationshipTypes,
  fetchLegalForms,
  fetchCorporateStructures,
  fetchCorporateStructure,
  fetchEstablishment,
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  updateClient,
  updateClientCategories,
  updateClientGroups,
  updateClientResponsibilities,
  type AuthenticateOptions,
  type CreateClientOptions,
  type FetchClientCategoriesOptions,
  type FetchClientDeletionLogOptions,
  type FetchClientGroupsOptions,
  type FetchClientOptions,
  type FetchClientResponsibilitiesOptions,
  type FetchClientsOptions,
  type FetchNextFreeClientNumberOptions,
  type FetchTaxAuthoritiesOptions,
  type FetchRelationshipsOptions,
  type FetchRelationshipTypesOptions,
  type FetchLegalFormsOptions,
  type FetchCorporateStructuresOptions,
  type FetchCorporateStructureOptions,
  type FetchEstablishmentOptions,
  type FetchEmployeesOptions,
  type FetchEmployeeOptions,
  type CreateEmployeeOptions,
  type UpdateEmployeeOptions,
  type UpdateClientCategoriesOptions,
  type UpdateClientGroupsOptions,
  type UpdateClientOptions,
  type UpdateClientResponsibilitiesOptions,
} from "../../src/services/datevConnectClient";

type FetchCall = {
  url: URL;
  init?: RequestInit;
};

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function createFetchMock(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): typeof fetch {
  const fn = implementation as typeof fetch;
  fn.preconnect = async () => {
    /* no-op for tests */
  };
  return fn;
}

describe("authenticate", () => {
  test("sends credentials and returns authentication token", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({ access_token: "abc123" }, { status: 200 });
    });

    const options: AuthenticateOptions = {
      host: "https://api.example.com",
      email: "user@example.com",
      password: "secret",
      fetchImpl: fetchMock,
    };

    const response = await authenticate(options);

    expect(response).toEqual({ access_token: "abc123" });
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.toString()).toBe("https://api.example.com/api/auth/login");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "content-type": "application/json",
    });
    expect(init?.body).toBeDefined();

    const parsedBody = JSON.parse(String(init?.body));
    expect(parsedBody).toEqual({
      email: "user@example.com",
      password: "secret",
    });
  });

  test("throws when authentication response does not include a token", async () => {
    const fetchMock = createFetchMock(async () =>
      createJsonResponse({ unexpected: true }, { status: 200 }),
    );

    await expect(
      authenticate({
        host: "https://api.example.com",
        email: "user@example.com",
        password: "secret",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrowError(
      "DATEVconnect request failed: Authentication response missing access_token.",
    );
  });
});

describe("fetchClients", () => {
  test("requests clients using provided query options", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: 1 }], { status: 200 });
    });

    const options: FetchClientsOptions = {
      host: "https://api.example.com/", // ensure trailing slash is handled
      token: "token-123",
      clientInstanceId: "instance-1",
      top: 10,
      skip: 5,
      select: "id,name",
      filter: "status eq active",
      fetchImpl: fetchMock,
    };

    const response = await fetchClients(options);

    expect(response).toEqual([{ id: 1 }]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/clients");
    expect(url.searchParams.get("top")).toBe("10");
    expect(url.searchParams.get("skip")).toBe("5");
    expect(url.searchParams.get("select")).toBe("id,name");
    expect(url.searchParams.get("filter")).toBe("status eq active");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toMatchObject({
      accept: "application/json",
      authorization: "Bearer token-123",
      "content-type": "application/json",
      "x-client-instance-id": "instance-1",
    });
  });

  test("throws a descriptive error when the API responds with an error", async () => {
    const fetchMock = createFetchMock(async () =>
      createJsonResponse(
        { message: "Something went wrong" },
        {
          status: 401,
          statusText: "Unauthorized",
        },
      ),
    );

    await expect(
      fetchClients({
        host: "https://api.example.com",
        token: "token-123",
        clientInstanceId: "instance-1",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrowError("DATEVconnect request failed (401 Unauthorized): Something went wrong");
  });
});

describe("fetchClient", () => {
  test("requests a single client with optional select", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({ id: "client-1" }, { status: 200 });
    });

    const options: FetchClientOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      select: "id,name",
      fetchImpl: fetchMock,
    };

    const response = await fetchClient(options);

    expect(response).toEqual({ id: "client-1" });
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/clients/client-1");
    expect(url.searchParams.get("select")).toBe("id,name");
    expect(init?.method).toBe("GET");
  });
});

describe("createClient", () => {
  test("creates a client with optional max number", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(null, { status: 204 });
    });

    const options: CreateClientOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      client: { name: "New Client" },
      maxNumber: 999,
      fetchImpl: fetchMock,
    };

    const response = await createClient(options);

    expect(response).toBeUndefined();
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.toString()).toBe(
      "https://api.example.com/datevconnect/master-data/v1/clients?max-number=999",
    );
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer token-123",
    });
    expect(init?.body).toBeDefined();
    expect(JSON.parse(String(init?.body))).toEqual({ name: "New Client" });
  });
});

describe("updateClient", () => {
  test("updates a client by id", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(null, { status: 204 });
    });

    const options: UpdateClientOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      client: { note: "Updated note" },
      fetchImpl: fetchMock,
    };

    await updateClient(options);

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url.toString()).toBe(
      "https://api.example.com/datevconnect/master-data/v1/clients/client-1",
    );
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({ note: "Updated note" });
  });
});

describe("client responsibilities", () => {
  test("fetches responsibilities for a client", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: 1 }], { status: 200 });
    });

    const options: FetchClientResponsibilitiesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      select: "id,employee_number",
      fetchImpl: fetchMock,
    };

    const response = await fetchClientResponsibilities(options);

    expect(response).toEqual([{ id: 1 }]);
    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url.pathname).toBe(
      "/datevconnect/master-data/v1/clients/client-1/responsibilities",
    );
    expect(url.searchParams.get("select")).toBe("id,employee_number");
    expect(init?.method).toBe("GET");
  });

  test("updates responsibilities for a client", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(null, { status: 204 });
    });

    const options: UpdateClientResponsibilitiesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      responsibilities: [{ id: 1, area_of_responsibility_id: "AB" }],
      fetchImpl: fetchMock,
    };

    await updateClientResponsibilities(options);

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url.toString()).toBe(
      "https://api.example.com/datevconnect/master-data/v1/clients/client-1/responsibilities",
    );
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual([
      { id: 1, area_of_responsibility_id: "AB" },
    ]);
  });
});

describe("client categories", () => {
  test("fetches client categories by client id", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: "cat-1" }], { status: 200 });
    });

    const options: FetchClientCategoriesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      select: "id,name",
      fetchImpl: fetchMock,
    };

    const response = await fetchClientCategories(options);

    expect(response).toEqual([{ id: "cat-1" }]);
    expect(calls).toHaveLength(1);

    const [{ url }] = calls;
    expect(url.pathname).toBe(
      "/datevconnect/master-data/v1/clients/client-1/client-categories",
    );
    expect(url.searchParams.get("select")).toBe("id,name");
  });

  test("updates client categories for a client", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(null, { status: 204 });
    });

    const options: UpdateClientCategoriesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      categories: [{ id: "cat-1" }],
      fetchImpl: fetchMock,
    };

    await updateClientCategories(options);

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url.toString()).toBe(
      "https://api.example.com/datevconnect/master-data/v1/clients/client-1/client-categories",
    );
    expect(JSON.parse(String(init?.body))).toEqual([{ id: "cat-1" }]);
  });
});

describe("client groups", () => {
  test("fetches client groups by client id", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: "group-1" }], { status: 200 });
    });

    const options: FetchClientGroupsOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      select: "id,name",
      fetchImpl: fetchMock,
    };

    const response = await fetchClientGroups(options);

    expect(response).toEqual([{ id: "group-1" }]);
    expect(calls).toHaveLength(1);
    const [{ url }] = calls;
    expect(url.pathname).toBe(
      "/datevconnect/master-data/v1/clients/client-1/client-groups",
    );
    expect(url.searchParams.get("select")).toBe("id,name");
  });

  test("updates client groups for a client", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(null, { status: 204 });
    });

    const options: UpdateClientGroupsOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      clientId: "client-1",
      groups: [{ id: "group-1" }],
      fetchImpl: fetchMock,
    };

    await updateClientGroups(options);

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url.toString()).toBe(
      "https://api.example.com/datevconnect/master-data/v1/clients/client-1/client-groups",
    );
    expect(JSON.parse(String(init?.body))).toEqual([{ id: "group-1" }]);
  });
});

describe("fetchClientDeletionLog", () => {
  test("requests deleted clients with select and filter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: "client-1" }], { status: 200 });
    });

    const options: FetchClientDeletionLogOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id",
      filter: "timestamp gt 2020-01-01T00:00:00.000",
      fetchImpl: fetchMock,
    };

    const response = await fetchClientDeletionLog(options);

    expect(response).toEqual([{ id: "client-1" }]);
    expect(calls).toHaveLength(1);
    const [{ url }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/clients/deletion-log");
    expect(url.searchParams.get("select")).toBe("id");
    expect(url.searchParams.get("filter")).toBe("timestamp gt 2020-01-01T00:00:00.000");
  });
});

describe("fetchNextFreeClientNumber", () => {
  test("requests next free number using start and optional range", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({ next_free_number: 12345 }, { status: 200 });
    });

    const options: FetchNextFreeClientNumberOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      start: 10000,
      range: 500,
      fetchImpl: fetchMock,
    };

    const response = await fetchNextFreeClientNumber(options);

    expect(response).toEqual({ next_free_number: 12345 });
    expect(calls).toHaveLength(1);
    const [{ url }] = calls;
    expect(url.toString()).toBe(
      "https://api.example.com/datevconnect/master-data/v1/clients/next-free-number?start=10000&range=500",
    );
  });
});

describe("fetchTaxAuthorities", () => {
  test("requests tax authorities with optional select and filter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: "9241" }], { status: 200 });
    });

    const options: FetchTaxAuthoritiesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,name",
      filter: "city eq 'Nuremberg'",
      fetchImpl: fetchMock,
    };

    const response = await fetchTaxAuthorities(options);

    expect(response).toEqual([{ id: "9241" }]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/tax-authorities");
    expect(url.searchParams.get("select")).toBe("id,name");
    expect(url.searchParams.get("filter")).toBe("city eq 'Nuremberg'");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchRelationships", () => {
  test("requests relationships with optional select and filter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: "rel-1" }], { status: 200 });
    });

    const options: FetchRelationshipsOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,name",
      filter: "type_id eq S00058",
      fetchImpl: fetchMock,
    };

    const response = await fetchRelationships(options);

    expect(response).toEqual([{ id: "rel-1" }]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/relationships");
    expect(url.searchParams.get("select")).toBe("id,name");
    expect(url.searchParams.get("filter")).toBe("type_id eq S00058");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchRelationshipTypes", () => {
  test("requests relationship types with optional select and filter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([
        { 
          id: "S00051", 
          abbreviation: "GV", 
          name: "Gesetzlicher Vertreter des Unternehmens",
          standard: true,
          type: 2
        }
      ], { status: 200 });
    });

    const options: FetchRelationshipTypesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,name,abbreviation",
      filter: "standard eq true",
      fetchImpl: fetchMock,
    };

    const response = await fetchRelationshipTypes(options);

    expect(response).toEqual([
      { 
        id: "S00051", 
        abbreviation: "GV", 
        name: "Gesetzlicher Vertreter des Unternehmens",
        standard: true,
        type: 2
      }
    ]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/relationship-types");
    expect(url.searchParams.get("select")).toBe("id,name,abbreviation");
    expect(url.searchParams.get("filter")).toBe("standard eq true");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchLegalForms", () => {
  test("requests legal forms with optional select and national-right", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([
        { 
          id: "000001", 
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
          short_name: "GmbH",
          long_name: "Gesellschaft mit beschränkter Haftung",
          nation: "DE",
          type: 3
        }
      ], { status: 200 });
    });

    const options: FetchLegalFormsOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,display_name,nation",
      nationalRight: "german",
      fetchImpl: fetchMock,
    };

    const response = await fetchLegalForms(options);

    expect(response).toEqual([
      { 
        id: "000001", 
        display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
        short_name: "GmbH",
        long_name: "Gesellschaft mit beschränkter Haftung",
        nation: "DE",
        type: 3
      }
    ]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/legal-forms");
    expect(url.searchParams.get("select")).toBe("id,display_name,nation");
    expect(url.searchParams.get("national-right")).toBe("german");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchCorporateStructures", () => {
  test("requests corporate structures with optional select and filter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([
        { 
          id: "f43f9c3g-380c-494e-97c8-d12fff738180",
          name: "Musterkanzlei",
          number: 1,
          status: "active",
          establishments: [],
          functional_areas: []
        }
      ], { status: 200 });
    });

    const options: FetchCorporateStructuresOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,name,number",
      filter: "status eq active",
      fetchImpl: fetchMock,
    };

    const response = await fetchCorporateStructures(options);

    expect(response).toEqual([
      { 
        id: "f43f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei",
        number: 1,
        status: "active",
        establishments: [],
        functional_areas: []
      }
    ]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/corporate-structures");
    expect(url.searchParams.get("select")).toBe("id,name,number");
    expect(url.searchParams.get("filter")).toBe("status eq active");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchCorporateStructure", () => {
  test("requests specific organization with select parameter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({ 
        id: "f43f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei",
        number: 1,
        status: "active",
        establishments: [],
        functional_areas: []
      }, { status: 200 });
    });

    const options: FetchCorporateStructureOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      organizationId: "f43f9c3g-380c-494e-97c8-d12fff738180",
      select: "id,name,establishments",
      fetchImpl: fetchMock,
    };

    const response = await fetchCorporateStructure(options);

    expect(response).toEqual({ 
      id: "f43f9c3g-380c-494e-97c8-d12fff738180",
      name: "Musterkanzlei",
      number: 1,
      status: "active",
      establishments: [],
      functional_areas: []
    });
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/corporate-structures/f43f9c3g-380c-494e-97c8-d12fff738180");
    expect(url.searchParams.get("select")).toBe("id,name,establishments");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchEstablishment", () => {
  test("requests specific establishment with organization and establishment IDs", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({ 
        id: "h63f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei - Hauptsitz",
        number: 1,
        short_name: "Hauptsitz",
        status: "active"
      }, { status: 200 });
    });

    const options: FetchEstablishmentOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      organizationId: "f43f9c3g-380c-494e-97c8-d12fff738180",
      establishmentId: "h63f9c3g-380c-494e-97c8-d12fff738180",
      select: "id,name,short_name",
      fetchImpl: fetchMock,
    };

    const response = await fetchEstablishment(options);

    expect(response).toEqual({ 
      id: "h63f9c3g-380c-494e-97c8-d12fff738180",
      name: "Musterkanzlei - Hauptsitz",
      number: 1,
      short_name: "Hauptsitz",
      status: "active"
    });
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/corporate-structures/f43f9c3g-380c-494e-97c8-d12fff738180/establishments/h63f9c3g-380c-494e-97c8-d12fff738180");
    expect(url.searchParams.get("select")).toBe("id,name,short_name");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchEmployees", () => {
  test("requests employees with optional select and filter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([
        {
          id: "e23f9c3c-380c-494e-97c8-d12fff738189",
          display_name: "Mustermeier, Sonja",
          email: "sonja.mustermeier@musterkanzlei.de",
          number: 10000,
          status: "active"
        }
      ], { status: 200 });
    });

    const options: FetchEmployeesOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,display_name,email",
      filter: "status eq active",
      fetchImpl: fetchMock,
    };

    const response = await fetchEmployees(options);

    expect(response).toEqual([
      {
        id: "e23f9c3c-380c-494e-97c8-d12fff738189",
        display_name: "Mustermeier, Sonja",
        email: "sonja.mustermeier@musterkanzlei.de",
        number: 10000,
        status: "active"
      }
    ]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/employees");
    expect(url.searchParams.get("select")).toBe("id,display_name,email");
    expect(url.searchParams.get("filter")).toBe("status eq active");
    expect(init?.method).toBe("GET");
  });
});

describe("fetchEmployee", () => {
  test("requests specific employee with select parameter", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({
        id: "e23f9c3c-380c-494e-97c8-d12fff738189",
        display_name: "Mustermeier, Sonja",
        email: "sonja.mustermeier@musterkanzlei.de",
        number: 10000,
        status: "active"
      }, { status: 200 });
    });

    const options: FetchEmployeeOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      employeeId: "e23f9c3c-380c-494e-97c8-d12fff738189",
      select: "id,display_name,email",
      fetchImpl: fetchMock,
    };

    const response = await fetchEmployee(options);

    expect(response).toEqual({
      id: "e23f9c3c-380c-494e-97c8-d12fff738189",
      display_name: "Mustermeier, Sonja",
      email: "sonja.mustermeier@musterkanzlei.de",
      number: 10000,
      status: "active"
    });
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/employees/e23f9c3c-380c-494e-97c8-d12fff738189");
    expect(url.searchParams.get("select")).toBe("id,display_name,email");
    expect(init?.method).toBe("GET");
  });
});

describe("createEmployee", () => {
  test("creates employee with employee data", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse(undefined, { 
        status: 204,
        headers: {
          "Link": "</datevconnect/master-data/v1/employees/new-employee-id>; rel=self"
        }
      });
    });

    const options: CreateEmployeeOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      employee: {
        display_name: "New Employee",
        email: "new.employee@example.com",
        natural_person_id: "person-guid-123"
      },
      fetchImpl: fetchMock,
    };

    const response = await createEmployee(options);

    expect(response).toBeUndefined();
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/employees");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "content-type": "application/json",
      "authorization": "Bearer token-123",
      "x-client-instance-id": "instance-1",
    });

    const parsedBody = JSON.parse(String(init?.body));
    expect(parsedBody).toEqual({
      display_name: "New Employee",
      email: "new.employee@example.com",
      natural_person_id: "person-guid-123"
    });
  });
});

describe("updateEmployee", () => {
  test("updates employee by id", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse(undefined, { 
        status: 204,
        headers: {
          "Link": "</datevconnect/master-data/v1/employees/e23f9c3c-380c-494e-97c8-d12fff738189>; rel=self"
        }
      });
    });

    const options: UpdateEmployeeOptions = {
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      employeeId: "e23f9c3c-380c-494e-97c8-d12fff738189",
      employee: {
        display_name: "Updated Employee Name",
        email: "updated.email@example.com"
      },
      fetchImpl: fetchMock,
    };

    const response = await updateEmployee(options);

    expect(response).toBeUndefined();
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.pathname).toBe("/datevconnect/master-data/v1/employees/e23f9c3c-380c-494e-97c8-d12fff738189");
    expect(init?.method).toBe("PUT");
    expect(init?.headers).toMatchObject({
      "content-type": "application/json",
      "authorization": "Bearer token-123",
      "x-client-instance-id": "instance-1",
    });

    const parsedBody = JSON.parse(String(init?.body));
    expect(parsedBody).toEqual({
      display_name: "Updated Employee Name",
      email: "updated.email@example.com"
    });
  });
});
