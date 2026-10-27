import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Officer-side roles that open a case through the officer case journey.
const JOURNEY_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'];

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-500 font-medium">Checking session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // /track/:caseId is the complainant view; officers are sent to their own case journey.
    const trackMatch = location.pathname.match(/^\/track\/([^/]+)$/);
    if (trackMatch && JOURNEY_ROLES.includes(user.role)) {
      return <Navigate to={`/cases/${trackMatch[1]}`} replace />;
    }
    return (
      <div className="card card-pad mx-auto mt-12 max-w-md text-center">
        <h2 className="text-lg font-bold text-red-800">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your role ({user.role}) is not authorized to view this page.
        </p>
        <Link to="/dashboard" className="btn-ghost mt-4">Back to command centre</Link>
      </div>
    );
  }

  return children;
}
