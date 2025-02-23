import { VStack, Box, Icon, Text, Flex, IconButton, Tooltip, IconProps } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaTasks, FaHashtag, FaChartPie } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { ComponentWithAs } from '@chakra-ui/react';
import ProfileDropdown from './ProfileDropdown';
import { useState } from 'react';
import attackingTitanIcon from '../assets/attacking_titan.png';
import sidebarIcon1 from '../assets/sidebar_icon1.png';
import sidebarIcon2 from '../assets/sidebar_icon2.png';
import sidebarIcon3 from '../assets/sidebar_icon3.png';
import sidebarIcon4 from '../assets/sidebar_icon4.png';
import { useTheme } from '../contexts/ThemeContext';

interface IconWrapperProps {
  icon: IconType | ComponentWithAs<"svg", IconProps>;
  aotIcon?: string;
  isAotMode: boolean;
  boxSize?: number;
  mr?: number;
}

const IconWrapper = ({ icon: Icon, aotIcon, isAotMode, boxSize = 6, mr = 6 }: IconWrapperProps) => {
  if (isAotMode && aotIcon) {
    return <img src={aotIcon} alt="icon" style={{ width: `${boxSize * 6}px`, height: `${boxSize * 6}px`, marginRight: `${mr * 2}px` }} />;
  }
  return <Box display="flex" alignItems="center" justifyContent="center" minWidth={`${boxSize * 4}px`}>
    <Icon boxSize={boxSize} mr={mr} />
  </Box>;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAotMode, toggleAotMode } = useTheme();

  const handleThemeToggle = () => {
    toggleAotMode();
  };

  const navItems = [
    {
      label: "Today's Tasks",
      icon: FaTasks,
      path: '/daily-tasks',
      aotIcon: sidebarIcon1
    },
    {
      label: 'Calendar View',
      icon: CalendarIcon,
      path: '/calendar',
      aotIcon: sidebarIcon2
    },
    {
      label: 'Dashboard',
      icon: FaChartPie,
      path: '/dashboard',
      aotIcon: sidebarIcon3
    },
    {
      label: 'Tags',
      icon: FaHashtag,
      path: '/tags',
      aotIcon: sidebarIcon4
    }
  ];

  return (
    <Box
      position="fixed"
      left={0}
      w={isCollapsed ? "80px" : "250px"}
      h="100vh"
      bg={isAotMode ? "#1D1D1D" : "gray.800"}
      borderRight="1px"
      borderColor={isAotMode ? "#463A2E" : "gray.700"}
      py={8}
      transition="width 0.3s ease"
      sx={{
        '& + *': {
          marginLeft: isCollapsed ? "80px" : "250px",
          transition: "margin-left 0.3s ease"
        }
      }}
    >
      <IconButton
        aria-label="Toggle Sidebar"
        icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        position="absolute"
        right="-12px"
        bottom="20px"
        transform="none"
        onClick={() => setIsCollapsed(!isCollapsed)}
        bg={isAotMode ? "#2A1F1A" : "gray.700"}
        color={isAotMode ? "#C1A173" : "white"}
        _hover={{ bg: isAotMode ? '#463A2E' : 'gray.600' }}
        size="sm"
        zIndex={2}
      />
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
                icon={<img src={attackingTitanIcon} alt="Attack Titan" width="32" height="32" />}
                onClick={handleThemeToggle}
                bg={isAotMode ? '#8B0000' : 'gray.700'}
                color={isAotMode ? '#E5D5B7' : 'gray.400'}
                borderRadius="full"
                w="50px"
                h="50px"
                _hover={{ 
                  transform: 'rotateY(180deg)',
                  bg: isAotMode ? '#A52A2A' : 'gray.600'
                }}
                transition="all 0.6s"
                style={{ transformStyle: 'preserve-3d' }}
                position="relative"
              />
            </Tooltip>
          </Flex>
        </Box>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Flex
              key={item.path}
              align="center"
              px={isCollapsed ? 4 : 6}
              py={2}
              cursor="pointer"
              bg={isActive ? (isAotMode ? '#2A1F1A' : 'gray.700') : 'transparent'}
              color={isActive ? (isAotMode ? '#E5D5B7' : 'white') : (isAotMode ? '#C1A173' : 'gray.400')}
              _hover={{
                bg: isAotMode ? '#2A1F1A' : 'gray.700',
                color: isAotMode ? '#E5D5B7' : 'white'
              }}
              onClick={() => navigate(item.path)}
              justifyContent={isCollapsed ? "center" : "flex-start"}
              alignItems="center"
              gap={3}
            >
              <IconWrapper
                icon={item.icon}
                aotIcon={item.aotIcon}
                isAotMode={isAotMode}
                boxSize={6}
                mr={isCollapsed ? 0 : 3}
              />
              {!isCollapsed && <Text fontSize="lg" fontWeight="bold">{item.label}</Text>}
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;