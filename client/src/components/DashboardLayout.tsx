import { Box, Flex } from '@chakra-ui/react';
import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <Flex minH="100vh" bg="gray.900">
      <Sidebar />
      <Box flex="1" p={8} ml="250px">
        {children}
      </Box>
    </Flex>
  );
};

export default DashboardLayout;