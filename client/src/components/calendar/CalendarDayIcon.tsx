import { Box, Image } from '@chakra-ui/react';
import { AVAILABLE_LOGOS } from '../tags/StatusCard';

interface CalendarDayIconProps {
  totalTasks: number;
  completedTasks: number;
  statusLogoMap: Record<string, string>;
}

const CalendarDayIcon: React.FC<CalendarDayIconProps> = ({ totalTasks, completedTasks, statusLogoMap }) => {
  const getStatusForDay = () => {
    if (totalTasks === 0) return 'free';
    if (completedTasks === 0) return 'not_started';
    if (completedTasks === totalTasks) return 'finished';
    return 'in_progress';
  };

  const status = getStatusForDay();
  const logoId = statusLogoMap[status];
  const logo = AVAILABLE_LOGOS.find(l => l.id === logoId);

  if (!logo) return null;

  return (
    <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" width="70px" height="70px">
      <Image
        src={logo.icon}
        alt={logo.label}
        width="100%"
        height="100%"
        objectFit="contain"
      />
    </Box>
  );
};

export default CalendarDayIcon;