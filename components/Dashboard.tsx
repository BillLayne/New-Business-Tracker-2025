import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { localDataService } from '../services/localDataService';
import type { Policy } from '../types';
import { PolicyStatus, PolicyType } from '../types';
import type { SaveStatus } from '../App';
import { PolicyCard } from './PolicyCard';
import { PolicyDetail } from './PolicyDetail';
import { AddPolicyModal } from './AddPolicyModal';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { ArchiveBoxIcon } from './icons/StatusIcons';

interface DashboardProps {
  setSaveStatus: (status: SaveStatus) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setSaveStatus }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const saveStatusTimeoutRef = useRef<number | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileContent, setImportFileContent] = useState('');

  const fetchPolicies = useCallback(async () => {
    const data = await localDataService.getPolicies();
    setPolicies(data);
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const showSaveStatus = useCallback(() => {
    setSaveStatus('saving');
    setTimeout(() => {
        setSaveStatus('saved');
        if (saveStatusTimeoutRef.current) {
            clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = window.setTimeout(() => {
            setSaveStatus('idle');
        }, 2000);
    }, 300);
  }, [setSaveStatus]);

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
    showSaveStatus();
    fetchPolicies();
  };
  
  const handlePolicyUpdate = useCallback(async (updatedPolicy: Policy, skipRecalculate = false) => {
    showSaveStatus();
    try {
        const savedPolicy = await localDataService.updatePolicy(updatedPolicy, skipRecalculate);
        
        const oldPolicy = policies.find(p => p.id === savedPolicy.id);
        if (oldPolicy?.status === PolicyStatus.ARCHIVED && savedPolicy.status !== PolicyStatus.ARCHIVED) {
          setShowArchived(false); // Switch to active view when a policy is restored
        }
        
        if (savedPolicy.status === PolicyStatus.ARCHIVED) {
          setSelectedPolicy(null); // Go back to list if archived
        } else {
          setSelectedPolicy(savedPolicy);
        }
        fetchPolicies(); // Refetch all policies to ensure UI is in sync with storage
    } catch (error) {
        console.error("Failed to update policy:", error);
        alert("Failed to save changes. Please try again.");
    }
  }, [fetchPolicies, policies, showSaveStatus]);

  const handlePolicyDelete = async (policyId: string) => {
    showSaveStatus();
    try {
        await localDataService.deletePolicy(policyId);
        setSelectedPolicy(null);
        fetchPolicies();
    } catch (error) {
        console.error("Failed to delete policy:", error);
        alert("Failed to delete policy. Please try again.");
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('All');
    setFilterStatus('All');
  };
  
  const handleExport = async () => {
    await localDataService.exportData();
  };

  const handleImportButtonClick = () => {
    importFileRef.current?.click();
  };
  
  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportFile(file);
      setImportFileContent(content);
      setIsImportModalOpen(true);
    };
    reader.onerror = () => {
      alert("Error reading file.");
    }
    reader.readAsText(file);
    event.target.value = ''; 
  };
  
  const handleConfirmImport = async () => {
    if (!importFileContent) return;

    setIsImportModalOpen(false);
    showSaveStatus();

    try {
      await localDataService.importData(importFileContent);
      fetchPolicies();
    } catch (error) {
      alert(`Import failed. Please check if the file is a valid backup file. Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
    } finally {
      setImportFile(null);
      setImportFileContent('');
    }
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
              onClick={handleImportButtonClick}
              className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-300"
            >
              Import Data
            </button>
            <input type="file" accept=".json" ref={importFileRef} onChange={handleImportFileSelect} className="hidden" />
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

      <ImportConfirmationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
        file={importFile}
        fileContent={importFileContent}
      />

      <AddPolicyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPolicyAdded={handlePolicyAdded}
      />
    </div>
  );
};