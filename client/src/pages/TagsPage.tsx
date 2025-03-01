import { Box, VStack, Heading, Container, useColorModeValue } from '@chakra-ui/react';
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TaskCategoriesSection from '../components/tags/TaskCategoriesSection';
import PriorityColorSection from '../components/tags/PriorityColorSection';
import CompletionStatusSection from '../components/tags/CompletionStatusSection';
import { useTheme } from '../contexts/ThemeContext';
import './styles/TagsPage.css';

const TagsPage = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const { isAotMode } = useTheme();

  return (
    <DashboardLayout>
      <div className="tags-page-wrapper" data-aot-mode={isAotMode}>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading color="white" mb={6} className='heading_text' data-aot-mode={isAotMode}>Tags Management</Heading>
          <VStack spacing={8} align="stretch">
            {/* Task Categories Section */}
            <Box
              bg={useColorModeValue('gray.800', 'gray.700')}
              p={6}
              borderRadius="lg"
              boxShadow="lg"
            >
              <TaskCategoriesSection categories={categories} setCategories={setCategories} />
            </Box>

            {/* Priority Colors Section */}
            <Box
              bg={useColorModeValue('gray.800', 'gray.700')}
              p={6}
              borderRadius="lg"
              boxShadow="lg"
            >
              <PriorityColorSection />
            </Box>

            {/* Completion Status Icons Section */}
            <Box
              bg={useColorModeValue('gray.800', 'gray.700')}
              p={6}
              borderRadius="lg"
              boxShadow="lg"
            >
              <CompletionStatusSection />
            </Box>
          </VStack>
        </Box>
      </Container>
      </div>
    </DashboardLayout>
  );
};

export default TagsPage;