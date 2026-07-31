/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* App.tsx                                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42belgium.be        +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis         #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by jpaulis        ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/context/auth.context';
import { SocketProvider } from '@/context/socket.context';
import { Spinner } from '@/components/ui/Spinner';

// Pages
import { HomePage }      from '@/pages/HomePage';
import { LoginPage }     from '@/pages/auth/LoginPage';
import { RegisterPage }  from '@/pages/auth/RegisterPage';
import { ProfilePage }   from '@/pages/ProfilePage';
import { TrainingPage }  from '@/pages/TrainingPage';
import { TowerPage }     from '@/pages/TowerPage';
import { EditorPage }    from '@/pages/editor/EditorPage';
import { GamePage }      from '@/pages/game/GamePage';
import { RacePage }      from '@/pages/game/RacePage';
import { TowerGamePage } from '@/pages/game/TowerGamePage';
import { DuelPage }      from '@/pages/duel/DuelPage';
import { DuelGamePage }  from '@/pages/duel/DuelGamePage';
import { NotFoundPage }  from '@/pages/NotFoundPage';
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage';
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" className="text-deep-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<HomePage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route path="/profile"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/editor"           element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
      <Route path="/editor/:id"       element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
      <Route path="/train"            element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
      <Route path="/tower"            element={<ProtectedRoute><TowerPage /></ProtectedRoute>} />
      <Route path="/play/tower/:order_index" element={<ProtectedRoute><TowerGamePage /></ProtectedRoute>} />
      <Route path="/play/:map_id"            element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/play/:map_id/race"       element={<ProtectedRoute><RacePage /></ProtectedRoute>} />
      <Route path="/duel"                    element={<ProtectedRoute><DuelPage /></ProtectedRoute>} />
      <Route path="/duel/game"               element={<ProtectedRoute><DuelGamePage /></ProtectedRoute>} />
      <Route path="/terms"                   element={<TermsOfServicePage />} />
      <Route path="/privacy"                 element={<PrivacyPolicyPage />} />
  
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRoutes />
            </BrowserRouter> 
          </SocketProvider>
        </AuthProvider>
      <ToastContainer />
    </ToastProvider>
  );
}
