import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';

export type SaveStatus = 'idle' | 'saving' | 'saved';

const App: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header saveStatus={saveStatus} />
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard setSaveStatus={setSaveStatus} />
      </main>
    </div>
  );
};

export default App;
