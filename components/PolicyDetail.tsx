import React, { useState, useEffect } from 'react';
import type { Policy, Requirement } from '../types';
import { RequirementStatus, PolicyStatus } from '../types';
import { StatusIcon, PencilIcon, TrashIcon, EmailIcon, PhoneIcon, ArchiveBoxIcon, ExternalLinkIcon, SignatureIcon, CameraIcon, GoogleDriveIcon } from './icons/StatusIcons';
import { localDataService } from '../services/localDataService';
import { geminiService } from '../services/geminiService';

interface PolicyDetailProps {
  policy: Policy;
  onBack: () => void;
  onUpdate: (updatedPolicy: Policy, skipRecalculate?: boolean) => void;
  onDelete: (policyId: string) => void;
}

export const PolicyDetail: React.FC<PolicyDetailProps> = ({ policy, onBack, onUpdate, onDelete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [userPrompt, setUserPrompt] = useState('Draft a friendly follow-up email about the outstanding documents.');
  const [isEditing, setIsEditing] = useState(false);
  const [editablePolicy, setEditablePolicy] = useState(policy);
  const [gmailButtonText, setGmailButtonText] = useState('Open in Gmail & Copy');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    setEditablePolicy(policy);
    setConfirmingDelete(false);
  }, [policy]);
  
  const handleStatusChange = (requirementId: string, newStatus: RequirementStatus) => {
    const updatedRequirements = policy.requirements.map(req =>
      req.id === requirementId ? { ...req, status: newStatus } : req
    );
    const updatedPolicy = { ...policy, requirements: updatedRequirements };
    onUpdate(updatedPolicy);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const newCommunication = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      note: newNote.trim(),
    };

    const updatedCommunications = [...(policy.communications || []), newCommunication];
    const updatedPolicy = { ...policy, communications: updatedCommunications };
    
    onUpdate(updatedPolicy);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
        return;
    }

    const updatedCommunications = (policy.communications || []).filter(comm => comm.id !== noteId);
    const updatedPolicy = { ...policy, communications: updatedCommunications };
    onUpdate(updatedPolicy);
  };

  const handleAskAssistant = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    try {
        const htmlContent = await geminiService.generateAIAssistance(policy, userPrompt);
        setGeneratedContent(htmlContent);
    } catch(error) {
        console.error("Failed to generate content:", error);
        setGeneratedContent("<div>Error generating content.</div>");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDelete = () => {
    if (confirmingDelete) {
        onDelete(policy.id);
    } else {
        setConfirmingDelete(true);
        setTimeout(() => setConfirmingDelete(false), 4000);
    }
  };

  const handleEditToggle = () => {
    setConfirmingDelete(false);
    if (isEditing) {
        onUpdate(editablePolicy);
        setIsEditing(false);
    } else {
        setEditablePolicy(policy);
        setIsEditing(true);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditablePolicy(prev => ({ ...prev, [name]: value }));
  };

  const handleRestore = () => {
    const restoredPolicy = { ...policy, status: PolicyStatus.PENDING_REQUIREMENTS };
    onUpdate(restoredPolicy, true); // skipRecalculate = true
  };

  const handleSearchInMatrix = () => {
    const nameQuery = policy.clientName.trim();
    const phoneQuery = policy.clientPhone.trim();
    
    let selection = 'Name';
    let query = nameQuery;

    // Prioritize searching by a valid 10-digit phone number
    const phoneDigits = phoneQuery.replace(/\D/g, '');
    if (phoneDigits.length === 10) {
        selection = 'Phone';
        query = phoneDigits;
    } else if (!nameQuery) {
        alert("No valid client name or phone number available to search in Agency Matrix.");
        return;
    }

    const baseUrl = 'https://agents.agencymatrix.com/#/customer/search';
    const url = `${baseUrl}?selection=${selection}&query=${encodeURIComponent(query)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDriveFolder = () => {
    if (!policy.clientName?.trim()) {
      alert("Client name is not available to search in Google Drive.");
      return;
    }
    const clientName = policy.clientName.trim();
    const agencyEmail = 'docs@billlayneinsurance.com';
    const clientsFolderId = '11O0Cm9gOdgXp_j8OXMO4Pm5tqh18uXd5';

    // This query performs a targeted search for a folder/file with the client's name
    // *only* inside the specified "Clients" folder.
    const searchQuery = `parent:${clientsFolderId} title:(${clientName})`;

    const url = `https://drive.google.com/drive/search?q=${encodeURIComponent(searchQuery)}&authuser=${agencyEmail}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGmailAndCopy = async () => {
    if (!generatedContent) return;
    try {
      const blob = new Blob([generatedContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      setGmailButtonText('Copied!');

      const subject = encodeURIComponent(`Regarding Your Insurance Policy: ${policy.policyNumber} - ${policy.clientName}`);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${policy.clientEmail}&su=${subject}`;
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');

      setTimeout(() => setGmailButtonText('Open in Gmail & Copy'), 2000);
    } catch (error) {
      console.error('Failed to copy rich text:', error);
      setGmailButtonText('Action Failed');
      setTimeout(() => setGmailButtonText('Open in Gmail & Copy'), 2000);
    }
  };

  const subject = encodeURIComponent(`Regarding Your Insurance Policy: ${policy.policyNumber} - ${policy.clientName}`);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${policy.clientEmail}&su=${subject}`;

  const currentPolicyState = isEditing ? editablePolicy : policy;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-6 gap-4">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:underline mb-4">&larr; Back to List</button>
          <h2 className="text-3xl font-bold text-gray-800">
             {isEditing ? (
                <input type="text" name="clientName" value={editablePolicy.clientName} onChange={handleInputChange} className="w-full p-1 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-t-md"/>
             ) : ( currentPolicyState.clientName )}
          </h2>
          <p className="text-gray-500 mt-1">
            {currentPolicyState.policyType} Policy - 
            {isEditing ? (
                <input type="text" name="policyNumber" value={editablePolicy.policyNumber} onChange={handleInputChange} className="p-1 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-t-md"/>
             ) : ( ` ${currentPolicyState.policyNumber}` )}
          </p>
          <p className="text-sm text-gray-500">{currentPolicyState.carrier} | Effective: {currentPolicyState.effectiveDate}</p>
          {isEditing ? (
            <div className="mt-2">
              <label htmlFor="followUpDate" className="text-sm font-medium text-gray-600 mr-2">Follow-up Date:</label>
              <input 
                type="date" 
                id="followUpDate"
                name="followUpDate" 
                value={editablePolicy.followUpDate || ''} 
                onChange={handleInputChange} 
                className="p-1 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-md"
              />
            </div>
          ) : (
            currentPolicyState.followUpDate && (
                <p className="text-sm text-yellow-700 font-semibold mt-1">Follow-up by: {currentPolicyState.followUpDate}</p>
            )
          )}
           {/* Contact info */}
          <div className="mt-2 text-sm text-gray-600 space-y-1">
             <div className="flex items-center">
                <EmailIcon className="w-4 h-4 mr-2"/>
                {isEditing ? (
                  <input type="email" name="clientEmail" value={editablePolicy.clientEmail} onChange={handleInputChange} className="p-1 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-t-md"/>
                ) : ( <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{currentPolicyState.clientEmail}</a> )}
            </div>
             <div className="flex items-center">
                <PhoneIcon className="w-4 h-4 mr-2"/>
                {isEditing ? (
                  <input type="tel" name="clientPhone" value={editablePolicy.clientPhone} onChange={handleInputChange} className="p-1 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-t-md"/>
                ) : ( <a href={`tel:${currentPolicyState.clientPhone}`} className="hover:text-blue-600">{currentPolicyState.clientPhone}</a> )}
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full sm:w-auto items-start sm:items-end space-y-3">
            {currentPolicyState.status === PolicyStatus.ARCHIVED ? (
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                    <button 
                        onClick={handleRestore} 
                        className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 text-sm"
                    >
                        <ArchiveBoxIcon className="w-4 h-4 mr-1.5"/>
                        Restore Policy
                    </button>
                    <button 
                        onClick={handleDelete} 
                        className={`flex items-center text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 text-sm ${confirmingDelete ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <TrashIcon className="w-4 h-4 mr-1.5"/>
                        {confirmingDelete ? 'Confirm Delete' : 'Delete Permanently'}
                    </button>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                    <a
                      href="https://photo-upload-portal.netlify.app/agency-tool.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 text-sm"
                    >
                      <CameraIcon className="w-4 h-4 mr-1.5"/>
                      Photo Request
                    </a>
                    <a
                      href="https://app.hellosign.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 text-sm"
                    >
                      <SignatureIcon className="w-4 h-4 mr-1.5"/>
                      Dropbox Sign
                    </a>
                    <button 
                      onClick={handleSearchInMatrix} 
                      className="flex items-center bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-300 text-sm"
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-1.5"/>
                      Search in Matrix
                    </button>
                    <button 
                      onClick={handleOpenDriveFolder} 
                      className="flex items-center bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-300 text-sm"
                    >
                      <GoogleDriveIcon className="w-4 h-4 mr-1.5"/>
                      Client Folder
                    </button>
                    <button 
                    onClick={handleEditToggle} 
                    className="flex items-center bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-300 text-sm"
                    >
                        <PencilIcon className="w-4 h-4 mr-1.5"/>
                        {isEditing ? 'Save Changes' : 'Edit Policy'}
                    </button>
                    <button 
                    onClick={handleDelete} 
                    className={`flex items-center text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 text-sm ${confirmingDelete ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <TrashIcon className="w-4 h-4 mr-1.5"/>
                        {confirmingDelete ? 'Confirm Delete' : 'Delete'}
                    </button>
                </div>
            )}
             <div className="flex items-center space-x-2 text-lg text-gray-700 font-semibold pt-2">
                <StatusIcon status={currentPolicyState.status} />
                <span>{currentPolicyState.status}</span>
            </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Underwriting Requirements</h3>
        <ul className="space-y-4">
          {currentPolicyState.requirements.map(req => (
            <li key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center">
                    <StatusIcon status={req.status} className="mr-3" />
                    <div>
                        <p className="font-medium text-gray-800">{req.name}</p>
                        <p className="text-sm text-gray-500">{req.description}</p>
                    </div>
                </div>
                <div>
                    <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as RequirementStatus)}
                        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        disabled={isEditing || currentPolicyState.status === PolicyStatus.ARCHIVED}
                    >
                       {Object.values(RequirementStatus).map(s => (
                           <option key={s} value={s}>{s}</option>
                       ))}
                    </select>
                </div>
            </li>
          ))}
           {currentPolicyState.requirements.length === 0 && (
            <li className="text-center p-4 text-gray-500 bg-gray-50 rounded-md">
              No underwriting requirements have been added for this policy.
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Communication Log</h3>
        <div className="mb-4">
          <textarea
            rows={3}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about a call, email, or other communication..."
            disabled={isEditing || currentPolicyState.status === PolicyStatus.ARCHIVED}
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isEditing || currentPolicyState.status === PolicyStatus.ARCHIVED}
            className="mt-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>
        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {currentPolicyState.communications && currentPolicyState.communications.length > 0 ? (
            [...currentPolicyState.communications].reverse().map(comm => (
              <li key={comm.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(comm.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{comm.note}</p>
                </div>
                <button 
                  onClick={() => handleDeleteNote(comm.id)}
                  className="text-gray-400 hover:text-red-600 ml-4 p-1 disabled:text-gray-300"
                  disabled={isEditing || currentPolicyState.status === PolicyStatus.ARCHIVED}
                  title="Delete note"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))
          ) : (
            <li className="text-center p-4 text-gray-500 bg-gray-50 rounded-md">
              No communication notes have been added.
            </li>
          )}
        </ul>
      </div>

       {currentPolicyState.status !== PolicyStatus.ARCHIVED && (
        <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">AI Insurance Assistant</h3>
            <div className="space-y-2">
                <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700">
                    What do you need help with?
                </label>
                <textarea
                    id="ai-prompt"
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g., Draft a friendly follow-up email about the outstanding documents."
                />
            </div>
            <div className="mt-3">
                <button
                    onClick={handleAskAssistant}
                    disabled={isGenerating || !userPrompt}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                    {isGenerating ? 'Generating...' : 'Ask Assistant'}
                </button>
            </div>
            {generatedContent && (
                <div className="mt-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center p-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-700">Assistant's Response</h4>
                    <button
                        onClick={handleOpenGmailAndCopy}
                        className="bg-gray-200 text-gray-700 text-xs font-semibold py-1 px-3 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        {gmailButtonText}
                    </button>
                </div>
                    <iframe
                        srcDoc={generatedContent}
                        title="AI Generated Content Preview"
                        sandbox=""
                        className="w-full h-96 border-0 rounded-b-lg"
                    />
                </div>
            )}
        </div>
       )}
    </div>
  );
};