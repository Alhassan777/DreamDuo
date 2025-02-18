import { VStack, Box, Icon, Text, Flex, IconButton } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaTasks, FaHashtag, FaChartPie } from 'react-icons/fa';
import ProfileDropdown from './ProfileDropdown';
import { useState } from 'react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      label: "Today's Tasks",
      icon: FaTasks,
      path: '/daily-tasks'
    },
    {
      label: 'Calendar View',
      icon: CalendarIcon,
      path: '/calendar'
    },
    {
      label: 'Performance Dashboard',
      icon: FaChartPie,
      path: '/dashboard'
    },
    {
      label: 'Tags',
      icon: FaHashtag,
      path: '/tags'
    }
  ];

  return (
    <Box
      position="fixed"
      left={0}
      w={isCollapsed ? "80px" : "250px"}
      h="100vh"
      bg="gray.800"
      borderRight="1px"
      borderColor="gray.700"
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
        top="50%"
        transform="translateY(-50%)"
        onClick={() => setIsCollapsed(!isCollapsed)}
        bg="gray.700"
        color="white"
        _hover={{ bg: 'gray.600' }}
        size="sm"
        zIndex={2}
      />
      <VStack spacing={6} align="stretch">
        <Box px={isCollapsed ? 4 : 8} mb={2}>
          <ProfileDropdown isCollapsed={isCollapsed} />
        </Box>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Flex
              key={item.path}
              align="center"
              px={isCollapsed ? 4 : 8}
              py={3}
              cursor="pointer"
              bg={isActive ? 'gray.700' : 'transparent'}
              color={isActive ? 'white' : 'gray.400'}
              _hover={{
                bg: 'gray.700',
                color: 'white'
              }}
              onClick={() => navigate(item.path)}
              justifyContent={isCollapsed ? "center" : "flex-start"}
            >
              <Icon
                as={item.icon}
                boxSize={5}
                mr={isCollapsed ? 0 : 4}
              />
              {!isCollapsed && <Text fontSize="md">{item.label}</Text>}
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;