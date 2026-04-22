import { CryptoKey, importPKCS8 } from "jose";
import {
  createJwt,
  createListOfMissingMockClaims,
  createMockClaims,
  getWrongPrivateKey,
} from "../test-helper/test-data.ts";
import { validateClaims } from "./jwt-helper.ts";
import { Claims } from "./claims-config.ts";
import { mockEnvVariableSetup } from "../test-helper/test-setup.ts";
import { CodedError } from "../../helper/result-helper.ts";
import localParams from "../../../../parameters.json" with { type: "json" };

describe("JWT service", () => {
  let claims: Claims;
  let privateKey: CryptoKey;
  let wrongPrivateKey: CryptoKey;
  let validJwt: string;
  const listOfMissingClaims: (string | Claims)[][] =
    createListOfMissingMockClaims();

  beforeAll(async () => {
    process.env.DUMMY_JWKS = localParams.Parameters.DUMMY_JWKS;
    privateKey = await importPKCS8(
      localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY,
      "ES256"
    );
    claims = createMockClaims();
    wrongPrivateKey = await getWrongPrivateKey();
    validJwt = await createJwt(createMockClaims(), privateKey);
    mockEnvVariableSetup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Validate claims", () => {
    it("should return payload from valid JWT", async () => {
      const result = await validateClaims(validJwt);

      expect(result).toStrictEqual(claims);
    });

    it("should consider a jwt with a reautheticate claim as valid", async () => {
      const jwtWithReautheticateClaim = createMockClaims();
      jwtWithReautheticateClaim.reauthenticate = "123456";
      const jwt = await createJwt(jwtWithReautheticateClaim, privateKey);

      const result = await validateClaims(jwt);

      expect(result).toStrictEqual(jwtWithReautheticateClaim);
    });

    describe("Validate jwt", () => {
      it("should throw an error when passed non-JWT format", async () => {
        const action = async () => await validateClaims("a");

        await expect(action).rejects.toThrow("Invalid Compact JWS");
      });

      it("should throw error when header incorrect", async () => {
        const [, payload, sig] = validJwt.split(".");
        const modified = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.${sig}`;
        const action = async () => await validateClaims(modified);

        await expect(action).rejects.toThrow(CodedError);
      });

      it("should throw error when jwt payload changed", async () => {
        const [header, , sig] = validJwt.split(".");

        const modified = `${header}.eyJjbGllbnQtbmFtZSI6ImRpLWF1dGgtc3R1Yi1yZWx5aW5nLXBhcnR5LXNhbmRwaXQifQ.${sig}`;
        const action = async () => await validateClaims(modified);

        await expect(action).rejects.toThrow("signature verification failed");
      });

      it("should throw error when jwt isn't signed with the correct public key", async () => {
        const JwtWrongSig = await createJwt(
          createMockClaims(),
          wrongPrivateKey
        );

        const action = async () => await validateClaims(JwtWrongSig);

        await expect(action).rejects.toThrow("signature verification failed");
      });

      it("should throw error when jwt contains invalid claim object", async () => {
        const claims = createMockClaims();
        claims.claim = "not a json";

        const jwtWithInvalidClaimObject = await createJwt(claims, privateKey);

        const action = async () =>
          await validateClaims(jwtWithInvalidClaimObject);

        await expect(action).rejects.toThrow(
          "claim object is not a valid json object"
        );
      });

      it("should pass validation when jwt does not contain claim object", async () => {
        const claims = createMockClaims();
        delete claims.claim;

        const jwtWithoutClaimObject = await createJwt(claims, privateKey);
        const result = await validateClaims(jwtWithoutClaimObject);

        expect(result).toStrictEqual(claims);
      });
    });

    describe("Validate Generic Claims", () => {
      afterEach(() => {
        claims = createMockClaims();
      });

      it.each(listOfMissingClaims)(
        "should throw error if missing %s claims",
        async (missingClaim, listOfClaims) => {
          const jwtMissingClaim = await createJwt(listOfClaims, privateKey);
          const action = async () => await validateClaims(jwtMissingClaim);

          await expect(action).rejects.toThrow(
            `missing required \"${missingClaim as string}\" claim`
          );
        }
      );

      it("should throw error if Token expired", async () => {
        const now: number = Math.floor(new Date().getTime() / 1000);
        claims.exp = now - 1000;
        const expiredJwt = await createJwt(claims, privateKey);
        const action = async () => await validateClaims(expiredJwt);

        await expect(action).rejects.toThrow(
          '"exp" claim timestamp check failed'
        );
      });

      it("should throw error if Token before nbf timestamp", async () => {
        const now: number = Math.floor(new Date().getTime() / 1000);
        claims.nbf = now + 1000;
        const nbfJwt = await createJwt(claims, privateKey);
        const action = async () => await validateClaims(nbfJwt);

        await expect(action).rejects.toThrow(
          '"nbf" claim timestamp check failed'
        );
      });
    });
  });
});
