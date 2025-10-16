import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Heading,
} from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';

const LivePreview = () => {
  const { currentTheme } = useTheme();

  return (
    <Box
      bg={currentTheme.colors.background}
      p={6}
      borderRadius="md"
      borderWidth="1px"
      borderColor={currentTheme.colors.border}
    >
      <VStack align="stretch" spacing={4}>
        <Heading
          size="md"
          color={currentTheme.colors.text}
          fontFamily={currentTheme.typography.headingFontFamily || currentTheme.typography.fontFamily}
        >
          Live Preview
        </Heading>

        <Text color={currentTheme.colors.textSecondary} fontSize="sm">
          This preview updates in real-time as you customize your theme
        </Text>

        {/* Buttons */}
        <HStack spacing={3} flexWrap="wrap">
          <Button
            bg={currentTheme.colors.primary}
            color={currentTheme.colors.text}
            _hover={{ opacity: 0.9 }}
            borderRadius={`${currentTheme.shapes.borderRadiusMd}px`}
            size="sm"
          >
            Primary Button
          </Button>
          <Button
            bg={currentTheme.colors.secondary}
            color={currentTheme.colors.text}
            _hover={{ opacity: 0.9 }}
            borderRadius={`${currentTheme.shapes.borderRadiusMd}px`}
            size="sm"
          >
            Secondary
          </Button>
          <Button
            bg={currentTheme.colors.success}
            color={currentTheme.colors.text}
            _hover={{ opacity: 0.9 }}
            borderRadius={`${currentTheme.shapes.borderRadiusMd}px`}
            size="sm"
          >
            Success
          </Button>
          <Button
            bg={currentTheme.colors.warning}
            color={currentTheme.colors.text}
            _hover={{ opacity: 0.9 }}
            borderRadius={`${currentTheme.shapes.borderRadiusMd}px`}
            size="sm"
          >
            Warning
          </Button>
          <Button
            bg={currentTheme.colors.error}
            color={currentTheme.colors.text}
            _hover={{ opacity: 0.9 }}
            borderRadius={`${currentTheme.shapes.borderRadiusMd}px`}
            size="sm"
          >
            Error
          </Button>
        </HStack>

        {/* Input */}
        <Input
          placeholder="Sample input field"
          bg={currentTheme.colors.surface}
          borderColor={currentTheme.colors.border}
          color={currentTheme.colors.text}
          borderRadius={`${currentTheme.shapes.borderRadiusSm}px`}
          _placeholder={{ color: currentTheme.colors.textSecondary }}
          size="sm"
        />

        {/* Sample Card */}
        <Card
          bg={currentTheme.colors.cardBackground}
          borderRadius={`${currentTheme.shapes.borderRadiusLg}px`}
          borderColor={currentTheme.colors.border}
          borderWidth="1px"
          opacity={currentTheme.effects.cardOpacity}
        >
          <CardHeader pb={2}>
            <HStack justify="space-between">
              <Text
                fontWeight="bold"
                color={currentTheme.colors.text}
                fontSize={`${currentTheme.typography.fontSize}px`}
                fontFamily={currentTheme.typography.fontFamily}
              >
                Sample Task Card
              </Text>
              <Badge
                bg={currentTheme.colors.accent}
                color={currentTheme.colors.text}
                borderRadius={`${currentTheme.shapes.borderRadiusSm}px`}
                px={2}
                py={1}
                fontSize="xs"
              >
                High Priority
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={2}>
            <Text
              color={currentTheme.colors.textSecondary}
              fontSize="sm"
              lineHeight={currentTheme.typography.lineHeight}
              fontFamily={currentTheme.typography.fontFamily}
            >
              This is a sample task description to show how your content will look
              with the selected theme. Notice the font, colors, and spacing.
            </Text>
            <HStack mt={3} spacing={2}>
              <Badge
                colorScheme="green"
                fontSize="xs"
                borderRadius={`${currentTheme.shapes.borderRadiusSm}px`}
              >
                Work
              </Badge>
              <Badge
                colorScheme="blue"
                fontSize="xs"
                borderRadius={`${currentTheme.shapes.borderRadiusSm}px`}
              >
                Important
              </Badge>
            </HStack>
          </CardBody>
        </Card>

        {/* Typography Sample */}
        <Box
          p={4}
          bg={currentTheme.colors.surface}
          borderRadius={`${currentTheme.shapes.borderRadiusMd}px`}
          borderWidth="1px"
          borderColor={currentTheme.colors.border}
        >
          <Text
            fontSize={`${currentTheme.typography.fontSize}px`}
            fontFamily={currentTheme.typography.fontFamily}
            fontWeight={currentTheme.typography.fontWeight}
            lineHeight={currentTheme.typography.lineHeight}
            color={currentTheme.colors.text}
          >
            The quick brown fox jumps over the lazy dog. This sentence contains every letter
            of the alphabet to help you preview your font choices.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default LivePreview;

