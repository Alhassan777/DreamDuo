import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  HStack,
  VStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  showContrastCheck?: boolean;
  contrastBackground?: string;
}

const ColorPicker = ({
  label,
  value,
  onChange,
  showContrastCheck = false,
  contrastBackground = '#FFFFFF',
}: ColorPickerProps) => {
  const { currentTheme } = useTheme();
  const [contrastRatio, setContrastRatio] = useState<number>(0);
  const [wcagLevel, setWcagLevel] = useState<string>('');

  // Calculate relative luminance
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  // Calculate contrast ratio
  const getContrastRatio = (color1: string, color2: string): number => {
    try {
      const lum1 = getLuminance(color1);
      const lum2 = getLuminance(color2);
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    } catch {
      return 0;
    }
  };

  // Determine WCAG level
  const getWCAGLevel = (ratio: number): string => {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA Large';
    return 'Fail';
  };

  useEffect(() => {
    if (showContrastCheck && value && contrastBackground) {
      const ratio = getContrastRatio(value, contrastBackground);
      setContrastRatio(ratio);
      setWcagLevel(getWCAGLevel(ratio));
    }
  }, [value, contrastBackground, showContrastCheck]);

  const getContrastBadgeColor = (level: string): string => {
    if (level === 'AAA') return 'green';
    if (level === 'AA') return 'blue';
    if (level === 'AA Large') return 'yellow';
    return 'red';
  };

  return (
    <FormControl>
      <FormLabel 
        fontSize="sm" 
        fontWeight="medium"
        color={currentTheme.colors.text}
      >
        {label}
      </FormLabel>
      <VStack align="stretch" spacing={2}>
        <HStack spacing={2}>
          <Input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            w="60px"
            h="40px"
            p={1}
            cursor="pointer"
            borderColor={currentTheme.colors.border}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            fontFamily="monospace"
            fontSize="sm"
            textTransform="uppercase"
            bg={currentTheme.colors.cardBackground}
            color={currentTheme.colors.text}
            borderColor={currentTheme.colors.border}
            _placeholder={{ color: currentTheme.colors.textSecondary }}
          />
        </HStack>
        
        {showContrastCheck && contrastRatio > 0 && (
          <HStack justify="space-between" fontSize="xs">
            <Text color={currentTheme.colors.textSecondary}>
              Contrast Ratio: {contrastRatio.toFixed(2)}:1
            </Text>
            <Badge colorScheme={getContrastBadgeColor(wcagLevel)}>
              WCAG {wcagLevel}
            </Badge>
          </HStack>
        )}
      </VStack>
    </FormControl>
  );
};

export default ColorPicker;

