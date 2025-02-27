import { Box, Flex, VStack, Text, Image, Select, Spacer } from '@chakra-ui/react';

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

export const AVAILABLE_LOGOS: Logo[] = [
  {
    id: 'survey_corps',
    label: 'Survey Corps',
    icon: '/src/assets/survey_corps.png',
  },
  {
    id: 'military_police',
    label: 'Military Police',
    icon: '/src/assets/police.png',
  },
  {
    id: 'garrison',
    label: 'Garrison Regiment',
    icon: '/src/assets/garrison.png',
  },
  {
    id: 'training',
    label: 'Training Corps',
    icon: '/src/assets/training_corps.png',
  },
];

interface StatusCardProps {
  status: StatusIcon;
  selectedLogo: Logo | undefined;
  onLogoChange: (statusId: string, logoId: string) => void;
}

const StatusCard = (props: StatusCardProps) => {
  const { status, selectedLogo, onLogoChange } = props;

  // Define fixed heights for collapsed and stretched states.
  const collapsedHeight = '150px';
  const stretchedHeight = '200px';

  // Use the stretched height if a valid logo is selected, otherwise use collapsed height.
  const cardHeight = selectedLogo ? stretchedHeight : collapsedHeight;

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      boxShadow="md"
      bg="whiteAlpha.100"
      px={5}
      py={3}
      h={cardHeight}
      transition="height 0.3s ease"
    >
      <Flex direction="column" h="100%">
        <VStack spacing={4} alignItems="center">
          {selectedLogo && (
            <Image
              src={selectedLogo.icon}
              alt={selectedLogo.label}
              boxSize="50px"
              objectFit="contain"
            />
          )}
          <VStack spacing={1} alignItems="center">
            <Text color="white" fontSize="sm" fontWeight="bold">
              {status.label}
            </Text>
            <Text color="gray.300" fontSize="xs" textAlign="center">
              {status.description}
            </Text>
          </VStack>
        </VStack>
        <Spacer />
        <Select
          size="sm"
          value={selectedLogo?.id || ''}
          onChange={(e) => onLogoChange(status.status, e.target.value)}
          bg="whiteAlpha.200"
          color="white"
        >
          <option value="">Select a logo</option>
          {AVAILABLE_LOGOS.map((logo) => (
            <option key={logo.id} value={logo.id}>
              {logo.label}
            </option>
          ))}
        </Select>
      </Flex>
    </Box>
  );
};

export default StatusCard;
export type { StatusIcon, Logo };