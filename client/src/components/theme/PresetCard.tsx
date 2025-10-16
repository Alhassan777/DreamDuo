import { Box, Badge, VStack, HStack, Text } from '@chakra-ui/react';
import { ThemePreset } from '../../config/themePresets';

interface PresetCardProps {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
}

const PresetCard = ({ preset, isSelected, onSelect }: PresetCardProps) => {
  return (
    <Box
      onClick={onSelect}
      cursor="pointer"
      borderWidth="2px"
      borderColor={isSelected ? preset.colors.primary : preset.colors.border}
      borderRadius="md"
      p={4}
      bg={preset.colors.cardBackground}
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      }}
      position="relative"
    >
      {isSelected && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme="green"
          fontSize="xs"
        >
          Active
        </Badge>
      )}
      
      <VStack align="stretch" spacing={3}>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={preset.colors.text}
          fontFamily={preset.typography.fontFamily}
        >
          {preset.name}
        </Text>
        
        <Text
          fontSize="sm"
          color={preset.colors.textSecondary}
          noOfLines={2}
        >
          {preset.description}
        </Text>
        
        {/* Color palette preview */}
        <HStack spacing={1} flexWrap="wrap">
          <Box
            w="24px"
            h="24px"
            bg={preset.colors.primary}
            borderRadius="sm"
            title="Primary"
          />
          <Box
            w="24px"
            h="24px"
            bg={preset.colors.secondary}
            borderRadius="sm"
            title="Secondary"
          />
          <Box
            w="24px"
            h="24px"
            bg={preset.colors.accent}
            borderRadius="sm"
            title="Accent"
          />
          <Box
            w="24px"
            h="24px"
            bg={preset.colors.success}
            borderRadius="sm"
            title="Success"
          />
          <Box
            w="24px"
            h="24px"
            bg={preset.colors.warning}
            borderRadius="sm"
            title="Warning"
          />
          <Box
            w="24px"
            h="24px"
            bg={preset.colors.error}
            borderRadius="sm"
            title="Error"
          />
        </HStack>
        
        {/* Accessibility features */}
        {preset.accessibilityFeatures.length > 0 && (
          <HStack spacing={1} flexWrap="wrap" mt={2}>
            {preset.accessibilityFeatures.map((feature, index) => (
              <Badge
                key={index}
                fontSize="xs"
                colorScheme="blue"
                variant="subtle"
              >
                {feature}
              </Badge>
            ))}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default PresetCard;

