import React from 'react';
import type { SaveStatus } from '../App';
import { DocumentIcon, SpinnerIcon, CheckIcon } from './icons/StatusIcons';

interface HeaderProps {
    saveStatus: SaveStatus;
}

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    if (status === 'idle') {
        return null;
    }

    return (
        <div className="flex items-center space-x-2 text-sm">
            {status === 'saving' && (
                <>
                    <SpinnerIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500">Saving...</span>
                </>
            )}
            {status === 'saved' && (
                <>
                    <CheckIcon className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-semibold">All changes saved</span>
                </>
            )}
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ saveStatus }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              New Business Underwriting Tracker
            </h1>
          </div>
          <div className="flex items-center">
            <SaveStatusIndicator status={saveStatus} />
          </div>
        </div>
      </div>
    </header>
  );
};
