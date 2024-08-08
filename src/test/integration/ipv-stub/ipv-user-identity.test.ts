import supertest from "supertest";
import { expectedUserIdentity } from "./data/expected-user-identity";

describe("IPV User Info", () => {
  const api = supertest("http://localhost:3000/");

  it("should return 200 for a get request", async () => {
    const response = await api.get("/user-identity");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(expectedUserIdentity);
    expect(response.headers["Content-Type"]).toBe("application/json");
  });

  it("should return 405 for a non-get request", async () => {
    const response = await api.post("/user-identity");
    expect(response.statusCode).toBe(405);
    expect(response.headers["Content-Type"]).toBe("application/json");
  });
});
