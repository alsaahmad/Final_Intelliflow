import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DevRoleSwitcher } from './components/DevRoleSwitcher';
import { PublicLayout } from './components/layout/PublicLayout';

// Public Landing & Legal Pages
import { Home } from './pages/public/Home';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { TermsOfService } from './pages/public/TermsOfService';
import { Accessibility } from './pages/public/Accessibility';
import { Contact } from './pages/public/Contact';

// Auth & Status Pages
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

// Role Portals & Flagship Urban Digital Twin
import { CitizenPortal } from './pages/portals/CitizenPortal';
import { TrafficPolicePortal } from './pages/portals/TrafficPolicePortal';
import { MunicipalPortal } from './pages/portals/MunicipalPortal';
import { CommandCenterPortal } from './pages/portals/CommandCenterPortal';
import { AmbulancePortal } from './pages/portals/AmbulancePortal';
import { HospitalPortal } from './pages/portals/HospitalPortal';
import { DigitalTwinDashboard } from './digitalTwin/DigitalTwinDashboard';

export const AppRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* 🌐 Public Landing Page & Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* 🔐 View 1: Auth Screen (Login / Register) */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🏙️ Flagship: AEGIS Urban Digital Twin Command Center */}
        <Route path="/digital-twin" element={<DigitalTwinDashboard />} />
        <Route
          path="/command-center"
          element={
            <ProtectedRoute requiredRoles={['COMMAND_CENTER', 'ADMIN']}>
              <DigitalTwinDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/command-center/telemetry"
          element={
            <ProtectedRoute requiredRoles={['COMMAND_CENTER', 'ADMIN']}>
              <CommandCenterPortal />
            </ProtectedRoute>
          }
        />

        {/* 👤 View 2: Citizen Portal (Role: CITIZEN) */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute requiredRoles={['CITIZEN', 'COMMAND_CENTER']}>
              <CitizenPortal />
            </ProtectedRoute>
          }
        />

        {/* 🚓 View 3: Traffic Police Portal (Role: TRAFFIC_POLICE) */}
        <Route
          path="/traffic-police"
          element={
            <ProtectedRoute requiredRoles={['TRAFFIC_POLICE', 'COMMAND_CENTER']}>
              <TrafficPolicePortal />
            </ProtectedRoute>
          }
        />

        {/* 🏛️ View 4: Municipal Corporation Portal (Role: MUNICIPAL_CORP) */}
        <Route
          path="/municipal"
          element={
            <ProtectedRoute requiredRoles={['MUNICIPAL_CORP', 'MUNICIPAL_CORPORATION', 'COMMAND_CENTER']}>
              <MunicipalPortal />
            </ProtectedRoute>
          }
        />

        {/* 🚑 View 5: Ambulance Portal (Role: AMBULANCE_RESPONDER) */}
        <Route
          path="/ambulance"
          element={
            <ProtectedRoute requiredRoles={['AMBULANCE_RESPONDER', 'COMMAND_CENTER', 'CITIZEN', 'TRAFFIC_POLICE']}>
              <AmbulancePortal />
            </ProtectedRoute>
          }
        />

        {/* 🏥 View 6: Hospital Emergency Portal (Role: HOSPITAL) */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute requiredRoles={['HOSPITAL', 'COMMAND_CENTER', 'CITIZEN', 'TRAFFIC_POLICE']}>
              <HospitalPortal />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Floating Sandbox Dev Role Switcher */}
      <DevRoleSwitcher />
    </>
  );
};

import { CitySyncProvider } from './context/CitySyncContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { GigwAccessibilityBar } from './components/compliance/GigwAccessibilityBar';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <CitySyncProvider>
            <div className="flex flex-col min-h-screen">
              <GigwAccessibilityBar />
              <div className="flex-1">
                <AppRoutes />
              </div>
            </div>
          </CitySyncProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
