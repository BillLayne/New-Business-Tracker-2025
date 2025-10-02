import { CarrierName, PolicyType } from './types';
import type { Requirement } from './types';

export const CARRIERS = Object.values(CarrierName);
export const POLICY_TYPES = Object.values(PolicyType);

export const ALL_POSSIBLE_REQUIREMENTS: Record<CarrierName, Record<PolicyType, Omit<Requirement, 'id' | 'status' | 'file'>[]>> = {
  [CarrierName.NATIONWIDE]: {
    [PolicyType.AUTO]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
      { name: 'Prior Proof of Insurance', description: 'Declarations page from previous carrier.' },
      { name: 'Driver\'s License Photos', description: 'Photos of all listed drivers\' licenses.' },
      { name: 'Signed Draft Form', description: 'If policy is paid via EFT/bank draft.' },
      { name: 'VIN Verification', description: 'For full coverage on older vehicles.' },
      { name: 'Good Student Proof', description: 'For drivers eligible for good student discount.' },
    ],
    [PolicyType.HOME]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
      { name: 'Signed Amendments', description: 'Any signed endorsements or policy changes.' },
      { name: '4-Point Inspection', description: 'For homes older than 30 years.' },
      { name: 'Wind Mitigation Report', description: 'For potential windstorm discounts.' },
      { name: 'Alarm Certificate', description: 'If central station alarm discount is applied.' },
      { name: 'Property Photos', description: 'Front, back, and both sides of the dwelling.' },
      { name: 'Proof of Updates', description: 'Documentation for updated roof, electrical, plumbing.' },
    ],
    [PolicyType.RENTERS]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
    ],
    [PolicyType.UMBRELLA]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
      { name: 'Underlying Policy Declarations', description: 'Proof of underlying auto and home policies.' },
    ],
  },
  [CarrierName.PROGRESSIVE]: {
    [PolicyType.AUTO]: [
      { name: 'Signed Application', description: 'E-signed application is required.' },
      { name: 'Payment Confirmation', description: 'Proof of down payment.' },
      { name: 'Driver Exclusion Form', description: 'If excluding a household member.' },
    ],
    [PolicyType.HOME]: [
      { name: 'Signed Application', description: 'E-signed application is required.' },
      { name: 'Inspection Photos', description: 'Photos may be requested by underwriting.' },
    ],
    [PolicyType.RENTERS]: [
      { name: 'Signed Application', description: 'E-signed application is required.' },
    ],
    [PolicyType.UMBRELLA]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
    ],
  },
  [CarrierName.TRAVELERS]: {
    [PolicyType.AUTO]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
      { name: 'VIN Verification', description: 'Photo of vehicle VIN plate.' },
    ],
    [PolicyType.HOME]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
      { name: 'Alarm Certificate', description: 'For monitored security system discount.' },
      { name: 'Roof Age Documentation', description: 'Proof of roof replacement if newer than dwelling.' },
      { name: 'Jewelry Appraisal', description: 'For scheduling high-value jewelry.' },
    ],
     [PolicyType.RENTERS]: [
      { name: 'Signed Application', description: 'E-signed application is required.' },
    ],
    [PolicyType.UMBRELLA]: [
      { name: 'Signed Application', description: 'E-signed or wet-signed application.' },
    ],
  },
  // Simplified for other carriers for brevity
  [CarrierName.NATIONAL_GENERAL]: {
    [PolicyType.AUTO]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.HOME]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.RENTERS]: [{ name: 'Signed Application', description: 'E-signed application is required.' }],
    [PolicyType.UMBRELLA]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
  },
  [CarrierName.NC_GRANGE]: {
    [PolicyType.AUTO]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.HOME]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.RENTERS]: [{ name: 'Signed Application', description: 'E-signed application is required.' }],
    [PolicyType.UMBRELLA]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
  },
  [CarrierName.ALAMANCE_FARMERS]: {
    [PolicyType.AUTO]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.HOME]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.RENTERS]: [{ name: 'Signed Application', description: 'E-signed application is required.' }],
    [PolicyType.UMBRELLA]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
  },
  [CarrierName.FOREMOST]: {
    [PolicyType.AUTO]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.HOME]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
    [PolicyType.RENTERS]: [{ name: 'Signed Application', description: 'E-signed application is required.' }],
    [PolicyType.UMBRELLA]: [{ name: 'Signed Application', description: 'E-signed or wet-signed application.' }],
  },
};

export const COMMON_REQUIREMENTS: Omit<Requirement, 'id' | 'status' | 'file'>[] = [
  { name: 'Application', description: 'General policy application document.' },
  { name: 'Driver Exclusion', description: 'Form to exclude a household member or driver.' },
  { name: 'Draft Form', description: 'Authorization for electronic funds transfer (EFT).' },
  { name: 'Prior Insurance', description: 'Proof of prior insurance coverage (e.g., declarations page).' },
  { name: 'Other', description: 'A non-standard or miscellaneous requirement.' },
];
