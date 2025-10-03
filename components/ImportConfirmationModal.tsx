import React, { useMemo } from 'react';
import type { Policy } from '../types';
import { WarningIcon } from './icons/StatusIcons';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  file?: File | null;
  fileContent?: string;
}

export const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({ isOpen, onClose, onConfirm, file, fileContent }) => {
  const validationResult = useMemo(() => {
    if (!fileContent) {
      return { isValid: false, message: 'No file content to analyze.' };
    }
    try {
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        return { isValid: false, message: 'The file is not a valid backup. It does not contain a list of policies.' };
      }
      // Simple check to see if it looks like policy data
      if (data.length > 0 && (!data[0].id || !data[0].clientName)) {
        return { isValid: false, message: 'The data in the file does not appear to be valid policy data.' };
      }
      return { isValid: true, policyCount: data.length };
    } catch (e) {
      return { isValid: false, message: 'The file is corrupted or not in the correct JSON format.' };
    }
  }, [fileContent]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Import</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none" aria-label="Close modal">&times;</button>
        </div>
        
        <div className="flex items-start p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <WarningIcon className="w-8 h-8 text-yellow-500 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-yellow-800">Warning: Overwrite Data</h3>
              <p className="text-yellow-700 mt-1">
                Importing a file will replace all of your current policies. This action cannot be undone.
              </p>
            </div>
        </div>

        <div className="mt-6">
          {validationResult.isValid ? (
            <div>
              <p className="text-gray-700">You are about to import from the file:</p>
              <p className="font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-md my-2 truncate">{file?.name}</p>
              <p className="text-gray-700">This file contains <strong className="font-bold">{validationResult.policyCount}</strong> policies.</p>
              <p className="mt-4 text-gray-700">Are you sure you want to proceed?</p>
            </div>
          ) : (
            <div>
              <p className="text-red-700">The selected file could not be imported:</p>
              <p className="font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-md my-2 truncate">{file?.name}</p>
              <p className="text-red-700 mt-2">{validationResult.message}</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            disabled={!validationResult.isValid}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            Confirm and Overwrite
          </button>
        </div>
      </div>
    </div>
  );
};
