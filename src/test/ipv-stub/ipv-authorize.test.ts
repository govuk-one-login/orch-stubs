import supertest from "supertest";

const ENCRYPTED_JWT =
  "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.FjFe0CrWw1TU-Q8mt0_RZwh_DFNmKd8gzXqh-rEBN63gInqcvScqDuTEP1GIb12PIAI0WbR1O_2IFuFpIn63BdyomETbn4xloSqkXo12dE-ZpWmMOKMxPGGZ7014W0g-ZS5mnJPTwfRBk2amX-pJuBxdb1GNS340VhMcMBgjjaPuXrrIUxYutXdggDFi3bA34ZVv5lMEdS1isO0Kuo3In42wwNTo8Ex8cnFSRW5WN531onDL5jrv4376ljvuOWcVC3A0sZM8BqtFRAgk14xfERWBrZx87CgFFTH-4ktSK3BBvbgt3TARwkAnj51tIiJJiv2IcZEf65daR7hdQhJmIA.HghVZIsbRTjd6IF_.Ors1HI3cY5dsSzTOykS3PyI4vhdKzgE5qQCCSD3ukNaP-OJxs7awOF-_DOrBanRxd0b1b7wKWH9ZG6c4IQkTwwfvLVvSi44wZg7at7RWfNoCa326UR-wn9kCgAZz5gsDGaAQMoSHQHb1H1w7PgkIDMgGkMJJURGoY3QRqdFfudVlO0DdtTadJ32VWsyjHGfsXlhgXwMv__6YnLtnmhb3t7MZZ2QLwNeK8fePPcL6iHgeR4JyH54OzS_MkPASDGFY9KbXgiogr14U6onphFUyeaj94aC4tHOeuWItqJrwLayn4DT5FGiBcNj9cmYBi_r4297iZ0D4--RPZFCHyyttX-xfi6LEML-KJm-wV72HGtPJ5HFxv7othtHLgaO3ZuVSqkRXojOv167XSta6l9UDQNPiMtjOje2RqtO9PuISvfAXm8tjQs2C6QeBRN-wvetJFwusS0OHse3snOO-eErPeAF7cWc-5hoXzkXIrH8ooUi1qKgQkUR1_8-wrJGV9PvIksm3NVQKn3Y-k9G1DSosQQXpp_fjiy28bLIcY18NU4BAjFz7iwsRRlqIwwl1I2vmb_kz3C4TQuii_8JieExa6jYNrpS0JSzCLbMmo4JYQ3KYU77MBMmrNobPLGIPJt51-ohcVLfvEpm6TxZEJyjvuCTmdPwxfcw86OWrrLQxmTbiL2DI0lEcF3eIVNceHO-9qhJLnVAI54KseuW8gbdTdX51JxdUVYKi8HDzWo6UDIt1tPE9H8WGOBaTS5MbPL8r7NpsFZdabvTDNeGxMFIxaJBx1njt9ga9NpfUNoQBCmF7FLLQxejMZ7ovcwZA6_gDPrzUZBK7eSAy-4jhq-VJapx43CIbmUaQVqLqiE8GFuzEhMeWDUrkq14NbvBMGTfwtBiGa2Kz2gvoXd5jtuIKMy3NqjzsXJ8oRknGBuLzSnyCZEg5oGHbVbMa7HOrzYubtfI992p3BX2rnHWDVUW2zT551pUaSRjvIWA4DARWjMa7TH32b9htXGeDlnY22ys6asxtqwbs5JKaI2pkuWwrHNLZbbWqQRUtznaHoyfaPAL28LkU2F9DWwtAOr6UeLDCZ2KfZ3fUuq8vRjgUX8ls1xyXJrpKiSXTFqlAla2zeCwvyBUWkcf0XW7AOa9Jy98AUhsbYlwP1qr9PdMOlmzOJQMBnzbkWZZJ4XxpvMxhi0F5VG0MkrKB4i_BwTv138yU-V5nNa1VEs7iSKJ7xr3gJQ6MMzNWN-BSXA0eLBYpmbNzKaXFMmcaTaVG0qR6TrSbeAJVGlSrE6i-2ebFYvddf5L6QzUOvw1fPOYzSpYLSW2PqNhrc4silr142orhvQzdsxKM53ydMxyYWJsOb4YwW7rdWTY2G9Uw68EvAWQ3T3PfW7qnLsortQfCMmT2wm3JpInvCRzrOPsphSwZ9-oQoIM0PCV603AQgYhd4dMv5aFjrsP9KVErNML_G11pwsTIvsiJirRm0YlEiH-y1TbfdatJPWtTdUJT6CufExcdGFHgT8V5LOvq_TVMIHQnqNEx11wEwxjuJ2Ngo-03Xdvii0j0WuKnTSCTbhrXz0ZhzBGT9snJywGc0uxjyjOkzulI7-Gi17GLBPICNX7uVB2y0zKqjtL70_lT8GKx2mnz1Qj6mA0kNtAuZkLqs6hBmjvBlB0kb8SmpWPoCnYekwGvO8e0u1iUWpinz8u0naddyYqnaLeIEuy_KsNSw0-3T32NFCxIzN4KhAH15Gt50mAWeResZpIFg05_zEBN-r3Vf8SY6kXM-Y2po75BRehsu9XjSas8r_J36Iy6H6phBeBZDDJKp0vwnaZRROo_51ndgBf72CpcxbkJ1ShapuZyDr_C1C214Lv6MWIhyv408LIz-Qc3LVtsy6aLRtQFumA-PHUVld5VJYWVvs92Dhmp_PHrGdAVlzpqPnTvNM1J3vjHYMn8Wm8NCmKva40_uIukAm5QqDJXF2oiWAjrNDHtWhzNv1SiPRU0JXCmxdbwJ2kY8qszFDLUUcBKzTFzlC8A6Xnf-aXG8ZO-GoOS14ZXKm2TTc58smTv1uH_wDXkb0J94WzKhtfmwDMKTWveAucVUUckgPQeRE-2M0NEg0kfbNP8_mZ6F0jAPlsi6wq5ymVM3lb3kpqrBXsy9xHc5txa6Pb3miCRdrkZZ27YBxHvh4wj7oVMVmmpWWihdXWFKlwJqHfZr-Grt03eEh8Nt9vj1bKILkCizUnTyVEl6yJQmJlP1zR7sjrXGtWI4FvqzPyiNAxd_Lf5rHl7x9U6wJPduRf4X5vE6h41u20RJ4aV1vUoBEGuDCi_Wtf-Zwx6uWk0z6uqIsAj-cI3_HXlgsNHpRGL0JTDTELYHTchnFsSfm4o6dY0fiw2sRsxjmD33UFXzt8Kvw.Gg7HkejW5_COmjaLqzSBtA";
describe("IPV Authorize", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("should return 200 for valid GET request", async () => {
    const response = await api
      .get("/authorize")
      .set("Authorization", "Bearer " + ENCRYPTED_JWT);
    expect(response.statusCode).toBe(200);
  });

  it("should return 302 for valid POST request", async () => {
    const response = await api
      .post("/authorize")
      .set("Authorization", "Bearer " + ENCRYPTED_JWT);
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      "https://oidc.sandpit.account.gov.uk/ipv-callback?code=12345"
    );
  });

  it("should return 400 if token is not present in authorize request", async () => {
    const response = await api.get("/authorize");
    expect(response.statusCode).toBe(400);
  });

  it("should return 500 for invalid token in request", async () => {
    const invalidJwt = "invalid.jwt.token";
    const response = await api
      .get("/authorize")
      .set("Authorization", "Bearer " + invalidJwt);
    expect(response.statusCode).toBe(500);
    expect(response.body).toBe("Decryption failed");
  });
});
