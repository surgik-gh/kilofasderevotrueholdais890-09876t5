import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Eager load critical pages
import { Landing } from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';

// Lazy load heavy/less frequently used pages
const Debug = lazy(() => import('@/pages/Debug').then(m => ({ default: m.Debug })));
const LessonCreate = lazy(() => import('@/pages/LessonCreate').then(m => ({ default: m.LessonCreate })));
const LessonView = lazy(() => import('@/pages/LessonView').then(m => ({ default: m.LessonView })));
const LessonList = lazy(() => import('@/pages/LessonList').then(m => ({ default: m.LessonList })));
const Chat = lazy(() => import('@/pages/Chat').then(m => ({ default: m.Chat })));
const AliesChat = lazy(() => import('@/pages/AliesChat').then(m => ({ default: m.AliesChat })));
const Leaderboard = lazy(() => import('@/pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Pricing = lazy(() => import('@/pages/Pricing').then(m => ({ default: m.Pricing })));
const Support = lazy(() => import('@/pages/Support').then(m => ({ default: m.Support })));
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const SchoolDashboard = lazy(() => import('@/pages/SchoolDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Achievements = lazy(() => import('@/pages/Achievements'));
const Quests = lazy(() => import('@/pages/Quests'));
const Challenges = lazy(() => import('@/pages/Challenges'));
const Connections = lazy(() => import('@/pages/Connections'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Roadmap = lazy(() => import('@/pages/Roadmap'));
const MyLessons = lazy(() => import('@/pages/MyLessons').then(m => ({ default: m.MyLessons })));
const QuizDemo = lazy(() => import('@/pages/QuizDemo').then(m => ({ default: m.QuizDemo })));
const TutorCall = lazy(() => import('@/pages/TutorCall').then(m => ({ default: m.TutorCall })));
const NotificationManager = lazy(() => import('@/components/gamification/shared/NotificationManager').then(m => ({ default: m.NotificationManager })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const profile = useStore((state) => state.profile);
  
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  const profile = useStore((state) => state.profile);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={profile ? <Navigate to="/dashboard" replace /> : <Landing />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/create-lesson" element={
            <ProtectedRoute>
              <LessonCreate />
            </ProtectedRoute>
          } />
          
          <Route path="/lessons" element={
            <ProtectedRoute>
              <LessonList />
            </ProtectedRoute>
          } />
          
          <Route path="/lesson/:id" element={
            <ProtectedRoute>
              <LessonView />
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          <Route path="/alies-chat" element={
            <ProtectedRoute>
              <AliesChat />
            </ProtectedRoute>
          } />
          
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          } />
          
          <Route path="/pricing" element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          } />

          <Route path="/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/admin/content" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/admin/analytics" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/school" element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/achievements" element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          } />

          <Route path="/quests" element={
            <ProtectedRoute>
              <Quests />
            </ProtectedRoute>
          } />

          <Route path="/challenges" element={
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          } />

          <Route path="/connections" element={
            <ProtectedRoute>
              <Connections />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/roadmap" element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          } />

          <Route path="/my-lessons" element={
            <ProtectedRoute>
              <MyLessons />
            </ProtectedRoute>
          } />

          <Route path="/quiz-demo" element={
            <ProtectedRoute>
              <QuizDemo />
            </ProtectedRoute>
          } />

          <Route path="/tutor-call" element={
            <ProtectedRoute>
              <TutorCall />
            </ProtectedRoute>
          } />

          <Route path="/children" element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          } />

          <Route path="/progress" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/students" element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/class-analytics" element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
        
        {/* Global notification manager */}
        {profile && (
          <Suspense fallback={null}>
            <NotificationManager />
          </Suspense>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}
