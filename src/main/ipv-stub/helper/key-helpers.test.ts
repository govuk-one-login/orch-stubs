import * as jose from "jose";
import { getOrchJwks } from "./key-helpers";
import localParams from "../../../../parameters.json";

describe("Key helpers tests", () => {
  describe("get orch JWKS tests", () => {
    beforeEach(() => {
      process.env["DUMMY_ORCH_JWKS"] = "";
    });
    it("should use dummy JWKS data if present", () => {
      const localJwkSetSpy = jest.spyOn(jose, "createLocalJWKSet");
      process.env["DUMMY_ORCH_JWKS"] = localParams.Parameters.DUMMY_ORCH_JWKS;
      getOrchJwks();
      expect(localJwkSetSpy).toHaveBeenCalledWith(
        JSON.parse(localParams.Parameters.DUMMY_ORCH_JWKS)
      );
    });
    it("should use JWKS URL if dummy data not present", () => {
      const remoteJwkSetSpy = jest.spyOn(jose, "createRemoteJWKSet");
      process.env["ORCH_PUBLIC_SIGNING_JWKS_URL"] =
        "http://test.example.com/.well-known/jwks.json";
      getOrchJwks();
      expect(remoteJwkSetSpy).toHaveBeenCalledWith(
        new URL("http://test.example.com/.well-known/jwks.json")
      );
    });
  });
});
