export enum CarrierName {
  NATIONWIDE = 'Nationwide',
  PROGRESSIVE = 'Progressive',
  TRAVELERS = 'Travelers',
  NATIONAL_GENERAL = 'National General',
  NC_GRANGE = 'NC Grange',
  ALAMANCE_FARMERS = 'Alamance Farmers',
  FOREMOST = 'Foremost',
}

export enum PolicyType {
  AUTO = 'Auto',
  HOME = 'Home',
  RENTERS = 'Renters',
  UMBRELLA = 'Umbrella',
}

export enum RequirementStatus {
  OUTSTANDING = 'Outstanding',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  WAIVED = 'Waived',
}

export enum PolicyStatus {
    PENDING_REQUIREMENTS = 'Pending Requirements',
    IN_REVIEW = 'In Review',
    COMPLETE = 'Complete',
    ARCHIVED = 'Archived',
}

export interface Requirement {
  id: string;
  name: string;
  description: string;
  status: RequirementStatus;
  file?: {
    name: string;
    url: string;
  };
}

export interface Policy {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  policyNumber: string;
  carrier: CarrierName;
  policyType: PolicyType;
  effectiveDate: string; // YYYY-MM-DD
  status: PolicyStatus;
  requirements: Requirement[];
}