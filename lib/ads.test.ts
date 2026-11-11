import { describe, expect, it } from "vitest";
import { adsTxt, adsenseClient } from "./ads";

describe("AdSense settings", () => {
  it("accepts only a well-formed publisher ID", () => {
    expect(adsenseClient("ca-pub-1234567890123456")).toBe("ca-pub-1234567890123456");
    expect(adsenseClient(" ca-pub-1234567890123456 ")).toBe("ca-pub-1234567890123456");
    expect(adsenseClient("pub-1234567890123456")).toBeNull();
    expect(adsenseClient("ca-pub-123")).toBeNull();
    expect(adsenseClient("")).toBeNull();
    expect(adsenseClient(undefined)).toBeNull();
  });
  it("writes the Google line in ads.txt without the ca- prefix", () => {
    expect(adsTxt("ca-pub-1234567890123456")).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });
  it("writes only a comment until the ID is set", () => {
    expect(adsTxt(null).startsWith("#")).toBe(true);
  });
});
