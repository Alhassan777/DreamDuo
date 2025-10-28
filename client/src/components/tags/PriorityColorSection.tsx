import { VStack, Heading, HStack, Text, Input, Button, IconButton, useToast, Box, Center, Spinner } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { tagsService } from '../../services/tags';
import { useTheme } from '../../contexts/ThemeContext';
import '../styles/priorityColorSection.css';

interface PriorityColor {
  level: string;
  color: string;
}

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
          // Use the colors returned from the backend
          setPriorityColors(fetchedPriorities);
        } else {
          // If no priorities found, set empty array
          setPriorityColors([]);
        }
      } catch (error) {
        console.error('Error fetching priorities:', error);
        toast({
          title: 'Error fetching priorities',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Set empty array on error instead of defaults
        setPriorityColors([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriorities();
  }, []);

  const handleAddPriority = async () => {
    if (newPriority.level.trim()) {
      // Check for duplicate priority level and color
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

      if (
        priorityColors.some(
          (p) => p.color.toLowerCase() === newPriority.color.toLowerCase()
        )
      ) {
        toast({
          title: 'Priority color already exists',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
        return;
      }
      
      setIsLoading(true);
      try {
        // Call the API to add the priority with color
        await tagsService.addPriority(newPriority.level.trim(), newPriority.color);
        
        // Update local state
        setPriorityColors([...priorityColors, { ...newPriority }]);
        setNewPriority({ level: '', color: '#000000' });
        
        toast({
          title: 'Priority added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error adding priority:', error);
        toast({
          title: 'Error adding priority',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
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

  const handleUpdatePriority = async () => {
    if (editingIndex !== null && newPriority.level.trim()) {
      const oldPriorityLevel = priorityColors[editingIndex].level;
      const newPriorityLevel = newPriority.level.trim();
      
      // Check for duplicate if name or color changed
      if (
        oldPriorityLevel.toLowerCase() !== newPriorityLevel.toLowerCase() &&
        priorityColors.some(
          (p) => p.level.toLowerCase() === newPriorityLevel.toLowerCase()
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

      // Check for duplicate color, excluding the current priority being edited
      if (
        priorityColors.some(
          (p, i) => i !== editingIndex && p.color.toLowerCase() === newPriority.color.toLowerCase()
        )
      ) {
        toast({
          title: 'Priority color already exists',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
        return;
      }
      
      setIsLoading(true);
      try {
        if (oldPriorityLevel !== newPriorityLevel) {
          // Update priority name on the backend
          await tagsService.updatePriority(oldPriorityLevel, newPriorityLevel, newPriority.color);
        } else {
          // If only color changed, still update with the same name
          await tagsService.updatePriority(oldPriorityLevel, oldPriorityLevel, newPriority.color);
        }
        
        // Update local state
        const updatedPriorities = [...priorityColors];
        updatedPriorities[editingIndex] = { ...newPriority };
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
        setNewPriority({ level: '', color: '#000000' });
        setEditingIndex(null);
      }
    }
  };

  const handleDeletePriority = async (index: number) => {
    const priorityToDelete = priorityColors[index];
    
    setIsLoading(true);
    try {
      // Call the API to delete the priority
      await tagsService.deletePriority(priorityToDelete.level);
      
      const updatedPriorities = priorityColors.filter((_, i) => i !== index);
      setPriorityColors(updatedPriorities);
      
      toast({
        title: 'Priority deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting priority:', error);
      toast({
        title: 'Error deleting priority',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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
        await tagsService.updatePriority(oldPriorityLevel, newPriorityLevel, priorityColors[inlineEditingIndex].color);
        
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
      <Heading size="md" className='priority-color-heading'>
        Task Urgency Levels
      </Heading>

      {/* NEW PRIORITY INPUT */}
      <HStack>
        <Input
          className="priority-input"
          data-aot-mode={isAotMode}
          placeholder="Enter priority level"
          value={newPriority.level}
          onChange={(e) =>
            setNewPriority({ ...newPriority, level: e.target.value })
          }
          onKeyPress={handleKeyPress}
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
          onClick={editingIndex !== null ? handleUpdatePriority : handleAddPriority}
          className={`priority-add-button ${editingIndex !== null ? 'editing' : ''}`}
          data-aot-mode={isAotMode}
          isLoading={isLoading}
        >
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </HStack>

      {/* LOADING INDICATOR */}
      {isLoading && (
        <Center py={4}>
          <Spinner size="md" className="priority-spinner" data-aot-mode={isAotMode} />
        </Center>
      )}

      {/* EMPTY STATE */}
      {!isLoading && priorityColors.length === 0 && (
        <Box textAlign="center" py={6} className="priority-empty-state" data-aot-mode={isAotMode}>
          <Text className="priority-empty-text" data-aot-mode={isAotMode}>
            No priority levels found. Add your first priority level above.
          </Text>
        </Box>
      )}

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
                  onChange={async (e) => {
                    const newColor = e.target.value;
                    
                    // Check for duplicate color
                    if (
                      priorityColors.some(
                        (p, i) => i !== index && p.color.toLowerCase() === newColor.toLowerCase()
                      )
                    ) {
                      toast({
                        title: 'Priority color already exists',
                        status: 'error',
                        duration: 2000,
                        isClosable: true,
                      });
                      return;
                    }
                    
                    setIsLoading(true);
                    try {
                      // Update priority color on the backend
                      await tagsService.updatePriority(priority.level, priority.level, newColor);
                      
                      // Update local state
                      const updatedPriorities = [...priorityColors];
                      updatedPriorities[index] = {
                        ...priority,
                        color: newColor,
                      };
                      setPriorityColors(updatedPriorities);
                      
                      toast({
                        title: 'Priority color updated',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                      });
                    } catch (error) {
                      console.error('Error updating priority color:', error);
                      toast({
                        title: 'Error updating priority color',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="priority-color-input priority-color-input-hidden"
                />
              </HStack>
              {inlineEditingIndex === index ? (
                <Input
                  className="priority-inline-edit-input"
                  data-aot-mode={isAotMode}
                  value={inlineEditValue}
                  onChange={(e) => setInlineEditValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onBlur={handleInlineEditSubmit}
                  autoFocus
                  size="sm"
                  width="auto"
                />
              ) : (
                <Text
                  onDoubleClick={() => handleInlineEdit(index)}
                  cursor="pointer"
                  className="priority-level-text"
                  data-aot-mode={isAotMode}
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
                onClick={() => handleEditPriority(index)}
                className="priority-edit-button"
                data-aot-mode={isAotMode}
              />
              <IconButton
                aria-label="Delete priority"
                icon={<DeleteIcon />}
                size="sm"
                onClick={() => handleDeletePriority(index)}
                className="priority-delete-button"
                data-aot-mode={isAotMode}
              />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default PriorityColorSection;
