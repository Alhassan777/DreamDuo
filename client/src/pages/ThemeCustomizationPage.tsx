import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  useToast,
} from '@chakra-ui/react';
import DashboardLayout from '../components/DashboardLayout';
import PresetCard from '../components/theme/PresetCard';
import ColorPicker from '../components/theme/ColorPicker';
import LivePreview from '../components/theme/LivePreview';
import { useTheme } from '../contexts/ThemeContext';
import { themePresets } from '../config/themePresets';
import { exportTheme, importTheme } from '../services/theme';
import './styles/ThemeCustomizationPage.css';

const ThemeCustomizationPage = () => {
  const toast = useToast();
  const {
    currentTheme,
    currentPresetId,
    isCustomTheme,
    setThemePreset,
    updateThemeColors,
    updateThemeTypography,
    updateThemeShapes,
    updateThemeSpacing,
    updateThemeEffects,
    saveToBackend,
    resetToDefault,
  } = useTheme();

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track when changes are made
  useEffect(() => {
    if (isCustomTheme) {
      setHasUnsavedChanges(true);
    }
  }, [currentTheme, isCustomTheme]);

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      await saveToBackend();
      setHasUnsavedChanges(false);
      toast({
        title: 'Theme saved successfully',
        description: 'Your theme preferences have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving theme',
        description: 'Failed to save theme preferences. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetSelect = async (presetId: string) => {
    setThemePreset(presetId);
    setHasUnsavedChanges(false);
    // Auto-save preset selections
    try {
      await saveToBackend();
      toast({
        title: 'Theme applied',
        description: `${presetId} theme has been applied and saved.`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const handleResetToDefault = () => {
    resetToDefault();
    toast({
      title: 'Theme reset',
      description: 'Theme has been reset to default.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleExportTheme = () => {
    const themeJson = exportTheme(currentTheme);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-${currentTheme.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Theme exported',
      description: 'Theme has been exported to a JSON file.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const theme = importTheme(content);
      
      if (theme) {
        // Apply imported theme
        if (theme.colors) updateThemeColors(theme.colors);
        if (theme.typography) updateThemeTypography(theme.typography);
        if (theme.shapes) updateThemeShapes(theme.shapes);
        if (theme.spacing) updateThemeSpacing(theme.spacing);
        if (theme.effects) updateThemeEffects(theme.effects);

        toast({
          title: 'Theme imported',
          description: 'Theme has been imported successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Import failed',
          description: 'Invalid theme file format.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <Box 
        className="theme-customization-page" 
        p={6}
        bg={currentTheme.colors.background}
        minH="100vh"
      >
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading 
              size="xl" 
              mb={2}
              color={currentTheme.colors.text}
              fontFamily={currentTheme.typography.headingFontFamily || currentTheme.typography.fontFamily}
            >
              Theme Customization
            </Heading>
            <Text 
              color={currentTheme.colors.textSecondary} 
              fontSize="lg"
            >
              Personalize your experience with accessibility presets or create your own custom theme
            </Text>
            {hasUnsavedChanges && (
              <Text 
                color={currentTheme.colors.warning} 
                fontSize="sm"
                fontWeight="bold"
              >
                ⚠️ You have unsaved changes. Click "Save Theme" to persist your customizations.
              </Text>
            )}
          </Box>

          {/* Actions Bar */}
          <HStack spacing={3} flexWrap="wrap">
            <Button
              bg={currentTheme.colors.primary}
              color={currentTheme.colors.text}
              _hover={{ opacity: 0.9 }}
              onClick={handleSaveTheme}
              isLoading={isSaving}
              loadingText="Saving..."
              position="relative"
            >
              Save Theme
              {hasUnsavedChanges && (
                <Box
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  w="10px"
                  h="10px"
                  bg={currentTheme.colors.error}
                  borderRadius="full"
                />
              )}
            </Button>
            <Button 
              variant="outline" 
              borderColor={currentTheme.colors.border}
              color={currentTheme.colors.text}
              _hover={{ bg: currentTheme.colors.surface }}
              onClick={handleResetToDefault}
            >
              Reset to Default
            </Button>
            <Button 
              variant="outline"
              borderColor={currentTheme.colors.border}
              color={currentTheme.colors.text}
              _hover={{ bg: currentTheme.colors.surface }}
              onClick={handleExportTheme}
            >
              Export Theme
            </Button>
            <Button
              variant="outline"
              borderColor={currentTheme.colors.border}
              color={currentTheme.colors.text}
              _hover={{ bg: currentTheme.colors.surface }}
              as="label"
              htmlFor="import-theme"
              cursor="pointer"
            >
              Import Theme
              <input
                id="import-theme"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportTheme}
              />
            </Button>
          </HStack>

          {/* Preset Gallery */}
          <Box>
            <Heading 
              size="md" 
              mb={4}
              color={currentTheme.colors.text}
              fontFamily={currentTheme.typography.headingFontFamily || currentTheme.typography.fontFamily}
            >
              Accessibility Presets
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
              {themePresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={currentPresetId === preset.id && !isCustomTheme}
                  onSelect={() => handlePresetSelect(preset.id)}
                />
              ))}
            </SimpleGrid>
          </Box>

          {/* Custom Editor */}
          <Box>
            <VStack align="stretch" spacing={3}>
              <Heading 
                size="md"
                color={currentTheme.colors.text}
                fontFamily={currentTheme.typography.headingFontFamily || currentTheme.typography.fontFamily}
              >
                Custom Theme Editor
                {isCustomTheme && (
                  <Text as="span" fontSize="sm" color={currentTheme.colors.accent} ml={2}>
                    (Custom theme active)
                  </Text>
                )}
              </Heading>
              <Text fontSize="sm" color={currentTheme.colors.textSecondary}>
                💡 Changes apply instantly to the entire app! Use the Preview tab to see examples, or navigate to other pages to see your theme in action. Don't forget to click "Save Theme" to persist your changes.
              </Text>
            </VStack>

            <Tabs 
              variant="enclosed"
              bg={currentTheme.colors.surface}
              borderRadius={`${currentTheme.shapes.borderRadiusLg}px`}
              p={4}
              mt={4}
            >
              <TabList flexWrap="wrap" borderColor={currentTheme.colors.border}>
                <Tab 
                  color={currentTheme.colors.textSecondary}
                  _selected={{ 
                    color: currentTheme.colors.primary, 
                    borderColor: currentTheme.colors.primary 
                  }}
                >
                  Colors
                </Tab>
                <Tab 
                  color={currentTheme.colors.textSecondary}
                  _selected={{ 
                    color: currentTheme.colors.primary, 
                    borderColor: currentTheme.colors.primary 
                  }}
                >
                  Typography
                </Tab>
                <Tab 
                  color={currentTheme.colors.textSecondary}
                  _selected={{ 
                    color: currentTheme.colors.primary, 
                    borderColor: currentTheme.colors.primary 
                  }}
                >
                  Shapes
                </Tab>
                <Tab 
                  color={currentTheme.colors.textSecondary}
                  _selected={{ 
                    color: currentTheme.colors.primary, 
                    borderColor: currentTheme.colors.primary 
                  }}
                >
                  Spacing
                </Tab>
                <Tab 
                  color={currentTheme.colors.textSecondary}
                  _selected={{ 
                    color: currentTheme.colors.primary, 
                    borderColor: currentTheme.colors.primary 
                  }}
                >
                  Effects
                </Tab>
                <Tab 
                  color={currentTheme.colors.textSecondary}
                  _selected={{ 
                    color: currentTheme.colors.primary, 
                    borderColor: currentTheme.colors.primary 
                  }}
                >
                  Preview
                </Tab>
              </TabList>

              <TabPanels>
                {/* Colors Tab */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    <ColorPicker
                      label="Primary Color"
                      value={currentTheme.colors.primary}
                      onChange={(color) => updateThemeColors({ primary: color })}
                      showContrastCheck
                      contrastBackground={currentTheme.colors.background}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={currentTheme.colors.secondary}
                      onChange={(color) => updateThemeColors({ secondary: color })}
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={currentTheme.colors.accent}
                      onChange={(color) => updateThemeColors({ accent: color })}
                      showContrastCheck
                      contrastBackground={currentTheme.colors.background}
                    />
                    <ColorPicker
                      label="Background"
                      value={currentTheme.colors.background}
                      onChange={(color) => updateThemeColors({ background: color })}
                    />
                    <ColorPicker
                      label="Surface"
                      value={currentTheme.colors.surface}
                      onChange={(color) => updateThemeColors({ surface: color })}
                    />
                    <ColorPicker
                      label="Card Background"
                      value={currentTheme.colors.cardBackground}
                      onChange={(color) => updateThemeColors({ cardBackground: color })}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={currentTheme.colors.text}
                      onChange={(color) => updateThemeColors({ text: color })}
                      showContrastCheck
                      contrastBackground={currentTheme.colors.background}
                    />
                    <ColorPicker
                      label="Secondary Text"
                      value={currentTheme.colors.textSecondary}
                      onChange={(color) => updateThemeColors({ textSecondary: color })}
                      showContrastCheck
                      contrastBackground={currentTheme.colors.background}
                    />
                    <ColorPicker
                      label="Border Color"
                      value={currentTheme.colors.border}
                      onChange={(color) => updateThemeColors({ border: color })}
                    />
                    <ColorPicker
                      label="Success Color"
                      value={currentTheme.colors.success}
                      onChange={(color) => updateThemeColors({ success: color })}
                    />
                    <ColorPicker
                      label="Warning Color"
                      value={currentTheme.colors.warning}
                      onChange={(color) => updateThemeColors({ warning: color })}
                    />
                    <ColorPicker
                      label="Error Color"
                      value={currentTheme.colors.error}
                      onChange={(color) => updateThemeColors({ error: color })}
                    />
                    <ColorPicker
                      label="Info Color"
                      value={currentTheme.colors.info}
                      onChange={(color) => updateThemeColors({ info: color })}
                    />
                  </SimpleGrid>
                  
                  {/* Button Colors */}
                  <Heading size="md" mt={6} mb={4} color={currentTheme.colors.text}>Button Colors</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    <ColorPicker
                      label="Primary Button"
                      value={currentTheme.colors.buttonPrimary}
                      onChange={(color) => updateThemeColors({ buttonPrimary: color })}
                    />
                    <ColorPicker
                      label="Primary Button Hover"
                      value={currentTheme.colors.buttonPrimaryHover}
                      onChange={(color) => updateThemeColors({ buttonPrimaryHover: color })}
                    />
                    <ColorPicker
                      label="Primary Button Text"
                      value={currentTheme.colors.buttonPrimaryText}
                      onChange={(color) => updateThemeColors({ buttonPrimaryText: color })}
                    />
                    <ColorPicker
                      label="Secondary Button"
                      value={currentTheme.colors.buttonSecondary}
                      onChange={(color) => updateThemeColors({ buttonSecondary: color })}
                    />
                    <ColorPicker
                      label="Secondary Button Hover"
                      value={currentTheme.colors.buttonSecondaryHover}
                      onChange={(color) => updateThemeColors({ buttonSecondaryHover: color })}
                    />
                    <ColorPicker
                      label="Secondary Button Text"
                      value={currentTheme.colors.buttonSecondaryText}
                      onChange={(color) => updateThemeColors({ buttonSecondaryText: color })}
                    />
                    <ColorPicker
                      label="Danger Button"
                      value={currentTheme.colors.buttonDanger}
                      onChange={(color) => updateThemeColors({ buttonDanger: color })}
                    />
                    <ColorPicker
                      label="Danger Button Hover"
                      value={currentTheme.colors.buttonDangerHover}
                      onChange={(color) => updateThemeColors({ buttonDangerHover: color })}
                    />
                    <ColorPicker
                      label="Danger Button Text"
                      value={currentTheme.colors.buttonDangerText}
                      onChange={(color) => updateThemeColors({ buttonDangerText: color })}
                    />
                  </SimpleGrid>
                  
                  {/* Status Colors */}
                  <Heading size="md" mt={6} mb={4} color={currentTheme.colors.text}>Status Colors</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <ColorPicker
                      label="Pending"
                      value={currentTheme.colors.statusPending}
                      onChange={(color) => updateThemeColors({ statusPending: color })}
                    />
                    <ColorPicker
                      label="In Progress"
                      value={currentTheme.colors.statusInProgress}
                      onChange={(color) => updateThemeColors({ statusInProgress: color })}
                    />
                    <ColorPicker
                      label="Completed"
                      value={currentTheme.colors.statusCompleted}
                      onChange={(color) => updateThemeColors({ statusCompleted: color })}
                    />
                    <ColorPicker
                      label="Cancelled"
                      value={currentTheme.colors.statusCancelled}
                      onChange={(color) => updateThemeColors({ statusCancelled: color })}
                    />
                  </SimpleGrid>
                  
                  {/* Interactive States */}
                  <Heading size="md" mt={6} mb={4} color={currentTheme.colors.text}>Interactive States</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    <ColorPicker
                      label="Hover Overlay"
                      value={currentTheme.colors.hoverOverlay}
                      onChange={(color) => updateThemeColors({ hoverOverlay: color })}
                    />
                    <ColorPicker
                      label="Focus Ring"
                      value={currentTheme.colors.focusRing}
                      onChange={(color) => updateThemeColors({ focusRing: color })}
                    />
                    <ColorPicker
                      label="Active State"
                      value={currentTheme.colors.activeState}
                      onChange={(color) => updateThemeColors({ activeState: color })}
                    />
                  </SimpleGrid>
                  
                  {/* Chart Colors */}
                  <Heading size="md" mt={6} mb={4} color={currentTheme.colors.text}>Dashboard/Chart Colors</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    <ColorPicker
                      label="Chart Primary"
                      value={currentTheme.colors.chartPrimary}
                      onChange={(color) => updateThemeColors({ chartPrimary: color })}
                    />
                    <ColorPicker
                      label="Chart Secondary"
                      value={currentTheme.colors.chartSecondary}
                      onChange={(color) => updateThemeColors({ chartSecondary: color })}
                    />
                    <ColorPicker
                      label="Chart Tertiary"
                      value={currentTheme.colors.chartTertiary}
                      onChange={(color) => updateThemeColors({ chartTertiary: color })}
                    />
                  </SimpleGrid>
                </TabPanel>

                {/* Typography Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={6}>
                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>Font Family</FormLabel>
                      <Select
                        value={currentTheme.typography.fontFamily}
                        onChange={(e) =>
                          updateThemeTypography({ fontFamily: e.target.value })
                        }
                        bg={currentTheme.colors.cardBackground}
                        color={currentTheme.colors.text}
                        borderColor={currentTheme.colors.border}
                        sx={{
                          option: {
                            bg: currentTheme.colors.cardBackground,
                            color: currentTheme.colors.text,
                            _hover: {
                              bg: currentTheme.colors.primary,
                            },
                            _selected: {
                              bg: currentTheme.colors.primary,
                            },
                          },
                        }}
                      >
                        <option value="Inter, system-ui, Avenir, Helvetica, Arial, sans-serif">
                          Inter (Default)
                        </option>
                        <option value="Arial, Helvetica, sans-serif">Arial</option>
                        <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                        <option value="'Comic Sans MS', 'OpenDyslexic', Verdana, sans-serif">
                          Comic Sans (Dyslexia-friendly)
                        </option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, Geneva, sans-serif">Verdana</option>
                        <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>Font Size: {currentTheme.typography.fontSize}px</FormLabel>
                      <Slider
                        value={currentTheme.typography.fontSize}
                        min={12}
                        max={24}
                        step={1}
                        onChange={(value) => updateThemeTypography({ fontSize: value })}
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>Font Weight: {currentTheme.typography.fontWeight}</FormLabel>
                      <Slider
                        value={currentTheme.typography.fontWeight}
                        min={300}
                        max={700}
                        step={100}
                        onChange={(value) => updateThemeTypography({ fontWeight: value })}
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>Line Height: {currentTheme.typography.lineHeight}</FormLabel>
                      <Slider
                        value={currentTheme.typography.lineHeight}
                        min={1.0}
                        max={2.5}
                        step={0.1}
                        onChange={(value) => updateThemeTypography({ lineHeight: value })}
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Shapes Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={6}>
                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>
                        Small Border Radius: {currentTheme.shapes.borderRadiusSm}px
                      </FormLabel>
                      <Slider
                        value={currentTheme.shapes.borderRadiusSm}
                        min={0}
                        max={20}
                        step={1}
                        onChange={(value) =>
                          updateThemeShapes({ borderRadiusSm: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>
                        Medium Border Radius: {currentTheme.shapes.borderRadiusMd}px
                      </FormLabel>
                      <Slider
                        value={currentTheme.shapes.borderRadiusMd}
                        min={0}
                        max={30}
                        step={1}
                        onChange={(value) =>
                          updateThemeShapes({ borderRadiusMd: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>
                        Large Border Radius: {currentTheme.shapes.borderRadiusLg}px
                      </FormLabel>
                      <Slider
                        value={currentTheme.shapes.borderRadiusLg}
                        min={0}
                        max={40}
                        step={1}
                        onChange={(value) =>
                          updateThemeShapes({ borderRadiusLg: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>
                        Extra Large Border Radius: {currentTheme.shapes.borderRadiusXl}px
                      </FormLabel>
                      <Slider
                        value={currentTheme.shapes.borderRadiusXl}
                        min={0}
                        max={50}
                        step={1}
                        onChange={(value) =>
                          updateThemeShapes({ borderRadiusXl: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Spacing Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={6}>
                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>Spacing Scale: {currentTheme.spacing.scale}x</FormLabel>
                      <Slider
                        value={currentTheme.spacing.scale}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        onChange={(value) => updateThemeSpacing({ scale: value })}
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                      <Text fontSize="sm" color={currentTheme.colors.textSecondary} mt={2}>
                        Multiplier for all spacing (padding, margins) throughout the app
                      </Text>
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Effects Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={6}>
                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>
                        Animation Duration: {currentTheme.effects.animationDuration}ms
                      </FormLabel>
                      <Slider
                        value={currentTheme.effects.animationDuration}
                        min={0}
                        max={1000}
                        step={50}
                        onChange={(value) =>
                          updateThemeEffects({ animationDuration: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" color={currentTheme.colors.text}>Reduced Motion</FormLabel>
                      <Switch
                        isChecked={currentTheme.effects.reducedMotion}
                        onChange={(e) =>
                          updateThemeEffects({ reducedMotion: e.target.checked })
                        }
                        colorScheme="blue"
                        sx={{
                          'span.chakra-switch__track': {
                            bg: currentTheme.colors.border,
                          },
                          'span.chakra-switch__track[data-checked]': {
                            bg: currentTheme.colors.primary,
                          },
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>Card Opacity: {currentTheme.effects.cardOpacity}</FormLabel>
                      <Slider
                        value={currentTheme.effects.cardOpacity}
                        min={0.5}
                        max={1.0}
                        step={0.05}
                        onChange={(value) =>
                          updateThemeEffects({ cardOpacity: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel color={currentTheme.colors.text}>
                        Overlay Opacity: {currentTheme.effects.overlayOpacity}
                      </FormLabel>
                      <Slider
                        value={currentTheme.effects.overlayOpacity}
                        min={0.1}
                        max={0.9}
                        step={0.1}
                        onChange={(value) =>
                          updateThemeEffects({ overlayOpacity: value })
                        }
                      >
                        <SliderTrack bg={currentTheme.colors.border}>
                          <SliderFilledTrack bg={currentTheme.colors.primary} />
                        </SliderTrack>
                        <SliderThumb bg={currentTheme.colors.primary} />
                      </Slider>
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Preview Tab */}
                <TabPanel>
                  <LivePreview />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Box>
    </DashboardLayout>
  );
};

export default ThemeCustomizationPage;

