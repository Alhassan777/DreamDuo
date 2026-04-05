import { Box, Flex, VStack, Text, Image, Select, Spacer } from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/StatusCard.css';

import surveyCorpsImg from '../../assets/survey_corps.png';
import policeImg from '../../assets/police.png';
import garrisonImg from '../../assets/garrison.png';
import trainingCorpsImg from '../../assets/training_corps.png';

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
    label: 'Relaxed',
    icon: surveyCorpsImg,
  },
  {
    id: 'military_police',
    label: 'Focused',
    icon: policeImg,
  },
  {
    id: 'garrison',
    label: 'Steady',
    icon: garrisonImg,
  },
  {
    id: 'training',
    label: 'Learning',
    icon: trainingCorpsImg,
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