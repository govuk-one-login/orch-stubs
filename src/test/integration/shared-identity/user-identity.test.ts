import {
  putUserIdentity,
  resetUserIdentityTable,
} from "../helper/dynamo-helper.ts";
import { USER_IDENTITY } from "../../../main/shared-identity/data/identity-dummy-constants.ts";
import { handler } from "../../../main/shared-identity/handler/user-identity.ts";
import { createApiGatewayEvent } from "../util.ts";

const TOKEN = "SEGyn3duzJCo5GezC4XZQKJsMek8X749Foc5V3XpK4KHsA_9"; // pragma: allowlist secret

describe("Identity User Identity", () => {
  beforeEach(async () => {
    vi.stubEnv("IDENTITY_STUB", "IpvStub");
    await setUpUserIdentity();
  });

  afterEach(async () => {
    vi.stubEnv("IDENTITY_STUB", "IpvStub");
    await resetUserIdentityTable();
  });

  it("should return 200 for a get request", async () => {
    const response = await handler(
      createApiGatewayEvent("GET", null!, null!, {
        Authorization: `Bearer ${TOKEN}`,
      }),
      null!,
      null!
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject(USER_IDENTITY);
  });

  it("should return 405 for a non-get request", async () => {
    const response = await handler(
      createApiGatewayEvent("POST", null!, null!, {
        Authorization: `Bearer ${TOKEN}`,
      }),
      null!,
      null!
    );

    expect(response.statusCode).toBe(405);
  });

  it("should return 500 if dynamo throws error when getting user identity", async () => {
    // This changes the table name that the tests use
    // which causes dynamo to throw a table not found exception
    vi.stubEnv("IDENTITY_STUB", "not-a-stub");

    const response = await handler(
      createApiGatewayEvent("GET", null!, null!, {
        Authorization: `Bearer ${TOKEN}`,
      }),
      null!,
      null!
    );

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toStrictEqual({
      message:
        "dynamoDb error: ResourceNotFoundException: Cannot do operations on a non-existent table",
    });
  });

  it("should return 500 if dynamo cannot find user identity by access token", async () => {
    await resetUserIdentityTable();

    const response = await handler(
      createApiGatewayEvent("GET", null!, null!, {
        Authorization: `Bearer ${TOKEN}`,
      }),
      null!,
      null!
    );

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "Access token not found in DB, or is expired",
    });
  });

  async function setUpUserIdentity(): Promise<void> {
    await putUserIdentity(TOKEN, USER_IDENTITY);
  }
});
