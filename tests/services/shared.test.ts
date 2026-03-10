import { describe, expect, test, mock } from "bun:test";
import {
  getDatevConnectAuthContext,
  isUserApiKeyFormat,
  resolveTokenFromCredentials,
  validateDatevConnectCredentials,
} from "../../src/services/shared";

describe("isUserApiKeyFormat", () => {
  test("returns true for valid user API key (uk- prefix, length 64)", () => {
    const validKey = "uk-" + "a".repeat(61);
    expect(validKey.length).toBe(64);
    expect(isUserApiKeyFormat(validKey)).toBe(true);
  });

  test("returns false for non-string", () => {
    expect(isUserApiKeyFormat(null as unknown as string)).toBe(false);
    expect(isUserApiKeyFormat(undefined as unknown as string)).toBe(false);
  });

  test("returns false for wrong prefix", () => {
    expect(isUserApiKeyFormat("ukx" + "a".repeat(61))).toBe(false);
    expect(isUserApiKeyFormat("pk-" + "a".repeat(61))).toBe(false);
  });

  test("returns false for wrong length", () => {
    expect(isUserApiKeyFormat("uk-" + "a".repeat(60))).toBe(false);
    expect(isUserApiKeyFormat("uk-" + "a".repeat(62))).toBe(false);
  });
});

describe("validateDatevConnectCredentials", () => {
  test("does not throw when host, clientInstanceId and email+password are set", () => {
    expect(() =>
      validateDatevConnectCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        email: "u@e.com",
        password: "secret",
      }),
    ).not.toThrow();
  });

  test("does not throw when host, clientInstanceId and valid apiKey are set", () => {
    const apiKey = "uk-" + "a".repeat(61);
    expect(() =>
      validateDatevConnectCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        apiKey,
      }),
    ).not.toThrow();
  });

  test("throws when credentials is null", () => {
    expect(() => validateDatevConnectCredentials(null)).toThrow(
      "Provide either email and password or a user API key",
    );
  });

  test("throws when host is missing", () => {
    expect(() =>
      validateDatevConnectCredentials({
        clientInstanceId: "inst-1",
        email: "u@e.com",
        password: "secret",
      }),
    ).toThrow("Provide either email and password or a user API key");
  });

  test("throws when clientInstanceId is missing", () => {
    expect(() =>
      validateDatevConnectCredentials({
        host: "https://api.example.com",
        email: "u@e.com",
        password: "secret",
      }),
    ).toThrow("Provide either email and password or a user API key");
  });

  test("throws when neither email+password nor valid apiKey", () => {
    expect(() =>
      validateDatevConnectCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
      }),
    ).toThrow("Provide either email and password or a user API key");

    expect(() =>
      validateDatevConnectCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        email: "",
        password: "secret",
      }),
    ).toThrow("Provide either email and password or a user API key");

    expect(() =>
      validateDatevConnectCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        apiKey: "uk-tooshort",
      }),
    ).toThrow("Provide either email and password or a user API key");
  });
});

describe("resolveTokenFromCredentials", () => {
  test("returns apiKey when valid apiKey is set", async () => {
    const apiKey = "uk-" + "b".repeat(61);
    const token = await resolveTokenFromCredentials({
      host: "https://api.example.com",
      clientInstanceId: "inst-1",
      apiKey,
    });
    expect(token).toBe(apiKey);
  });

  test("calls authenticate and returns access_token when email+password are set", async () => {
    const fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ access_token: "jwt-123" }),
        text: () => Promise.resolve(""),
      } as Response),
    );
    const token = await resolveTokenFromCredentials(
      {
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        email: "u@e.com",
        password: "secret",
      },
      { fetchImpl: fetchMock as unknown as typeof fetch },
    );
    expect(token).toBe("jwt-123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("throws when neither valid apiKey nor email+password", async () => {
    await expect(
      resolveTokenFromCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
      }),
    ).rejects.toThrow("Provide either email and password or a user API key");

    await expect(
      resolveTokenFromCredentials({
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        email: "",
        password: "secret",
      }),
    ).rejects.toThrow("Provide either email and password or a user API key");
  });
});

describe("getDatevConnectAuthContext", () => {
  test("throws when credentials are null", async () => {
    await expect(getDatevConnectAuthContext(null)).rejects.toThrow(
      "DATEVconnect credentials are missing",
    );
  });

  test("returns auth context with apiKey as token", async () => {
    const apiKey = "uk-" + "c".repeat(61);
    const auth = await getDatevConnectAuthContext({
      host: "https://api.example.com",
      clientInstanceId: "inst-1",
      apiKey,
    });
    expect(auth).toEqual({
      host: "https://api.example.com",
      token: apiKey,
      clientInstanceId: "inst-1",
      httpHelper: undefined,
    });
  });

  test("returns auth context with httpHelper when provided", async () => {
    const apiKey = "uk-" + "d".repeat(61);
    const httpHelper = {};
    const auth = await getDatevConnectAuthContext(
      {
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        apiKey,
      },
      { httpHelper },
    );
    expect(auth.httpHelper).toBe(httpHelper);
  });

  test("validates and resolves token via authenticate when email+password set", async () => {
    const fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ access_token: "jwt-456" }),
        text: () => Promise.resolve(""),
      } as Response),
    );
    const auth = await getDatevConnectAuthContext(
      {
        host: "https://api.example.com",
        clientInstanceId: "inst-1",
        email: "u@e.com",
        password: "secret",
      },
      { fetchImpl: fetchMock as unknown as typeof fetch },
    );
    expect(auth).toMatchObject({
      host: "https://api.example.com",
      token: "jwt-456",
      clientInstanceId: "inst-1",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
