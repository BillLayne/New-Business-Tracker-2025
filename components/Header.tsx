
import React from 'react';
import { DocumentIcon } from './icons/StatusIcons';

export const Header: React.FC = () => {
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
        </div>
      </div>
    </header>
  );
};
