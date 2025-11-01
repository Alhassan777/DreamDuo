import { Box, Flex, VStack, Text, Image, Select, Spacer } from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/StatusCard.css';

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
  const { isAotMode } = useTheme();
  const { status, selectedLogo, onLogoChange } = props;

  return (
    <Box
      className="status-card"
      data-aot-mode={isAotMode}
      p={3}
    >
      <Flex className="status-card-container">
        <VStack className="status-card-content">
          {selectedLogo && (
            <Image
              className="status-card-logo"
              src={selectedLogo.icon}
              alt={selectedLogo.label}
            />
          )}
          <VStack className="status-card-text">
            <Text className="status-card-label">
              {status.label}
            </Text>
            <Text className="status-card-description">
              {status.description}
            </Text>
          </VStack>
        </VStack>
        <Spacer />
        <Select
          className="status-card-select"
          size="sm"
          value={selectedLogo?.id || ''}
          onChange={(e) => onLogoChange(status.status, e.target.value)}
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