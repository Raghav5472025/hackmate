import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import FloatingChat from './components/FloatingChat'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import SetupProfile from './pages/SetupProfile'
import Dashboard from './pages/Dashboard'
import Browse from './pages/Browse'
import Profile from './pages/Profile'
import Invites from './pages/Invites'
import Hackathons from './pages/Hackathons'
import EditProfile from './pages/EditProfile'
import Chat from './pages/Chat'
import Chats from './pages/Chats'
import Search from './pages/Search'
import Leaderboard from './pages/Leaderboard'
import AIMatch from './pages/AIMatch'
import AIHub from './pages/AIHub'
import AIChat from './pages/AIChat'
import PPTGenerator from './pages/PPTGenerator'

function Protected({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="spin spin-lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/setup-profile" replace />
  return children
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="spin spin-lg" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user, profile } = useAuth()
  const isLoggedIn = user && profile

  return (
    <>
      {isLoggedIn && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/setup-profile" element={<SetupProfile />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/browse" element={<Protected><Browse /></Protected>} />
        <Route path="/profile/:id" element={<Protected><Profile /></Protected>} />
        <Route path="/invites" element={<Protected><Invites /></Protected>} />
        <Route path="/hackathons" element={<Protected><Hackathons /></Protected>} />
        <Route path="/edit-profile" element={<Protected><EditProfile /></Protected>} />
        <Route path="/chat/:inviteId" element={<Protected><Chat /></Protected>} />
        <Route path="/chats" element={<Protected><Chats /></Protected>} />
        <Route path="/search" element={<Protected><Search /></Protected>} />
        <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
        <Route path="/ai-match" element={<Protected><AIMatch /></Protected>} />
        <Route path="/ai-hub" element={<Protected><AIHub /></Protected>} />
        <Route path="/ai-chat" element={<Protected><AIChat /></Protected>} />
        <Route path="/ppt-generator" element={<Protected><PPTGenerator /></Protected>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Floating AI Chat — shows on every page when logged in */}
      {isLoggedIn && <FloatingChat />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}