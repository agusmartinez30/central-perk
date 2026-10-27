import { describe, expect, it } from "vitest";
import {
  MFA_CODE_LENGTH,
  getPasswordRequirements,
  isPasswordStrong,
  isValidEmail,
  isValidMfaCode,
  sanitizeMfaCode,
  validateResetPassword,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts work emails, ignoring surrounding whitespace", () => {
    expect(isValidEmail("turno@cafecentral.com")).toBe(true);
    expect(isValidEmail("  tu.correo@restaurante.com.ar ")).toBe(true);
  });

  it("rejects empty or malformed values", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("turno")).toBe(false);
    expect(isValidEmail("turno@")).toBe(false);
    expect(isValidEmail("turno@cafe")).toBe(false);
    expect(isValidEmail("tu rno@cafe.com")).toBe(false);
  });
});

describe("getPasswordRequirements", () => {
  it("lists the rules of the reset screen in order", () => {
    expect(getPasswordRequirements("").map((rule) => rule.label)).toEqual([
      "6 caracteres como mínimo",
      "Se admiten frases largas",
    ]);
  });

  it("marks nothing as met for an empty password", () => {
    expect(getPasswordRequirements("").every((rule) => !rule.met)).toBe(true);
  });

  it("requires at least 6 characters", () => {
    const short = getPasswordRequirements("luna7");
    expect(short.find((rule) => rule.id === "length")?.met).toBe(false);
    const long = getPasswordRequirements("luna73");
    expect(long.find((rule) => rule.id === "length")?.met).toBe(true);
  });

});

describe("isPasswordStrong", () => {
  it("is true only when every requirement is met", () => {
    expect(isPasswordStrong("Una frase larga y segura")).toBe(true);
    expect(isPasswordStrong("corta")).toBe(false);
  });

  it("does not judge how guessable a long enough password is", () => {
    for (const password of ["123456", "aaaaaa", "contraseña", "cafecentral"]) {
      expect(isPasswordStrong(password), password).toBe(true);
    }
  });
});

describe("validateResetPassword", () => {
  it("returns null for a strong, confirmed password", () => {
    expect(validateResetPassword("Una frase larga y segura", "Una frase larga y segura")).toBeNull();
  });

  it("reports unmet requirements before a mismatch", () => {
    expect(validateResetPassword("corta", "otra")).toBe("requirements");
  });

  it("reports a confirmation mismatch", () => {
    expect(validateResetPassword("Una frase larga y segura", "Una frase larga")).toBe("mismatch");
  });
});

describe("MFA code", () => {
  it("has six digits", () => {
    expect(MFA_CODE_LENGTH).toBe(6);
  });

  it("keeps only digits, up to six", () => {
    expect(sanitizeMfaCode("12a3 45-678")).toBe("123456");
    expect(sanitizeMfaCode("12")).toBe("12");
  });

  it("validates exactly six digits", () => {
    expect(isValidMfaCode("123456")).toBe(true);
    expect(isValidMfaCode("12345")).toBe(false);
    expect(isValidMfaCode("1234567")).toBe(false);
    expect(isValidMfaCode("12345a")).toBe(false);
  });
});
