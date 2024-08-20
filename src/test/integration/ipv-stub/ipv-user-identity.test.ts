import supertest from "supertest";
import { expectedUserIdentity } from "./data/expected-user-identity";

describe("IPV User Identity", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("should return 200 for a get request", async () => {
    const response = await api
      .get("/user-identity")
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(expectedUserIdentity);
  });

  it("should return 405 for a non-get request", async () => {
    const response = await api
      .post("/user-identity")
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(405);
  });
});
