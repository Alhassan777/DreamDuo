import './App.css';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DailyTasksPage from './pages/DailyTasksPage';
import EditProfilePage from './pages/EditProfilePage';
import TagsPage from './pages/TagsPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ChakraProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/daily-tasks" element={<Navigate to={`/daily-tasks/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`} replace />} />
            <Route path="/daily-tasks/:date" element={<DailyTasksPage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="*" element={<Navigate to="/daily-tasks" />} />
          </Routes>
        </Router>
        </ChakraProvider>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
