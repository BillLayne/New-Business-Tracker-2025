import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { localDataService } from '../services/localDataService';
import type { Policy } from '../types';
import { PolicyStatus, PolicyType } from '../types';
import { PolicyCard } from './PolicyCard';
import { PolicyDetail } from './PolicyDetail';
import { AddPolicyModal } from './AddPolicyModal';
import { ArchiveBoxIcon } from './icons/StatusIcons';

export const Dashboard: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const fetchPolicies = useCallback(async () => {
    const data = await localDataService.getPolicies();
    setPolicies(data);
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const filteredPolicies = useMemo(() => {
    const getSafeDateValue = (dateString: string): number => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? Infinity : date.getTime();
    };

    const isUrgent = (policy: Policy): boolean => {
      if (policy.status !== PolicyStatus.PENDING_REQUIREMENTS) return false;
      const effectiveDate = new Date(policy.effectiveDate);
      if (isNaN(effectiveDate.getTime())) return false;
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return effectiveDate <= sevenDaysFromNow;
    };
    
    const baseList = showArchived
      ? policies.filter(p => p.status === PolicyStatus.ARCHIVED)
      : policies.filter(p => p.status !== PolicyStatus.ARCHIVED);

    const filtered = baseList.filter(policy => {
      const searchTermLower = searchTerm.toLowerCase();
      return (searchTerm === '' ||
        policy.clientName.toLowerCase().includes(searchTermLower) ||
        policy.policyNumber.toLowerCase().includes(searchTermLower) ||
        policy.carrier.toLowerCase().includes(searchTermLower)) &&
        (filterType === 'All' || policy.policyType === filterType) &&
        (filterStatus === 'All' || policy.status === filterStatus);
    });
    
    if (showArchived) {
      filtered.sort((a, b) => getSafeDateValue(b.effectiveDate) - getSafeDateValue(a.effectiveDate));
    } else {
      filtered.sort((a, b) => {
          const aIsUrgent = isUrgent(a);
          const bIsUrgent = isUrgent(b);
          if (aIsUrgent && !bIsUrgent) return -1;
          if (!aIsUrgent && bIsUrgent) return 1;
          return getSafeDateValue(a.effectiveDate) - getSafeDateValue(b.effectiveDate);
      });
    }

    return filtered;

  }, [policies, searchTerm, filterType, filterStatus, showArchived]);

  const handlePolicySelect = (policy: Policy) => {
    setSelectedPolicy(policy);
  };

  const handleBackToList = () => {
    setSelectedPolicy(null);
  };
  
  const handlePolicyAdded = () => {
    setIsModalOpen(false);
    fetchPolicies();
  };
  
  const handlePolicyUpdate = useCallback((updatedPolicy: Policy) => {
    const oldPolicy = policies.find(p => p.id === updatedPolicy.id);
    if (oldPolicy?.status === PolicyStatus.ARCHIVED && updatedPolicy.status !== PolicyStatus.ARCHIVED) {
      setShowArchived(false); // Switch to active view when a policy is restored
    }
    
    if (updatedPolicy.status === PolicyStatus.ARCHIVED) {
      setSelectedPolicy(null); // Go back to list if archived
    } else {
      setSelectedPolicy(updatedPolicy);
    }
    fetchPolicies(); // Refetch all policies to ensure UI is in sync with storage
  }, [fetchPolicies, policies]);

  const handlePolicyDelete = (policyId: string) => {
    setSelectedPolicy(null);
    fetchPolicies();
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('All');
    setFilterStatus('All');
  };
  
  const handleExport = async () => {
    await localDataService.exportData();
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Are you sure you want to import this file? This will overwrite all your current data.")) {
        event.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await localDataService.importData(content);
        alert("Data imported successfully!");
        fetchPolicies(); // Refresh the view
      } catch (error) {
        alert("Import failed. Please check if the file is a valid backup file.");
        console.error(error);
      } finally {
        event.target.value = ''; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  if (selectedPolicy) {
    return (
      <PolicyDetail 
        policy={selectedPolicy} 
        onBack={handleBackToList} 
        onUpdate={handlePolicyUpdate} 
        onDelete={handlePolicyDelete}
      />
    );
  }

  return (
    <div>
       <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-700">{showArchived ? 'Archived' : 'Active'} Policies ({filteredPolicies.length})</h2>
        <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300"
            >
              Export Data
            </button>
            <button
              onClick={handleImportClick}
              className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-300"
            >
              Import Data
            </button>
            <input type="file" accept=".json" ref={importFileRef} onChange={handleImport} className="hidden" />
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-300 flex items-center"
            >
              <ArchiveBoxIcon className="w-5 h-5 mr-2" />
              {showArchived ? 'View Active' : 'View Archive'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
            >
              + Add New Policy
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:flex-grow">
            <input
                type="text"
                placeholder="Search by Client, Policy #, Carrier..."
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        {!showArchived && (
          <>
            <div className="w-full sm:w-auto">
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="All">All Policy Types</option>
                    {Object.values(PolicyType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
            </div>
            <div className="w-full sm:w-auto">
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    {Object.values(PolicyStatus)
                      .filter(s => s !== PolicyStatus.ARCHIVED && s !== PolicyStatus.COMPLETE)
                      .map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          </>
        )}
        <div className="w-full sm:w-auto">
            <button
                onClick={clearFilters}
                className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
                Clear
            </button>
        </div>
      </div>

      {filteredPolicies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPolicies.map(policy => (
            <PolicyCard key={policy.id} policy={policy} onSelect={handlePolicySelect} />
            ))}
        </div>
      ) : (
         <div className="text-center p-10 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700">{showArchived ? 'No Archived Policies' : 'No policies match your criteria.'}</h3>
            <p className="text-gray-500 mt-2">
              {showArchived ? 'Archived policies will appear here.' : 'Try adding a new policy or adjusting your search/filters.'}
            </p>
        </div>
      )}

      <AddPolicyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPolicyAdded={handlePolicyAdded}
      />
    </div>
  );
};
