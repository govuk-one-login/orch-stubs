export interface UserIdentity {
  sub: string;
  vot: string;
  vtm: string;
  "https://vocab.account.gov.uk/v1/credentialJWT": string[];
  "https://vocab.account.gov.uk/v1/coreIdentity": CoreIdentity;
  "https://vocab.account.gov.uk/v1/address"?: Address[];
  "https://vocab.account.gov.uk/v1/drivingPermit"?: DrivingPermit[];
  "https://vocab.account.gov.uk/v1/socialSecurityRecord"?: SocialSecurityRecord[];
  "https://vocab.account.gov.uk/v1/passport"?: Passport[];
  "https://vocab.account.gov.uk/v1/returnCode"?: ReturnCode[];
}

interface CoreIdentity {
  name: Name[];
  birthDate: BirthDate[];
}

interface Name {
  nameParts: NamePart[];
}

interface NamePart {
  type: string;
  value: string;
}

interface BirthDate {
  value: string;
}

interface Address {
  addressCountry: string;
  uprn: string | null;
  buildingName: string;
  streetName: string;
  postalCode: string;
  buildingNumber: string;
  addressLocality: string;
  validFrom: string;
}

interface DrivingPermit {
  personalNumber: string;
  fullAddress: string;
  issueNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
}

interface SocialSecurityRecord {
  socialSecurityRecord: SocialSecurityRecordEntry[];
}

interface SocialSecurityRecordEntry {
  personalNumber: string;
}

interface Passport {
  documentNumber: string;
  expiryDate: string;
}

interface ReturnCode {
  code: string;
}
