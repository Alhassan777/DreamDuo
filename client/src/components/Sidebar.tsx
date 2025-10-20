import React, { useState, useEffect } from 'react';
import {
  VStack,
  Box,
  Icon,
  Text,
  Flex,
  IconButton,
  Tooltip,
  IconProps,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaTasks, FaHashtag, FaChartPie, FaCalendar, FaPalette } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { ComponentWithAs } from '@chakra-ui/react';
import ProfileDropdown from './ProfileDropdown';
import sidebarIcon1 from '../assets/sidebar_icon1.png';
import sidebarIcon2 from '../assets/sidebar_icon2.png';
import sidebarIcon3 from '../assets/sidebar_icon3.png';
import sidebarIcon4 from '../assets/sidebar_icon4.png';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebar } from '../contexts/SidebarContext';
import stretchedIcon from '../assets/Stretched.png';
import './styles/sidebar.css';
import api from '../services/api';

interface IconWrapperProps {
  icon: IconType | ComponentWithAs<"svg", IconProps>;
  aotIcon?: string;
  isAotMode: boolean;
  boxSize?: number;
  mr?: number;
}

const IconWrapper = ({ icon: IconEl, aotIcon, isAotMode, boxSize = 6, mr = 6 }: IconWrapperProps) => {
  if (isAotMode && aotIcon) {
    return (
      <img
        src={aotIcon}
        alt="icon"
        className="icon-wrapper-img"
        style={{
          width: `${boxSize * 6}px`,
          height: `${boxSize * 6}px`,
          marginRight: `${mr * 2}px`,
        }}
      />
    );
  }
  return (
    <div className="icon-wrapper">
      <IconEl boxSize={boxSize} mr={mr} />
    </div>
  );
};

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar = ({ onCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setSidebarCollapsed } = useSidebar();
  const { isAotMode } = useTheme();
  const [userData, setUserData] = useState<{ firstName?: string; lastName?: string; profilePhoto?: string }>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        const userData = response.data.user;
        setUserData({
          firstName: userData.first_name,
          lastName: userData.last_name,
          profilePhoto: userData.profile_photo
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized: Please log in') {
          navigate('/');
        } else {
          console.error('Error fetching user data:', error instanceof Error ? error.message : String(error));
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const navItems = [
    {
      label: "Tasks",
      icon: FaTasks,
      path: '/tasks',
      aotIcon: sidebarIcon1,
    },
    {
      label: 'Calendar View',
      icon: FaCalendar,
      path: '/calendar',
      aotIcon: sidebarIcon2,
    },
    {
      label: 'Dashboard',
      icon: FaChartPie,
      path: '/dashboard',
      aotIcon: sidebarIcon3,
    },
    {
      label: 'Tags',
      icon: FaHashtag,
      path: '/tags',
      aotIcon: sidebarIcon4,
    },
    {
      label: 'Theme',
      icon: FaPalette,
      path: '/theme',
      aotIcon: undefined, // Can add a theme-specific icon if needed
    },
  ];

  return (
    <Box
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isAotMode ? 'aot-mode' : ''}`}
      position="relative"
    >
      <VStack spacing={6} align="stretch">
        <Box px={isCollapsed ? 4 : 8} mb={2}>
          <ProfileDropdown 
            isCollapsed={isCollapsed} 
            firstName={userData.firstName}
            lastName={userData.lastName}
            userPhoto={userData.profilePhoto}
          />
        </Box>
    
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Flex
              key={item.path}
              className={`nav-item ${isCollapsed ? 'nav-item-collapsed' : ''} ${isActive ? 'active' : ''} ${isAotMode ? 'aot-mode' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <IconWrapper
                icon={item.icon}
                aotIcon={item.aotIcon}
                isAotMode={isAotMode}
                boxSize={6}
                mr={isCollapsed ? 0 : 3}
              />
              {!isCollapsed && (
                <Text fontSize="lg" fontWeight="bold">
                  {item.label}
                </Text>
              )}
            </Flex>
          );
        })}
      </VStack>
    
      <IconButton
        aria-label="Toggle Sidebar"
        icon={
          isAotMode ? (
            <div className="sidebar-toggle-icon">
              <img
                src={stretchedIcon}
                alt="Toggle Sidebar"
                className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}
              />
            </div>
          ) : isCollapsed ? (
            <ChevronRightIcon />
          ) : (
            <ChevronLeftIcon />
          )
        }
        className={`sidebar-toggle-button ${isAotMode ? 'aot-mode' : ''}`}
        onClick={() => {
          const newCollapsed = !isCollapsed;
          setSidebarCollapsed(newCollapsed);
          onCollapse?.(newCollapsed);
        }}
        size="sm"
        position="absolute"
        bottom="4"
        right="4"
      />
    </Box>
  );
};

export default Sidebar;
