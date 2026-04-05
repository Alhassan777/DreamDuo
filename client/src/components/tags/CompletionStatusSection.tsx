import { VStack, Heading, SimpleGrid } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { tagsService } from '../../services/tags';
import { useToast } from '@chakra-ui/react';
import StatusCard, { AVAILABLE_LOGOS } from './StatusCard';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/CompletionStatusSection.css';

type StatusIcon = {
  status: 'free' | 'not_started' | 'in_progress' | 'finished';
  label: string;
  description: string;
};

const STATUS_OPTIONS: StatusIcon[] = [
  { 
    status: 'free', 
    label: 'Free Day', 
    description: 'No tasks scheduled. Enjoy your day off!'
  },
  { 
    status: 'not_started', 
    label: 'Ready to Start', 
    description: 'Tasks are waiting for you. Time to get going!'
  },
  { 
    status: 'in_progress', 
    label: 'In Progress', 
    description: 'Making progress! Keep up the great work.'
  },
  { 
    status: 'finished', 
    label: 'All Done', 
    description: 'Great job! All tasks completed for today.'
  }
];

const CompletionStatusSection = () => {
  const [statusLogoMap, setStatusLogoMap] = useState<Record<string, string>>({});
  const toast = useToast();
  const { isAotMode } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logosData = await tagsService.getStatusLogos();
        setStatusLogoMap(logosData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error fetching data',
          description: 'Could not load status logos',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    fetchData();
  }, [toast]);

  const handleLogoChange = async (statusId: string, logoId: string) => {
    try {
      if (logoId === '') {
        await tagsService.updateStatusLogo(statusId, null);
        setStatusLogoMap(prev => {
          const newMap = { ...prev };
          delete newMap[statusId];
          return newMap;
        });
        return;
      }

      await tagsService.updateStatusLogo(statusId, logoId);

      setStatusLogoMap(prev => {
        const newMap = { ...prev };
        const existingStatusWithLogo = Object.entries(newMap).find(
          ([currentStatus, currentLogo]) => currentLogo === logoId && currentStatus !== statusId
        );

        if (existingStatusWithLogo) {
          delete newMap[existingStatusWithLogo[0]];
        }

        newMap[statusId] = logoId;
        return newMap;
      });

      toast({
        title: 'Status icon updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating status logo:', error);
      toast({
        title: 'Error updating status icon',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getSelectedLogo = (statusId: string) => {
    const logoId = statusLogoMap[statusId];
    return AVAILABLE_LOGOS.find(logo => logo.id === logoId);
  };

  return (
    <VStack align="stretch" spacing={4} className="completion-status-section" data-aot-mode={isAotMode}>
      <Heading size="md" className="completion-status-heading">
        Daily Task Progress
      </Heading>
      
      <SimpleGrid columns={4} spacing={4} className="completion-status-grid">
        {STATUS_OPTIONS.map((status) => (
          <StatusCard
            key={status.status}
            status={status}
            selectedLogo={getSelectedLogo(status.status)}
            onLogoChange={handleLogoChange}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default CompletionStatusSection;
