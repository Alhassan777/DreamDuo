import './App.css';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TasksPage from './pages/TasksPage';
import EditProfilePage from './pages/EditProfilePage';
import TagsPage from './pages/TagsPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import ThemeCustomizationPage from './pages/ThemeCustomizationPage';
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
            <Route path="/tasks" element={<TasksPage />} />
            {/* Redirect old daily-tasks routes to new tasks route */}
            <Route path="/daily-tasks" element={<Navigate to="/tasks" replace />} />
            <Route path="/daily-tasks/:date" element={<Navigate to="/tasks" replace />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/theme" element={<ThemeCustomizationPage />} />
            <Route path="*" element={<Navigate to="/tasks" />} />
          </Routes>
        </Router>
        </ChakraProvider>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
