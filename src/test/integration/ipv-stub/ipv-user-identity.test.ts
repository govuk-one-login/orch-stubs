import supertest from "supertest";
import {
  createUserIdentityTable,
  putUserIdentity,
  resetUserIdentityTable,
} from "./helper/dynamo-helper";
import { getLocalEndpoint } from "../../../main/aws-config";
import { USER_IDENTITY } from "../../../main/ipv-stub/data/ipv-dummy-constants";

const TOKEN = "SEGyn3duzJCo5GezC4XZQKJsMek8X749Foc5V3XpK4KHsA_9";

beforeEach(async () => {
  await createUserIdentityTable();
  await setUpUserIdentity();
});
afterEach(resetUserIdentityTable);

describe("IPV User Identity", () => {
  const api = supertest(getLocalEndpoint(false, 3001));

  it("should return 200 for a get request", async () => {
    const response = await api
      .get("/user-identity")
      .set("Authorization", `Bearer ${TOKEN}`)
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(USER_IDENTITY);
  });

  it("should return 405 for a non-get request", async () => {
    const response = await api
      .post("/user-identity")
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(405);
  });
});

async function setUpUserIdentity(): Promise<void> {
  await putUserIdentity(TOKEN, USER_IDENTITY);
}
