import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DailyTasksPage from './pages/DailyTasksPage';
import EditProfilePage from './pages/EditProfilePage';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/daily-tasks" element={<DailyTasksPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/tags" element={<DailyTasksPage />} />
          <Route path="/calendar" element={<DailyTasksPage />} />
          <Route path="*" element={<Navigate to="/daily-tasks" />} />
        </Routes>
      </Router>
    </ChakraProvider>
  )
}

export default App
