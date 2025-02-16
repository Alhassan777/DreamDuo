import { VStack, Box, Icon, Text, Flex } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarIcon } from '@chakra-ui/icons';
import { FaTasks, FaHashtag, FaChartPie } from 'react-icons/fa';
import ProfileDropdown from './ProfileDropdown';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      w="250px"
      h="100vh"
      bg="gray.800"
      borderRight="1px"
      borderColor="gray.700"
      py={8}
    >
      <VStack spacing={6} align="stretch">
        <Box px={8} mb={2}>
          <ProfileDropdown />
        </Box>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Flex
              key={item.path}
              align="center"
              px={8}
              py={3}
              cursor="pointer"
              bg={isActive ? 'gray.700' : 'transparent'}
              color={isActive ? 'white' : 'gray.400'}
              _hover={{
                bg: 'gray.700',
                color: 'white'
              }}
              onClick={() => navigate(item.path)}
            >
              <Icon
                as={item.icon}
                boxSize={5}
                mr={4}
              />
              <Text fontSize="md">{item.label}</Text>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;