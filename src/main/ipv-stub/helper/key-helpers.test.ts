import * as jose from "jose";
import { getOrchJwks } from "./key-helpers.ts";
import localParams from "../../../../parameters.json" with { type: "json" };
import { createRemoteJWKSet } from "jose";

vi.mock(import("jose"), async (importActual) => {
  const actual = await importActual<typeof import("jose")>();
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(),
  };
});

describe("Key helpers tests", () => {
  describe("get orch JWKS tests", () => {
    beforeEach(() => {
      process.env.DUMMY_JWKS = "";
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should use dummy JWKS data if present", () => {
      const localJwkSetSpy = vi.spyOn(jose, "createLocalJWKSet");
      process.env.DUMMY_JWKS = localParams.Parameters.DUMMY_JWKS;
      getOrchJwks();

      expect(localJwkSetSpy).toHaveBeenCalledWith(
        JSON.parse(localParams.Parameters.DUMMY_JWKS)
      );
    });

    it("should use JWKS URL if dummy data not present", () => {
      const mockedCreateRemoteJWKSet = vi.mocked(createRemoteJWKSet);
      process.env.ORCH_PUBLIC_SIGNING_JWKS_URL =
        "http://test.example.com/.well-known/jwks.json";
      getOrchJwks();

      expect(mockedCreateRemoteJWKSet).toHaveBeenCalledWith(
        new URL("http://test.example.com/.well-known/jwks.json"),
        {
          timeoutDuration: 10 * 1000,
        }
      );
    });
  });
});
