import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./auth-errors";

describe("friendlyAuthError", () => {
  it("explains wrong credentials", () => {
    expect(friendlyAuthError({ message: "Invalid login credentials", code: "invalid_credentials" })).toMatch(
      /don't match/,
    );
  });
  it("asks unconfirmed users to confirm their email", () => {
    expect(friendlyAuthError({ message: "Email not confirmed" })).toMatch(/confirm your email/);
  });
  it("flags existing accounts", () => {
    expect(friendlyAuthError({ message: "User already registered" })).toMatch(/already exists/);
  });
  it("falls back to the original message", () => {
    expect(friendlyAuthError({ message: "Something odd" })).toBe("Something odd");
  });
});
