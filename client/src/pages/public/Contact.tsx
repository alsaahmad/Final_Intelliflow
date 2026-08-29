import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  Send,
  CheckCircle2,
  HelpCircle,
  Building2,
} from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', department: 'Civic Support', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>24/7 Support & Departmental Help Desk</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Contact & Support Directory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Reach out to our Smart City Control Room, Traffic Enforcement Desk, or Civic Grievance Help Center.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="light-card p-6 border-slate-200 bg-white space-y-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">24/7 Helpline Directory</h3>
            <p className="text-xs text-slate-500">Emergency & General Inquiries</p>
            <div className="text-xs font-bold text-slate-800 space-y-1 pt-2 border-t border-slate-100">
              <div>Emergency SOS: <span className="text-rose-600">112</span></div>
              <div>Traffic Control Desk: <span>+91 11 2345 6789</span></div>
              <div>Municipal Help Desk: <span>1800 11 4455</span></div>
            </div>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Email Support</h3>
            <p className="text-xs text-slate-500">Direct Departmental Inboxes</p>
            <div className="text-xs font-bold text-slate-800 space-y-1 pt-2 border-t border-slate-100">
              <div>Support: <span className="text-brand-600">help@intelliflow.city</span></div>
              <div>Grievances: <span className="text-brand-600">grievance@intelliflow.city</span></div>
              <div>Press & Media: <span className="text-brand-600">media@intelliflow.city</span></div>
            </div>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Command Center Location</h3>
            <p className="text-xs text-slate-500">Integrated Control Center (ICCC)</p>
            <div className="text-xs font-semibold text-slate-700 space-y-1 pt-2 border-t border-slate-100">
              <div>IntelliFlow Smart City Complex</div>
              <div>Floor 5, Metropolitan Tower, Sector 12</div>
              <div>New Delhi - 110001</div>
            </div>
          </div>
        </div>

        {/* Contact Form & FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 light-card p-8 border-slate-200 bg-white space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Send an Inquiry or Message</h2>
              <p className="text-xs text-slate-500">We respond to civic inquiries within 2 hours</p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Message Received Successfully!</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Thank you, <strong>{formData.name}</strong>. A support officer from <strong>{formData.department}</strong> has received your inquiry and will reply to <strong>{formData.email}</strong> shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-emerald-700 underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Civic Support">General Civic Support & App Assistance</option>
                    <option value="Traffic Division">Traffic Police & Signal Feedback</option>
                    <option value="Municipal Works">Municipal Corporation & Infrastructure</option>
                    <option value="Emergency Care">Emergency Services & Hospital Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Message / Inquiry</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry or question..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Quick FAQ summary */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>

            <div className="light-card p-4 border-slate-200 bg-white space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">How do I report a broken traffic light or road hazard?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                You can submit an instant report on our <a href="/grievance" className="text-brand-600 font-semibold underline">Grievance Page</a> with photos and GPS location without creating an account.
              </p>
            </div>

            <div className="light-card p-4 border-slate-200 bg-white space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">What is an Emergency Green Corridor?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When an ambulance with a critical patient is in transit, our AI synchronizes upcoming traffic signals to clear traffic waves automatically.
              </p>
            </div>

            <div className="light-card p-4 border-slate-200 bg-white space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">How is my data protected?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All citizen logins use OAuth 2.0 PKCE with zero-knowledge session encryption conforming to the Digital Personal Data Protection (DPDP) Act.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
