import { VStack, Heading, SimpleGrid, Box, Text, Image, Select } from '@chakra-ui/react';
import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import StatusCard from './StatusCard';

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
    label: 'Free', 
    description: 'No tasks assigned today'
  },
  { 
    status: 'not_started', 
    label: 'Not Started', 
    description: "Didn't start any of the assigned tasks today"
  },
  { 
    status: 'in_progress', 
    label: 'In Progress', 
    description: 'Finished some of the tasks assigned today'
  },
  { 
    status: 'finished', 
    label: 'Finished', 
    description: 'Finished all the tasks started today'
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

  const handleLogoChange = (statusId: string, logoId: string) => {
    if (logoId === '') {
      setStatusLogoMap(prev => {
        const newMap = { ...prev };
        delete newMap[statusId];
        return newMap;
      });
      return;
    }

    // Check if the logo is already used in another status
    const existingStatusWithLogo = Object.entries(statusLogoMap).find(
      ([currentStatus, currentLogo]) => currentLogo === logoId && currentStatus !== statusId
    );

    if (existingStatusWithLogo) {
      const statusWithLogo = STATUS_OPTIONS.find(s => s.status === existingStatusWithLogo[0]);
      toast({
        title: 'Logo Already in Use',
        description: `This logo is already assigned to the '${statusWithLogo?.label}' status. Please choose a different logo.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setStatusLogoMap(prev => ({
      ...prev,
      [statusId]: logoId
    }));
  };

  const getSelectedLogo = (statusId: string) => {
    const logoId = statusLogoMap[statusId];
    return AVAILABLE_LOGOS.find(logo => logo.id === logoId);
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="white">Completion Status Icons</Heading>
      
      <SimpleGrid columns={4} spacing={4} alignItems="flex-start">
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