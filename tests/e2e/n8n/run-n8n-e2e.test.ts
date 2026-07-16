import { describe, expect, test } from "bun:test";

import {
  getCredentialScenarios,
  isAcceptedWorkflowFailure,
} from "./run-n8n-e2e.mjs";

describe("n8n E2E runner", () => {
  test("uses both credential scenarios when both are configured", () => {
    const scenarios = getCredentialScenarios({
      host: "https://api.klardaten-sandbox.com",
      clientInstanceId: "client-instance-id",
      apiKey: "api-key",
      email: "user@example.com",
      password: "password",
    });

    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "api-key",
      "email-password",
    ]);
  });

  test("uses the configured profile in every credential scenario", () => {
    const scenarios = getCredentialScenarios({
      host: "https://api.klardaten-sandbox.com",
      clientInstanceId: "client-instance-id",
      profileId: "service-account",
      apiKey: "api-key",
      email: "user@example.com",
      password: "password",
    });

    expect(scenarios.map((scenario) => scenario.data.profileId)).toEqual([
      "service-account",
      "service-account",
    ]);
  });

  test("accepts the known Order Management sandbox missing-plugin response", () => {
    const error = new Error("npx -y n8n@2.20.6 execute --id abc exited");
    Object.assign(error, {
      stderr: [
        "DATEV Order Management request failed (404 Not Found)",
        "order-management",
        "Version 'v1'",
        "geladenen PlugIns",
      ].join("\n"),
    });

    expect(
      isAcceptedWorkflowFailure(
        "E2E DATEV Order Management self clients",
        error,
      ),
    ).toBe(true);
  });

  test("does not accept the Order Management sandbox response for other workflows", () => {
    const error = new Error(
      "DATEV Order Management request failed (404 Not Found): order-management Version 'v1' geladenen PlugIns",
    );

    expect(
      isAcceptedWorkflowFailure("E2E DATEV Master Data country codes", error),
    ).toBe(false);
  });
});
