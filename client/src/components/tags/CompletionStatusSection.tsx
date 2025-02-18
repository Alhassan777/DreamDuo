import { VStack, Heading, SimpleGrid, Box, Text, Image, useRadioGroup, useRadio, UseRadioProps } from '@chakra-ui/react';
import { useState } from 'react';

type StatusIcon = {
  status: 'completed' | 'not_started' | 'in_progress' | 'finished';
  label: string;
  icon: string;
  description: string;
};

const DEFAULT_STATUS_ICONS: StatusIcon[] = [
  { 
    status: 'completed', 
    label: 'Survey Corps', 
    icon: '/icons/survey-corps.png',
    description: 'All tasks in the day are completed'
  },
  { 
    status: 'not_started', 
    label: 'Military Police', 
    icon: '/icons/military-police.png',
    description: 'Tasks assigned but not started'
  },
  { 
    status: 'in_progress', 
    label: 'Garrison Regiment', 
    icon: '/icons/garrison-regiment.png',
    description: 'Tasks are in progress'
  },
  { 
    status: 'finished', 
    label: 'Training Corps', 
    icon: '/icons/training-corps.png',
    description: 'All assigned tasks are finished'
  }
];

interface StatusCardProps extends UseRadioProps {
  icon: StatusIcon;
}

const StatusCard = (props: StatusCardProps) => {
  const { icon, ...radioProps } = props;
  const { getInputProps, getRadioProps } = useRadio(radioProps);

  return (
    <Box as="label">
      <input {...getInputProps()} />
      <Box
        {...getRadioProps()}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        boxShadow="md"
        _checked={{
          bg: 'purple.600',
          borderColor: 'purple.500',
        }}
        px={5}
        py={3}
      >
        <VStack>
          <Image
            src={icon.icon}
            alt={icon.label}
            boxSize="50px"
            objectFit="contain"
          />
          <VStack spacing={1}>
            <Text color="white" fontSize="sm" fontWeight="bold">{icon.label}</Text>
            <Text color="gray.300" fontSize="xs" textAlign="center">{icon.description}</Text>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

const CompletionStatusSection = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('not_started');

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'completionStatus',
    defaultValue: 'not_started',
    onChange: setSelectedStatus,
  });

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="white">Completion Status Icons</Heading>
      
      <SimpleGrid columns={4} spacing={4} {...getRootProps()}>
        {DEFAULT_STATUS_ICONS.map((icon) => {
          const radio = getRadioProps({ value: icon.status });
          return (
            <StatusCard
              key={icon.status}
              icon={icon}
              {...radio}
            />
          );
        })}
      </SimpleGrid>
    </VStack>
  );
};

export default CompletionStatusSection;