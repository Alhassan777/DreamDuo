import { VStack, Heading, HStack, Text, Input, Button, IconButton, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { tagsService } from '../../services/tags';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/priorityColorSection.css';

interface PriorityColor {
  level: string;
  color: string;
}

const DEFAULT_PRIORITY_COLORS: PriorityColor[] = [
  { level: 'High', color: '#FF0000' },
  { level: 'Medium', color: '#FFA500' },
  { level: 'Low', color: '#00FF00' }
];

const PriorityColorSection = () => {
  const [priorityColors, setPriorityColors] = useState<PriorityColor[]>([]);
  const [newPriority, setNewPriority] = useState({ level: '', color: '#000000' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inlineEditingIndex, setInlineEditingIndex] = useState<number | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { isAotMode } = useTheme();
  
  // Fetch priorities from the backend when component mounts
  useEffect(() => {
    const fetchPriorities = async () => {
      setIsLoading(true);
      try {
        const fetchedPriorities = await tagsService.getPriorities();
        if (fetchedPriorities.length > 0) {
          // Convert string priorities to PriorityColor objects with default colors
          const priorityColorObjects = fetchedPriorities.map(priority => {
            // Try to find a matching default color or assign a new one
            const defaultPriority = DEFAULT_PRIORITY_COLORS.find(
              p => p.level.toLowerCase() === priority.toLowerCase()
            );
            return {
              level: priority,
              color: defaultPriority?.color || '#' + Math.floor(Math.random()*16777215).toString(16)
            };
          });
          setPriorityColors(priorityColorObjects);
        } else {
          // If no priorities found, use defaults
          setPriorityColors(DEFAULT_PRIORITY_COLORS);
        }
      } catch (error) {
        console.error('Error fetching priorities:', error);
        toast({
          title: 'Error fetching priorities',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Use defaults on error
        setPriorityColors(DEFAULT_PRIORITY_COLORS);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriorities();
  }, []);

  const handleAddPriority = () => {
    if (newPriority.level.trim()) {
      // Check for duplicate priority level
      if (
        priorityColors.some(
          (p) => p.level.toLowerCase() === newPriority.level.toLowerCase()
        )
      ) {
        toast({
          title: 'Priority level already exists',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
        return;
      }
      setPriorityColors([...priorityColors, { ...newPriority }]);
      setNewPriority({ level: '', color: '#000000' });
    }
  };

  const handleEditPriority = (index: number) => {
    if (editingIndex === index) {
      // Cancel edit if clicked again
      setEditingIndex(null);
      setNewPriority({ level: '', color: '#000000' });
      return;
    }
    setEditingIndex(index);
    setNewPriority(priorityColors[index]);
  };

  const handleUpdatePriority = () => {
    if (editingIndex !== null && newPriority.level.trim()) {
      const updatedPriorities = [...priorityColors];
      updatedPriorities[editingIndex] = { ...newPriority };
      setPriorityColors(updatedPriorities);
      setNewPriority({ level: '', color: '#000000' });
      setEditingIndex(null);
    }
  };

  const handleDeletePriority = (index: number) => {
    const updatedPriorities = priorityColors.filter((_, i) => i !== index);
    setPriorityColors(updatedPriorities);
  };

  const handleInlineEdit = (index: number) => {
    setInlineEditingIndex(index);
    setInlineEditValue(priorityColors[index].level);
  };

  const handleInlineEditSubmit = async () => {
    if (inlineEditingIndex !== null && inlineEditValue.trim()) {
      const oldPriorityLevel = priorityColors[inlineEditingIndex].level;
      const newPriorityLevel = inlineEditValue.trim();
      
      setIsLoading(true);
      try {
        // Update priority on the backend
        await tagsService.updatePriority(oldPriorityLevel, newPriorityLevel);
        
        // Update local state
        const updatedPriorities = [...priorityColors];
        updatedPriorities[inlineEditingIndex] = {
          ...priorityColors[inlineEditingIndex],
          level: newPriorityLevel,
        };
        setPriorityColors(updatedPriorities);
        
        toast({
          title: 'Priority updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error updating priority:', error);
        toast({
          title: 'Error updating priority',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
        setInlineEditingIndex(null);
        setInlineEditValue('');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingIndex !== null) {
        handleUpdatePriority();
      } else if (inlineEditingIndex !== null) {
        handleInlineEditSubmit();
      } else {
        handleAddPriority();
      }
    }
  };

  return (
    <VStack align="stretch" spacing={4} className="priority-color-section" data-aot-mode={isAotMode}>
      <Heading size="md" color="white" className='priority-color-heading'>
        Task Urgency Levels
      </Heading>

      {/* NEW PRIORITY INPUT */}
      <HStack>
        <Input
          placeholder="Enter priority level"
          value={newPriority.level}
          onChange={(e) =>
            setNewPriority({ ...newPriority, level: e.target.value })
          }
          onKeyPress={handleKeyPress}
          bg={isAotMode ? "transparent" : "gray.700"}
          color={isAotMode ? "var(--aot-text);" : "gray.700"}
          sx={{
            backgroundColor: isAotMode ? "rgba(39,37,45,255)" : undefined,
            borderColor: isAotMode ? "var(--aot-accent)" : "transparent",
            _focus: {
              borderColor: isAotMode ? "var(--aot-accent)" : "blue.500",
              boxShadow: isAotMode ? "0 0 0 1px var(--aot-accent)" : "0 0 0 1px #3182ce"
            }
          }}
        />
        <HStack
          className="priority-color-picker"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input[type="color"]');
            if (input instanceof HTMLElement) {
              input.click();
            }
          }}
        >
          <div
            className="priority-color-preview"
            style={{ backgroundColor: newPriority.color, cursor: 'pointer'}}
          />
          <Input
            type="color"
            value={newPriority.color}
            onChange={(e) =>
              setNewPriority({ ...newPriority, color: e.target.value })
            }
            className="priority-color-input priority-color-input-hidden"
          />
        </HStack>
        <Button
          colorScheme={editingIndex !== null ? 'green' : 'purple'}
          onClick={editingIndex !== null ? handleUpdatePriority : handleAddPriority}
          className={isAotMode ? (editingIndex !== null ? 'priority-button-primary' : 'priority-button-accent') : ''}
        >
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </HStack>

      {/* LIST OF EXISTING PRIORITIES */}
      <VStack align="stretch" spacing={2}>
        {priorityColors.map((priority, index) => (
          <HStack key={index} justify="space-between" className="priority-item">
            <HStack>
              <HStack
                className="priority-color-picker"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector(
                    'input[type="color"]'
                  );
                  if (input instanceof HTMLElement) {
                    input.click();
                  }
                }}
              >
                <div
                  className="priority-color-preview"
                  style={{ backgroundColor: priority.color, cursor: 'pointer' }}
                />
                <Input
                  type="color"
                  value={priority.color}
                  onChange={(e) => {
                    const updatedPriorities = [...priorityColors];
                    updatedPriorities[index] = {
                      ...priority,
                      color: e.target.value,
                    };
                    setPriorityColors(updatedPriorities);
                  }}
                  className="priority-color-input priority-color-input-hidden"
                />
              </HStack>
              {inlineEditingIndex === index ? (
                <Input
                  value={inlineEditValue}
                  onChange={(e) => setInlineEditValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onBlur={handleInlineEditSubmit}
                  autoFocus
                  size="sm"
                  width="auto"
                  color="white"
                  bg="gray.700"
                />
              ) : (
                <Text
                  color="white"
                  onDoubleClick={() => handleInlineEdit(index)}
                  cursor="pointer"
                  className="priority-level-text"
                >
                  {priority.level}
                </Text>
              )}
            </HStack>
            <HStack spacing={2}>
              <IconButton
                aria-label="Edit priority"
                icon={<EditIcon />}
                size="sm"
                colorScheme="blue"
                onClick={() => handleEditPriority(index)}
                className={isAotMode ? 'priority-button-accent' : ''}
              />
              <IconButton
                aria-label="Delete priority"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => handleDeletePriority(index)}
                className={isAotMode ? 'priority-button-primary' : ''}
              />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default PriorityColorSection;
