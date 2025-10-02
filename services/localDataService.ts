import type { Policy, Requirement } from '../types';
import { PolicyStatus, RequirementStatus } from '../types';

const POLICIES_STORAGE_KEY = 'new-business-tracker-policies';

// --- Helper Functions ---

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getPoliciesFromStorage = (): Policy[] => {
  try {
    const data = localStorage.getItem(POLICIES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse policies from localStorage", error);
    return [];
  }
};

const savePoliciesToStorage = (policies: Policy[]): void => {
  localStorage.setItem(POLICIES_STORAGE_KEY, JSON.stringify(policies));
};

const recalculatePolicyStatus = (policy: Policy): Policy => {
    // Keep ARCHIVED and IN_REVIEW as sticky states that aren't recalculated over.
    // The restore function explicitly changes the status before calling update.
    if (policy.status === PolicyStatus.ARCHIVED || policy.status === PolicyStatus.IN_REVIEW) {
        return policy;
    }

    const allRequirementsMet = (!policy.requirements || policy.requirements.length === 0) ||
        policy.requirements.every(
            r => r.status === RequirementStatus.APPROVED || r.status === RequirementStatus.WAIVED
        );

    // If all requirements are met, auto-archive it. Otherwise, it's pending.
    if (allRequirementsMet) {
        return { ...policy, status: PolicyStatus.ARCHIVED };
    } else {
        return { ...policy, status: PolicyStatus.PENDING_REQUIREMENTS };
    }
};


// --- Service Definition ---

export const localDataService = {
  getPolicies: async (): Promise<Policy[]> => {
    return Promise.resolve(getPoliciesFromStorage());
  },

  addPolicy: async (
    policyDetails: Omit<Policy, 'id' | 'status' | 'requirements' | 'communications'>,
    requirementsToAdd: Omit<Requirement, 'id' | 'file'>[]
  ): Promise<Policy> => {
    const policies = getPoliciesFromStorage();
    
    const newRequirements: Requirement[] = requirementsToAdd.map(req => ({
      ...req,
      id: generateUUID(),
    }));

    const newPolicy: Policy = {
      id: generateUUID(),
      ...policyDetails,
      status: newRequirements.length > 0 ? PolicyStatus.PENDING_REQUIREMENTS : PolicyStatus.COMPLETE,
      requirements: newRequirements,
      communications: [],
    };
    
    // Recalculate to archive immediately if no requirements were added.
    const finalNewPolicy = recalculatePolicyStatus(newPolicy);

    savePoliciesToStorage([...policies, finalNewPolicy]);
    return Promise.resolve(finalNewPolicy);
  },

  updatePolicy: async (updatedPolicy: Policy, skipRecalculate = false): Promise<Policy> => {
    const finalPolicy = skipRecalculate
      ? updatedPolicy
      : recalculatePolicyStatus(updatedPolicy);

    const policies = getPoliciesFromStorage();
    const updatedPolicies = policies.map(p => 
      p.id === finalPolicy.id ? finalPolicy : p
    );
    savePoliciesToStorage(updatedPolicies);
    return Promise.resolve(finalPolicy);
  },

  deletePolicy: async (policyId: string): Promise<void> => {
    const policies = getPoliciesFromStorage();
    const updatedPolicies = policies.filter(p => p.id !== policyId);
    savePoliciesToStorage(updatedPolicies);
    return Promise.resolve();
  },

  exportData: async (): Promise<void> => {
    const policies = getPoliciesFromStorage();
    const dataStr = JSON.stringify(policies, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `new_business_tracker_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return Promise.resolve();
  },

  importData: async (jsonContent: string): Promise<void> => {
    try {
      const policies = JSON.parse(jsonContent);
      if (!Array.isArray(policies)) {
        throw new Error("Imported file is not a valid policy array.");
      }
      // Basic validation can be expanded here
      savePoliciesToStorage(policies);
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to import data:", error);
      throw new Error("Failed to parse or validate the backup file.");
    }
  },
};