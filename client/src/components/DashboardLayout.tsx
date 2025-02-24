import { Box, Flex } from '@chakra-ui/react';
import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  return (
    <Flex minH="100vh" position="relative">
      <Sidebar onCollapse={handleSidebarCollapse} />
      <Box
        flex="1"
        p={0}
        transition="all 0.3s ease-in-out"
        minH="100vh"
        w="100%"
        ml={0}
      >
        {children}
      </Box>
    </Flex>
  );
};

export default DashboardLayout;