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
  Icon,
  Text,
  useToast,
} from '@chakra-ui/react';
import { HexColorPicker } from 'react-colorful';
import { BsSquare, BsCircle } from 'react-icons/bs';
import { MdRoundedCorner } from 'react-icons/md';
import './TaskCustomizationPanel.css';

interface TaskCustomizationPanelProps {
  selectedTaskIds: number[];
  onCustomize: (taskIds: number[], color: string | null, shape: string | null) => void;
  onClose?: () => void;
}

const TaskCustomizationPanel: React.FC<TaskCustomizationPanelProps> = ({
  selectedTaskIds,
  onCustomize,
  onClose,
}) => {
  const [color, setColor] = useState<string>('#4A5568');
  const [shape, setShape] = useState<string>('rounded');
  const toast = useToast();

  const handleApply = () => {
    if (selectedTaskIds.length === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select at least one task to customize',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onCustomize(selectedTaskIds, color, shape);
    
    toast({
      title: 'Customization applied',
      description: `Updated ${selectedTaskIds.length} task(s)`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleReset = () => {
    if (selectedTaskIds.length === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select at least one task to reset',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onCustomize(selectedTaskIds, null, 'rounded');
    
    toast({
      title: 'Reset to default',
      description: `Reset ${selectedTaskIds.length} task(s) to default appearance`,
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
        <Heading size="sm">Customize Tasks</Heading>
        
        {selectedTaskIds.length > 0 ? (
          <Text fontSize="sm" color="var(--color-text-secondary)">
            {selectedTaskIds.length} task(s) selected
          </Text>
        ) : (
          <Text fontSize="sm" color="var(--color-warning)">
            Select tasks to customize
          </Text>
        )}

        {/* Color Picker */}
        <FormControl>
          <FormLabel fontSize="sm">Task Color</FormLabel>
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

        {/* Shape Selector */}
        <FormControl>
          <FormLabel fontSize="sm">Task Shape</FormLabel>
          <ButtonGroup isAttached w="full">
            <Button
              flex={1}
              onClick={() => setShape('rectangle')}
              size="sm"
              bg={shape === 'rectangle' ? 'var(--color-button-primary)' : 'transparent'}
              color={shape === 'rectangle' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={shape === 'rectangle' ? 'var(--color-primary)' : 'var(--color-border)'}
              borderRadius="var(--border-radius-md)"
              transition={`all var(--animation-duration) var(--animation-timing)`}
              _hover={{
                bg: shape === 'rectangle' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
                borderColor: 'var(--color-primary)'
              }}
            >
              <Icon as={BsSquare} mr={1} />
              Rectangle
            </Button>
            <Button
              flex={1}
              onClick={() => setShape('rounded')}
              size="sm"
              bg={shape === 'rounded' ? 'var(--color-button-primary)' : 'transparent'}
              color={shape === 'rounded' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={shape === 'rounded' ? 'var(--color-primary)' : 'var(--color-border)'}
              borderRadius="var(--border-radius-md)"
              transition={`all var(--animation-duration) var(--animation-timing)`}
              _hover={{
                bg: shape === 'rounded' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
                borderColor: 'var(--color-primary)'
              }}
            >
              <Icon as={MdRoundedCorner} mr={1} />
              Rounded
            </Button>
            <Button
              flex={1}
              onClick={() => setShape('circle')}
              size="sm"
              bg={shape === 'circle' ? 'var(--color-button-primary)' : 'transparent'}
              color={shape === 'circle' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
              borderWidth="1px"
              borderColor={shape === 'circle' ? 'var(--color-primary)' : 'var(--color-border)'}
              borderRadius="var(--border-radius-md)"
              transition={`all var(--animation-duration) var(--animation-timing)`}
              _hover={{
                bg: shape === 'circle' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
                borderColor: 'var(--color-primary)'
              }}
            >
              <Icon as={BsCircle} mr={1} />
              Circle
            </Button>
          </ButtonGroup>
        </FormControl>

        {/* Action Buttons */}
        <HStack spacing={2}>
          <Button
            onClick={handleApply}
            flex={1}
            isDisabled={selectedTaskIds.length === 0}
            bg="var(--color-button-primary)"
            color="var(--color-button-primary-text)"
            borderRadius="var(--border-radius-md)"
            transition={`all var(--animation-duration) var(--animation-timing)`}
            _hover={{ 
              bg: 'var(--color-button-primary-hover)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--shadow-md)'
            }}
            _active={{ bg: 'var(--color-active-state)' }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed'
            }}
          >
            Apply
          </Button>
          <Button
            onClick={handleReset}
            flex={1}
            isDisabled={selectedTaskIds.length === 0}
            bg="var(--color-button-secondary)"
            color="var(--color-button-secondary-text)"
            borderRadius="var(--border-radius-md)"
            transition={`all var(--animation-duration) var(--animation-timing)`}
            _hover={{ 
              bg: 'var(--color-button-secondary-hover)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--shadow-md)'
            }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed'
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
            transition={`all var(--animation-duration) var(--animation-timing)`}
            _hover={{
              bg: 'var(--color-hover-overlay)'
            }}
          >
            Close
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default TaskCustomizationPanel;


