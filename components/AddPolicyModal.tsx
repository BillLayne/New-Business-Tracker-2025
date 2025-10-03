import React, { useState, useMemo, useEffect } from 'react';
import { CARRIERS, POLICY_TYPES, ALL_POSSIBLE_REQUIREMENTS, COMMON_REQUIREMENTS } from '../constants';
import { localDataService } from '../services/localDataService';
import { RequirementStatus } from '../types';
import type { CarrierName, Policy, PolicyType, Requirement } from '../types';

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyAdded: () => void;
}

export const AddPolicyModal: React.FC<AddPolicyModalProps> = ({ isOpen, onClose, onPolicyAdded }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [carrier, setCarrier] = useState<CarrierName>(CARRIERS[0]);
  const [policyType, setPolicyType] = useState<PolicyType>(POLICY_TYPES[0]);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReqs, setSelectedReqs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [customReqInput, setCustomReqInput] = useState('');
  const [customReqs, setCustomReqs] = useState<Omit<Requirement, 'id' | 'status' | 'file'>[]>([]);

  const availableRequirements = useMemo(() => {
    const specificReqs = ALL_POSSIBLE_REQUIREMENTS[carrier]?.[policyType] || [];
    
    // Combine specific and common requirements, ensuring no duplicates by name
    const combined = [...specificReqs, ...COMMON_REQUIREMENTS];
    const uniqueReqs = Array.from(new Map(combined.map(item => [item.name, item])).values());
    
    // Sort alphabetically for better UX
    uniqueReqs.sort((a, b) => a.name.localeCompare(b.name));

    return uniqueReqs;
  }, [carrier, policyType]);

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setPolicyNumber('');
    setCarrier(CARRIERS[0]);
    setPolicyType(POLICY_TYPES[0]);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setFollowUpDate('');
    setSelectedReqs(new Set());
    setError(null);
    setCustomReqInput('');
    setCustomReqs([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleRequirementToggle = (reqName: string) => {
    setSelectedReqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reqName)) {
        newSet.delete(reqName);
      } else {
        newSet.add(reqName);
      }
      return newSet;
    });
  };

  const handleAddCustomReq = () => {
    if (customReqInput.trim()) {
      // Prevent duplicates
      if (!customReqs.some(req => req.name.toLowerCase() === customReqInput.trim().toLowerCase())) {
        setCustomReqs([...customReqs, { name: customReqInput.trim(), description: 'Custom requirement' }]);
      }
      setCustomReqInput('');
    }
  };

  const handleRemoveCustomReq = (reqNameToRemove: string) => {
    setCustomReqs(customReqs.filter(req => req.name !== reqNameToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const policyDetails = { clientName, clientEmail, clientPhone, policyNumber, carrier, policyType, effectiveDate, followUpDate };
    
    const selectedFullReqs = availableRequirements
      .filter(req => selectedReqs.has(req.name))
      .map(req => ({
        ...req,
        status: RequirementStatus.OUTSTANDING,
      }));
    
    const customFullReqs = customReqs.map(req => ({
      ...req,
      status: RequirementStatus.OUTSTANDING,
    }));
    
    const allRequirements = [...selectedFullReqs, ...customFullReqs];

    try {
        await localDataService.addPolicy(policyDetails, allRequirements);
        onPolicyAdded();
    } catch(err) {
        console.error("Failed to add policy:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while saving the policy.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Business Policy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Save Failed</p>
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
              <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">Client Email</label>
              <input type="email" id="clientEmail" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700">Client Phone</label>
              <input type="tel" id="clientPhone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700">Policy Number</label>
              <input type="text" id="policyNumber" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">Carrier</label>
              <select id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value as CarrierName)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="policyType" className="block text-sm font-medium text-gray-700">Policy Type</label>
              <select id="policyType" value={policyType} onChange={(e) => setPolicyType(e.target.value as PolicyType)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                {POLICY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">Effective Date</label>
              <input type="date" id="effectiveDate" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">Follow-up Date (Optional)</label>
              <input type="date" id="followUpDate" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
          </div>

          {availableRequirements.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Applicable Requirements</label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                {availableRequirements.map(req => (
                  <div key={req.name} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`req-${req.name}`}
                        type="checkbox"
                        checked={selectedReqs.has(req.name)}
                        onChange={() => handleRequirementToggle(req.name)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                       <label htmlFor={`req-${req.name}`} className="font-medium text-gray-700 cursor-pointer">{req.name}</label>
                       <p className="text-gray-500">{req.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Custom Requirements</label>
            {customReqs.length > 0 && (
              <div className="space-y-2 mb-3 border border-gray-200 rounded-md p-3 bg-gray-50">
                {customReqs.map((req, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded-md shadow-sm">
                    <span className="text-gray-800">{req.name}</span>
                    <button type="button" onClick={() => handleRemoveCustomReq(req.name)} className="text-red-500 hover:text-red-700 font-bold p-1 leading-none text-xl" title="Remove requirement">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customReqInput}
                onChange={(e) => setCustomReqInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomReq();
                  }
                }}
                placeholder="e.g., Photos of cleaned gutters"
                className="flex-grow block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomReq}
                disabled={!customReqInput.trim()}
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
              {isSubmitting ? 'Adding...' : 'Add Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};