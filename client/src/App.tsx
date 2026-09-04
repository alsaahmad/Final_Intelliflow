import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { CityOperationsPortal } from './pages/portals/CityOperationsPortal';
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

        {/* 🏙️ Flagship: AEGIS Urban Digital Twin */}
        <Route path="/digital-twin" element={<DigitalTwinDashboard />} />

        {/* 🏛️ Unified City Operations Portal (Consolidated Command Center + Municipal) */}
        <Route
          path="/city-operations"
          element={
            <ProtectedRoute
              requiredRoles={[
                'CITY_OPERATIONS',
                'COMMAND_CENTER',
                'MUNICIPAL_CORP',
                'MUNICIPAL_CORPORATION',
                'MUNICIPAL_ENGINEER',
                'ADMIN',
              ]}
            >
              <CityOperationsPortal />
            </ProtectedRoute>
          }
        />

        {/* 🔄 Legacy Routes Safe Redirection / Fallbacks */}
        <Route
          path="/command-center"
          element={<Navigate to="/city-operations?tab=overview" replace />}
        />
        <Route
          path="/command-center/telemetry"
          element={<Navigate to="/city-operations?tab=analytics" replace />}
        />
        <Route
          path="/municipal"
          element={<Navigate to="/city-operations?tab=complaints" replace />}
        />

        {/* 👤 View 2: Citizen Portal (Role: CITIZEN) */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute requiredRoles={['CITIZEN', 'COMMAND_CENTER', 'CITY_OPERATIONS', 'ADMIN']}>
              <CitizenPortal />
            </ProtectedRoute>
          }
        />

        {/* 🚓 View 3: Traffic Police Portal (Role: TRAFFIC_POLICE) */}
        <Route
          path="/traffic-police"
          element={
            <ProtectedRoute requiredRoles={['TRAFFIC_POLICE', 'COMMAND_CENTER', 'CITY_OPERATIONS', 'ADMIN']}>
              <TrafficPolicePortal />
            </ProtectedRoute>
          }
        />

        {/* 🚑 View 5: Ambulance Portal (Role: AMBULANCE_RESPONDER) */}
        <Route
          path="/ambulance"
          element={
            <ProtectedRoute requiredRoles={['AMBULANCE_RESPONDER', 'COMMAND_CENTER', 'CITY_OPERATIONS', 'CITIZEN', 'TRAFFIC_POLICE', 'ADMIN']}>
              <AmbulancePortal />
            </ProtectedRoute>
          }
        />

        {/* 🏥 View 6: Hospital Emergency Portal (Role: HOSPITAL) */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute requiredRoles={['HOSPITAL', 'COMMAND_CENTER', 'CITY_OPERATIONS', 'CITIZEN', 'TRAFFIC_POLICE', 'ADMIN']}>
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
import { WebSocketProvider } from './context/WebSocketContext';
import { GigwAccessibilityBar } from './components/compliance/GigwAccessibilityBar';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
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
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
