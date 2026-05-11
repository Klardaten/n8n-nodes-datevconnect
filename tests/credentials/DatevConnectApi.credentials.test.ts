import { describe, expect, test } from "bun:test";
import { DatevConnectApi } from "../../credentials/DatevConnectApi.credentials";

describe("DatevConnectApi credentials", () => {
  test("exposes optional profileId field", () => {
    const credentials = new DatevConnectApi();
    const profileIdProperty = credentials.properties.find(
      (property) => property.name === "profileId",
    );

    expect(profileIdProperty).toBeDefined();
    expect(profileIdProperty?.type).toBe("string");
    expect(profileIdProperty?.required).toBe(false);
  });
});
