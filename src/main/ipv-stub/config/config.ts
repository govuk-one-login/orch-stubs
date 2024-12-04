const expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 1);

export default {
  coreIdentityJWT: {
    sub: "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
    iss: `https://identity.${process.env.ENVIRONMENT}.account.gov.uk/`,
    aud: "YOUR_CLIENT_ID",
    nbf: Date.now(),
    iat: Date.now(),
    exp: expiryDate.valueOf(),
    vot: "P2",
    vtm: `https://oidc.${process.env.ENVIRONMENT === "dev" ? "sandpit" : process.env.ENVIRONMENT}.account.gov.uk/trustmark`,
    vc: {
      type: ["VerifiableCredential", "VerifiableIdentityCredential"],
      credentialSubject: {
        name: [
          {
            validFrom: "2020-03-01",
            nameParts: [
              {
                value: "Alice",
                type: "GivenName",
              },
              {
                value: "Jane",
                type: "GivenName",
              },
              {
                value: "Laura",
                type: "GivenName",
              },
              {
                value: "Doe",
                type: "FamilyName",
              },
            ],
          },
          {
            validUntil: "2020-03-01",
            nameParts: [
              {
                value: "Alice",
                type: "GivenName",
              },
              {
                value: "Jane",
                type: "GivenName",
              },
              {
                value: "Laura",
                type: "GivenName",
              },
              {
                value: "O’Donnell",
                type: "FamilyName",
              },
            ],
          },
        ],
        birthDate: [
          {
            value: "1970-01-01",
          },
        ],
      },
    },
  },
  address: [
    {
      uprn: "10022812929",
      subBuildingName: "FLAT 5",
      buildingName: "WEST LEA",
      buildingNumber: "16",
      dependentStreetName: "KINGS PARK",
      streetName: "HIGH STREET",
      doubleDependentAddressLocality: "EREWASH",
      dependentAddressLocality: "LONG EATON",
      addressLocality: "GREAT MISSENDEN",
      postalCode: "HP16 0AL",
      addressCountry: "GB",
      validFrom: "2022-01-01",
    },
    {
      uprn: "10002345923",
      buildingName: "SAWLEY MARINA",
      streetName: "INGWORTH ROAD",
      dependentAddressLocality: "LONG EATON",
      addressLocality: "NOTTINGHAM",
      postalCode: "BH12 1JY",
      addressCountry: "GB",
      validUntil: "2022-01-01",
    },
  ],
  drivingPermit: [
    {
      expiryDate: "2023-01-18",
      issueNumber: "5",
      issuedBy: "DVLA",
      personalNumber: "DOE99802085J99FG",
    },
  ],
  passport: [
    {
      documentNumber: "1223456",
      icaoIssuerCode: "GBR",
      expiryDate: "2032-02-02",
    },
  ],
  returnCode: [
    {
      code: "B",
    },
    {
      code: "C",
    },
  ],
  socialSecurityRecord: [
    {
      personalNumber: "QQ123456C",
    },
  ],
};
