import { describe, expect, test } from "bun:test";

describe("sample", () => {
  test("sanity", () => {
    expect("bun").toBeTypeOf("string");
  });
});
