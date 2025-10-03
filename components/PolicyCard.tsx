import React, { useMemo } from 'react';
import type { Policy } from '../types';
import { RequirementStatus, PolicyStatus } from '../types';
import { StatusIcon, EmailIcon, PhoneIcon, SignatureIcon, CameraIcon } from './icons/StatusIcons';

interface PolicyCardProps {
  policy: Policy;
  onSelect: (policy: Policy) => void;
}

const formatDateProximity = (dateString: string): { text: string; color: string } => {
  if (!dateString) return { text: 'No Date', color: 'bg-gray-100 text-gray-800' };

  const effectiveDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  // The effectiveDate from the input is treated as local time.
  // We need to create a UTC date from its components to avoid timezone shifts.
  const effectiveDateUTC = new Date(Date.UTC(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate()));

  const diffTime = effectiveDateUTC.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Past Due', color: 'bg-gray-100 text-gray-800 font-semibold' };
  }
  if (diffDays === 0) {
    return { text: 'Today', color: 'bg-red-100 text-red-800 font-bold' };
  }
  if (diffDays <= 7) {
    return { text: `in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'bg-red-100 text-red-800 font-semibold' };
  }
  if (diffDays <= 30) {
    const weeks = Math.round(diffDays / 7);
    return { text: `in ${weeks} wk${weeks > 1 ? 's' : ''}`, color: 'bg-yellow-100 text-yellow-800 font-semibold' };
  }
  const months = Math.round(diffDays / 30);
  return { text: `in ${months} mo+`, color: 'bg-green-100 text-green-800' };
};

const formatFollowUpDateProximity = (dateString?: string): { text: string; color: string } | null => {
  if (!dateString) return null;

  const followUpDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const followUpDateUTC = new Date(Date.UTC(followUpDate.getFullYear(), followUpDate.getMonth(), followUpDate.getDate()));

  const diffTime = followUpDateUTC.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Due ${-diffDays} day${-diffDays > 1 ? 's' : ''} ago`, color: 'bg-red-200 text-red-900 font-bold' };
  }
  if (diffDays === 0) {
    return { text: 'Due Today', color: 'bg-orange-200 text-orange-900 font-bold' };
  }
  if (diffDays <= 7) {
    return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'bg-orange-100 text-orange-800 font-semibold' };
  }
  
  // Don't show if it's far out to avoid clutter
  return null; 
};

export const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onSelect }) => {
  const totalRequirements = policy.requirements.length;
  const completedRequirements = policy.requirements.filter(
    r => r.status === RequirementStatus.APPROVED || r.status === RequirementStatus.WAIVED
  ).length;
  const progress = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 100;

  const outstandingRequirements = useMemo(() => 
    policy.requirements.filter(
      r => r.status === RequirementStatus.OUTSTANDING || r.status === RequirementStatus.REJECTED
    ), [policy.requirements]);
    
  const dateProximity = useMemo(() => formatDateProximity(policy.effectiveDate), [policy.effectiveDate]);
  const followUpProximity = useMemo(() => formatFollowUpDateProximity(policy.followUpDate), [policy.followUpDate]);

  const isUrgent = useMemo((): boolean => {
    if (policy.status !== PolicyStatus.PENDING_REQUIREMENTS) {
      return false;
    }

    const isDateUrgent = (dateString?: string): boolean => {
        if (!dateString) return false;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;
        
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(0,0,0,0);
        
        return date < sevenDaysFromNow;
    }

    return isDateUrgent(policy.effectiveDate) || isDateUrgent(policy.followUpDate);
  }, [policy.effectiveDate, policy.followUpDate, policy.status]);

  const getStatusColor = () => {
    switch(policy.status) {
        case PolicyStatus.PENDING_REQUIREMENTS: return 'border-red-500';
        case PolicyStatus.IN_REVIEW: return 'border-yellow-500';
        case PolicyStatus.ARCHIVED: return 'border-gray-400';
        default: return 'border-gray-300';
    }
  }
  
  const subject = encodeURIComponent(`Regarding Your Insurance Policy: ${policy.policyNumber} - ${policy.clientName}`);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${policy.clientEmail}&su=${subject}`;

  return (
    <div
      onClick={() => onSelect(policy)}
      className={`${isUrgent ? 'bg-red-50' : 'bg-white'} rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer border-l-4 flex flex-col ${getStatusColor()} ${policy.status === PolicyStatus.ARCHIVED ? 'opacity-70' : ''}`}
    >
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-blue-600">{policy.carrier}</p>
            <h3 className="text-lg font-bold text-gray-800 truncate">{policy.clientName}</h3>
            <p className="text-sm text-gray-500">{policy.policyNumber}</p>

          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <StatusIcon status={policy.status} />
            <span>{policy.status}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">{policy.policyType} Policy</p>
            <div className="flex flex-col items-end gap-1 text-right">
              {policy.status !== PolicyStatus.ARCHIVED && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${dateProximity.color}`}>
                  Eff: {dateProximity.text}
                </span>
              )}
              {policy.status !== PolicyStatus.ARCHIVED && followUpProximity && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${followUpProximity.color}`}>
                  Follow-up: {followUpProximity.text}
                </span>
              )}
            </div>
        </div>
        {policy.status !== PolicyStatus.ARCHIVED && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-600">Requirements Progress</span>
                <span className="text-xs font-semibold text-gray-600">{completedRequirements}/{totalRequirements}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
                ></div>
            </div>
          </div>
        )}
        {policy.status !== PolicyStatus.ARCHIVED && outstandingRequirements.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Outstanding</h4>
            <ul className="space-y-1">
              {outstandingRequirements.map(req => (
                <li key={req.id} className="flex items-center text-sm text-gray-700">
                  <StatusIcon status={req.status} className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate" title={req.name}>{req.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
       <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 mt-auto">
          <div className="flex items-center justify-end space-x-4 text-sm text-gray-600">
            <a href="https://photo-upload-portal.netlify.app/agency-tool.html" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Send Photo Request" className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200">
              <CameraIcon className="w-4 h-4" />
              <span>Photo</span>
            </a>
            <a href="https://app.hellosign.com/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Send with Dropbox Sign" className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200">
              <SignatureIcon className="w-4 h-4" />
              <span>Sign</span>
            </a>
            <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200">
              <EmailIcon className="w-4 h-4" />
              <span>Email</span>
            </a>
            <a href={`tel:${policy.clientPhone}`} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200">
              <PhoneIcon className="w-4 h-4" />
              <span>Call</span>
            </a>
          </div>
        </div>
    </div>
  );
};