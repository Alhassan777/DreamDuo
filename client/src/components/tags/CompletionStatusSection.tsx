import { VStack, Heading, SimpleGrid } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { tagsService } from '../../services/tags';
import { useToast } from '@chakra-ui/react';
import StatusCard from './StatusCard';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/CompletionStatusSection.css';

type StatusIcon = {
  status: 'free' | 'not_started' | 'in_progress' | 'finished';
  label: string;
  description: string;
};

type Logo = {
  id: string;
  label: string;
  icon: string;
};

const STATUS_OPTIONS: StatusIcon[] = [
  { 
    status: 'free', 
    label: 'Off Duty', 
    description: 'No orders today. But a soldier’s duty never truly ends'
  },
  { 
    status: 'not_started', 
    label: 'Mission Pending', 
    description: "Tasks assigned but not started yet. Shinzou wo Sasageyo!!"
  },
  { 
    status: 'in_progress', 
    label: 'Battle Underway', 
    description: 'Some tasks completed, but work remains. Susume!'
  },
  { 
    status: 'finished', 
    label: 'Mission Accomplished', 
    description: 'All tasks completed. You gave everything for this mission!!'
  }
];

const AVAILABLE_LOGOS: Logo[] = [
  {
    id: 'survey_corps',
    label: 'Survey Corps',
    icon: '/src/assets/survey_corps.png'
  },
  {
    id: 'military_police',
    label: 'Military Police',
    icon: '/src/assets/police.png'
  },
  {
    id: 'garrison',
    label: 'Garrison Regiment',
    icon: '/src/assets/garrison.png'
  },
  {
    id: 'training',
    label: 'Training Corps',
    icon: '/src/assets/training_corps.png'
  }
];

const CompletionStatusSection = () => {
  const [statusLogoMap, setStatusLogoMap] = useState<Record<string, string>>({});
  const toast = useToast();
  const { isAotMode } = useTheme();

  // Fetch status logos from the backend when component mounts
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
      // If logoId is empty, remove the mapping
      if (logoId === '') {
        await tagsService.updateStatusLogo(statusId, null);
        setStatusLogoMap(prev => {
          const newMap = { ...prev };
          delete newMap[statusId];
          return newMap;
        });
        return;
      }

      // Update the mapping in the backend
      await tagsService.updateStatusLogo(statusId, logoId);

      setStatusLogoMap(prev => {
        const newMap = { ...prev };
        // Find if the logo is used by another status
        const existingStatusWithLogo = Object.entries(newMap).find(
          ([currentStatus, currentLogo]) => currentLogo === logoId && currentStatus !== statusId
        );

        // If logo is used, remove it from the previous status
        if (existingStatusWithLogo) {
          delete newMap[existingStatusWithLogo[0]];
        }

        // Assign the logo to the new status
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