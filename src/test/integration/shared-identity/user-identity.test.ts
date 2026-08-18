import {
  putUserIdentity,
  resetUserIdentityTable,
} from "../helper/dynamo-helper.ts";
import { USER_IDENTITY } from "../../../main/shared-identity/data/identity-dummy-constants.ts";
import {
  createHandler,
  ipvUserIdentityHandler as handler,
} from "../../../main/shared-identity/handler/user-identity.ts";
import { createApiGatewayEvent } from "../util.ts";

const TOKEN = "SEGyn3duzJCo5GezC4XZQKJsMek8X749Foc5V3XpK4KHsA_9"; // pragma: allowlist secret
const IDENTITY_STUB_NAME = "IpvStub";

describe("Identity User Identity", () => {
  beforeEach(async () => {
    await setUpUserIdentity(IDENTITY_STUB_NAME);
  });

  afterEach(async () => {
    await resetUserIdentityTable(IDENTITY_STUB_NAME);
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
    // This changes the handler to use a different table name that the tests use
    // which causes dynamo to throw a table not found exception
    const wrongHandler = createHandler("not-a-stub");
    const response = await wrongHandler(
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
    await resetUserIdentityTable(IDENTITY_STUB_NAME);

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

  async function setUpUserIdentity(identityStubName: string): Promise<void> {
    await putUserIdentity(identityStubName, TOKEN, USER_IDENTITY);
  }
});
