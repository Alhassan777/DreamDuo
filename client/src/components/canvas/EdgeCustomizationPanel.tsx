import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  HStack,
  Text,
  useToast,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { HexColorPicker } from 'react-colorful';
import './EdgeCustomizationPanel.css';

interface EdgeCustomizationPanelProps {
  selectedEdgeIds: number[];
  onCustomize: (
    edgeIds: number[],
    appearance: {
      edge_color?: string | null;
      edge_style?: string | null;
      edge_width?: number | null;
      edge_animated?: boolean | null;
    }
  ) => void;
  onClose?: () => void;
}

const EdgeCustomizationPanel: React.FC<EdgeCustomizationPanelProps> = ({
  selectedEdgeIds,
  onCustomize,
  onClose,
}) => {
  const [color, setColor] = useState<string>('#4A5568');
  const [style, setStyle] = useState<string>('smoothstep');
  const [width, setWidth] = useState<number>(2);
  const [animated, setAnimated] = useState<boolean>(true);
  const toast = useToast();

  const handleApply = () => {
    if (selectedEdgeIds.length === 0) {
      toast({
        title: 'No edges selected',
        description: 'Please select at least one edge to customize',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onCustomize(selectedEdgeIds, {
      edge_color: color,
      edge_style: style,
      edge_width: width,
      edge_animated: animated,
    });
  };

  const handleReset = () => {
    if (selectedEdgeIds.length === 0) {
      toast({
        title: 'No edges selected',
        description: 'Please select at least one edge to reset',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onCustomize(selectedEdgeIds, {
      edge_color: 'var(--color-primary)',
      edge_style: 'smoothstep',
      edge_width: 2,
      edge_animated: true,
    });

    toast({
      title: 'Reset to default',
      description: `Reset ${selectedEdgeIds.length} edge(s) to default appearance`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box
      bg="var(--color-card-background)"
      p={4}
      borderRadius="var(--border-radius-lg)"
      w="full"
      color="var(--color-text)"
      border="1px solid"
      borderColor="var(--color-border)"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="sm">Customize Edges</Heading>

        {selectedEdgeIds.length > 0 ? (
          <Text fontSize="sm" color="var(--color-text-secondary)">
            {selectedEdgeIds.length} edge(s) selected
          </Text>
        ) : (
          <Text fontSize="sm" color="var(--color-warning)">
            Select edges to customize
          </Text>
        )}

        {/* Color Picker */}
        <FormControl>
          <FormLabel fontSize="sm">Edge Color</FormLabel>
          <Box
            border="1px solid"
            borderColor="var(--color-border)"
            borderRadius="var(--border-radius-md)"
            p={2}
            bg="var(--color-background)"
          >
            <HexColorPicker color={color} onChange={setColor} style={{ width: '100%' }} />
          </Box>
          <Text fontSize="xs" color="var(--color-text-secondary)" mt={1}>
            Current: {color}
          </Text>
        </FormControl>

        {/* Style Selector */}
        <FormControl>
          <FormLabel fontSize="sm">Edge Style</FormLabel>
          <ButtonGroup isAttached w="full" size="sm">
            <Button
              flex={1}
              onClick={() => setStyle('smoothstep')}
              bg={style === 'smoothstep' ? 'var(--color-button-primary)' : 'transparent'}
              color={style === 'smoothstep' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={style === 'smoothstep' ? 'var(--color-primary)' : 'var(--color-border)'}
              _hover={{
                bg: style === 'smoothstep' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
              }}
            >
              Smooth
            </Button>
            <Button
              flex={1}
              onClick={() => setStyle('straight')}
              bg={style === 'straight' ? 'var(--color-button-primary)' : 'transparent'}
              color={style === 'straight' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={style === 'straight' ? 'var(--color-primary)' : 'var(--color-border)'}
              _hover={{
                bg: style === 'straight' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
              }}
            >
              Straight
            </Button>
            <Button
              flex={1}
              onClick={() => setStyle('step')}
              bg={style === 'step' ? 'var(--color-button-primary)' : 'transparent'}
              color={style === 'step' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={style === 'step' ? 'var(--color-primary)' : 'var(--color-border)'}
              _hover={{
                bg: style === 'step' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
              }}
            >
              Step
            </Button>
            <Button
              flex={1}
              onClick={() => setStyle('bezier')}
              bg={style === 'bezier' ? 'var(--color-button-primary)' : 'transparent'}
              color={style === 'bezier' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={style === 'bezier' ? 'var(--color-primary)' : 'var(--color-border)'}
              _hover={{
                bg: style === 'bezier' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
              }}
            >
              Bezier
            </Button>
          </ButtonGroup>
        </FormControl>

        {/* Width Slider */}
        <FormControl>
          <FormLabel fontSize="sm">Edge Width: {width}px</FormLabel>
          <Slider
            value={width}
            onChange={setWidth}
            min={1}
            max={10}
            step={0.5}
            colorScheme="blue"
          >
            <SliderTrack bg="var(--color-border)">
              <SliderFilledTrack bg="var(--color-primary)" />
            </SliderTrack>
            <SliderThumb boxSize={4} />
          </Slider>
        </FormControl>

        {/* Animated Toggle */}
        <FormControl display="flex" alignItems="center" justifyContent="space-between">
          <FormLabel fontSize="sm" mb={0}>
            Animated
          </FormLabel>
          <Switch
            isChecked={animated}
            onChange={(e) => setAnimated(e.target.checked)}
            colorScheme="blue"
          />
        </FormControl>

        {/* Action Buttons */}
        <HStack spacing={2}>
          <Button
            onClick={handleApply}
            flex={1}
            isDisabled={selectedEdgeIds.length === 0}
            bg="var(--color-button-primary)"
            color="var(--color-button-primary-text)"
            borderRadius="var(--border-radius-md)"
            transition="all var(--animation-duration) var(--animation-timing)"
            _hover={{
              bg: 'var(--color-button-primary-hover)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--shadow-md)',
            }}
            _active={{ bg: 'var(--color-active-state)' }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          >
            Apply
          </Button>
          <Button
            onClick={handleReset}
            flex={1}
            isDisabled={selectedEdgeIds.length === 0}
            bg="var(--color-button-secondary)"
            color="var(--color-button-secondary-text)"
            borderRadius="var(--border-radius-md)"
            transition="all var(--animation-duration) var(--animation-timing)"
            _hover={{
              bg: 'var(--color-button-secondary-hover)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--shadow-md)',
            }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          >
            Reset
          </Button>
        </HStack>

        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            size="sm"
            color="var(--color-text)"
            transition="all var(--animation-duration) var(--animation-timing)"
            _hover={{
              bg: 'var(--color-hover-overlay)',
            }}
          >
            Close
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default EdgeCustomizationPanel;

