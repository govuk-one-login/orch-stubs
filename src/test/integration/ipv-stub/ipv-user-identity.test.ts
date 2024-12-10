import {
  putUserIdentity,
  resetUserIdentityTable,
} from "./helper/dynamo-helper";
import { USER_IDENTITY } from "../../../main/ipv-stub/data/ipv-dummy-constants";
import { handler } from "../../../main/ipv-stub/ipv-user-identity";
import { createApiGatewayEvent } from "../util";

const TOKEN = "SEGyn3duzJCo5GezC4XZQKJsMek8X749Foc5V3XpK4KHsA_9";

beforeEach(setUpUserIdentity);
afterEach(resetUserIdentityTable);

describe("IPV User Identity", () => {
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
});

async function setUpUserIdentity(): Promise<void> {
  await putUserIdentity(TOKEN, USER_IDENTITY);
}
