import React, { useState } from 'react';
import axios from 'axios';
import {
  FileText,
  Send,
  Search,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface GrievanceTicket {
  id: string;
  category: string;
  title: string;
  location: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'WORK_ASSIGNED' | 'RESOLVED';
  createdAt: string;
  citizenName: string;
}

export const Grievance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submission form state
  const [formData, setFormData] = useState({
    category: 'Road & Potholes',
    title: '',
    location: '',
    citizenName: '',
    citizenEmail: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<GrievanceTicket | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tracking state
  const [searchTicketId, setSearchTicketId] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<GrievanceTicket | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await axios.post('/api/public/grievances', {
        category: formData.category,
        title: formData.title,
        location: formData.location,
        citizenName: formData.citizenName,
        citizenEmail: formData.citizenEmail,
      });

      if (res.data.ticket) {
        setCreatedTicket(res.data.ticket);
        setFormData({
          category: 'Road & Potholes',
          title: '',
          location: '',
          citizenName: '',
          citizenEmail: '',
          description: '',
        });
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicketId.trim()) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedTicket(null);

    try {
      const res = await axios.get(`/api/public/grievances/track/${encodeURIComponent(searchTicketId.trim())}`);
      if (res.data.ticket) {
        setTrackedTicket(res.data.ticket);
      }
    } catch (err: any) {
      setTrackingError(err.response?.data?.message || `No ticket found for ID: ${searchTicketId}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>Civic Issue Resolution & Feedback</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Grievance Redressal Portal
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Report municipal infrastructure issues, potholes, street lighting defects, or signal glitches and track real-time resolution progress.
          </p>
        </div>

        {/* Tab switchers: Submit vs Track */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 border border-slate-300">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'submit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Submit New Grievance
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'track' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Track Ticket Status
            </button>
          </div>
        </div>

        {/* Tab 1: Submit Form */}
        {activeTab === 'submit' && (
          <div className="light-card p-8 border-slate-200 bg-white shadow-card space-y-6">
            {createdTicket ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Grievance Registered Successfully!</h3>
                    <p className="text-xs text-emerald-800">Your unique Tracking ID has been generated.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-emerald-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Ticket ID:</span>
                    <span className="font-mono font-black text-sm text-emerald-700">{createdTicket.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-bold text-slate-800">{createdTicket.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-800">{createdTicket.location}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      SUBMITTED (Assigned to Municipal Queue)
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setSearchTicketId(createdTicket.id);
                      setActiveTab('track');
                      setCreatedTicket(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Track This Ticket →
                  </button>
                  <button
                    onClick={() => setCreatedTicket(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                  >
                    Submit Another Grievance
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">Civic Issue Details</h2>
                  <p className="text-xs text-slate-500">Please provide accurate location and issue details for fast dispatch</p>
                </div>

                {submitError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    >
                      <option value="Road & Potholes">Road & Pothole Damage</option>
                      <option value="Traffic Signal">Traffic Signal Glitch / Timing Delay</option>
                      <option value="Street Lighting">Streetlight Outage</option>
                      <option value="Water Logging">Water Logging / Drainage Overflow</option>
                      <option value="Waste & Sanitation">Garbage / Sanitation Delay</option>
                      <option value="Encroachment">Illegal Parking / Encroachment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brief Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Deep pothole near sector crossing"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exact Location / Landmark *</label>
                  <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Opposite Metro Station Gate 3, Sector 14"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={formData.citizenName}
                      onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email / Mobile (For SMS Alerts)</label>
                    <input
                      type="text"
                      placeholder="e.g. priya@gmail.com"
                      value={formData.citizenEmail}
                      onChange={(e) => setFormData({ ...formData, citizenEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Registering Ticket...' : 'Submit Grievance to Municipal Works'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Track Status Form */}
        {activeTab === 'track' && (
          <div className="light-card p-8 border-slate-200 bg-white shadow-card space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Track Existing Ticket</h2>
              <p className="text-xs text-slate-500">Enter your Grievance Tracking ID (e.g. GRV-2026-901)</p>
            </div>

            <form onSubmit={handleTrack} className="flex space-x-2">
              <input
                type="text"
                required
                placeholder="Enter Ticket ID (e.g. GRV-2026-901)"
                value={searchTicketId}
                onChange={(e) => setSearchTicketId(e.target.value)}
                className="flex-grow px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{trackingLoading ? 'Searching...' : 'Track'}</span>
              </button>
            </form>

            {trackingError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {trackingError}
              </div>
            )}

            {trackedTicket && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-brand-600">{trackedTicket.id}</span>
                    <h3 className="font-bold text-slate-900 text-base mt-0.5">{trackedTicket.title}</h3>
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
                      STATUS: {trackedTicket.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px]">Category</div>
                    <div className="font-bold text-slate-800">{trackedTicket.category}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Location</div>
                    <div className="font-bold text-slate-800">{trackedTicket.location}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Submitted By</div>
                    <div className="font-bold text-slate-800">{trackedTicket.citizenName}</div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2">
                  <div className="text-xs font-bold text-slate-800">Resolution Progress Lifecycle</div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Registered
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Under Review
                    </div>
                    <div className={`p-2 rounded-lg ${trackedTicket.status === 'WORK_ASSIGNED' || trackedTicket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200/80 text-slate-500'}`}>
                      {trackedTicket.status === 'WORK_ASSIGNED' ? '► Assigned' : 'Work Assigned'}
                    </div>
                    <div className={`p-2 rounded-lg ${trackedTicket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200/80 text-slate-500'}`}>
                      {trackedTicket.status === 'RESOLVED' ? '✓ Resolved' : 'Completed'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
