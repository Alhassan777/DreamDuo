import React from 'react';
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
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaTasks, FaHashtag, FaChartPie } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { ComponentWithAs } from '@chakra-ui/react';
import ProfileDropdown from './ProfileDropdown';
import attackingTitanIcon from '../assets/attacking_titan.png';
import sidebarIcon1 from '../assets/sidebar_icon1.png';
import sidebarIcon2 from '../assets/sidebar_icon2.png';
import sidebarIcon3 from '../assets/sidebar_icon3.png';
import sidebarIcon4 from '../assets/sidebar_icon4.png';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebar } from '../contexts/SidebarContext';
import stretchedIcon from '../assets/Stretched.png';
import './styles/sidebar.css';

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
  const { isAotMode, toggleAotMode } = useTheme();

  const handleThemeToggle = () => {
    toggleAotMode();
  };

  const navItems = [
    {
      label: "Today's Tasks",
      icon: FaTasks,
      path: '/daily-tasks',
      aotIcon: sidebarIcon1,
    },
    {
      label: 'Calendar View',
      icon: CalendarIcon,
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
  ];

  return (
    <Box
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isAotMode ? 'aot-mode' : ''}`}
      position="relative"
    >
      <VStack spacing={6} align="stretch">
        <Box px={isCollapsed ? 4 : 8} mb={2}>
          <ProfileDropdown isCollapsed={isCollapsed} />
        </Box>
    
        <Box px={isCollapsed ? 4 : 8}>
          <Flex justify="center" align="center">
            <Tooltip
              label={isAotMode ? "Disable Attack on Titan Theme" : "Enable Attack on Titan Theme"}
              placement="right"
              hasArrow
            >
              <IconButton
                aria-label="Toggle Theme"
                icon={
                  <img
                    src={attackingTitanIcon}
                    alt="Attack Titan"
                    width="32"
                    height="32"
                  />
                }
                onClick={handleThemeToggle}
                className={`theme-toggle ${isAotMode ? 'aot-mode' : ''}`}
              />
            </Tooltip>
          </Flex>
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
