import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  ParkingSquare,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react';

export type CitizenTabType = 'DASHBOARD' | 'NAVIGATION' | 'PARKING' | 'REPORT' | 'SOS';

interface CitizenBottomNavProps {
  activeTab: CitizenTabType;
  onSelectTab: (tab: CitizenTabType) => void;
}

export const CitizenBottomNav: React.FC<CitizenBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around select-none"
    >
      {/* Tab 1: Dashboard */}
      <button
        onClick={() => onSelectTab('DASHBOARD')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'DASHBOARD'
            ? 'text-blue-600 font-extrabold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'DASHBOARD' ? 'bg-blue-50' : ''}`}>
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* Tab 2: Navigation */}
      <button
        onClick={() => onSelectTab('NAVIGATION')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'NAVIGATION'
            ? 'text-blue-600 font-extrabold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'NAVIGATION' ? 'bg-blue-50' : ''}`}>
          <Navigation className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">Route</span>
      </button>

      {/* Tab 3: Parking */}
      <button
        onClick={() => onSelectTab('PARKING')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'PARKING'
            ? 'text-teal-600 font-extrabold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'PARKING' ? 'bg-teal-50' : ''}`}>
          <ParkingSquare className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">Parking</span>
      </button>

      {/* Tab 4: Report Incident */}
      <button
        onClick={() => onSelectTab('REPORT')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'REPORT'
            ? 'text-amber-600 font-extrabold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'REPORT' ? 'bg-amber-50' : ''}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">Report</span>
      </button>

      {/* Tab 5: 112 SOS */}
      <button
        onClick={() => onSelectTab('SOS')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'SOS'
            ? 'text-rose-600 font-extrabold'
            : 'text-rose-600 hover:text-rose-700 font-medium'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'SOS' ? 'bg-rose-100 text-rose-700 font-black scale-110' : 'bg-rose-50'}`}>
          <PhoneCall className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 font-bold">112 SOS</span>
      </button>
    </nav>
  );
};
