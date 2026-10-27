import { describe, expect, it } from "vitest";
import { toLoginError, toVerifyError } from "./auth-errors";

describe("toLoginError", () => {
  it("keeps wrong credentials and throttling, and treats the rest as the server being unavailable", () => {
    expect(toLoginError("invalid-credentials")).toBe("invalid-credentials");
    expect(toLoginError("throttled")).toBe("throttled");
    expect(toLoginError("network")).toBe("unavailable");
    expect(toLoginError("unknown")).toBe("unavailable");
    expect(toLoginError("invalid-session")).toBe("unavailable");
    expect(toLoginError("wrong-code")).toBe("unavailable");
  });
});

describe("toVerifyError", () => {
  it("keeps a wrong code and throttling, sends an expired login back, and treats the rest as unavailable", () => {
    expect(toVerifyError("wrong-code")).toBe("wrong-code");
    expect(toVerifyError("throttled")).toBe("throttled");
    expect(toVerifyError("invalid-session")).toBe("session-expired");
    expect(toVerifyError("network")).toBe("unavailable");
    expect(toVerifyError("unknown")).toBe("unavailable");
    expect(toVerifyError("invalid-credentials")).toBe("unavailable");
  });
});
