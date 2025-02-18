import { VStack, Heading, HStack, Text, Input, Button, IconButton, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useState } from 'react';

type PriorityColor = {
  level: string;
  color: string;
};

const DEFAULT_PRIORITY_COLORS: PriorityColor[] = [
  { level: 'High', color: '#FF0000' },
  { level: 'Medium', color: '#FFA500' },
  { level: 'Low', color: '#00FF00' }
];

const PriorityColorSection = () => {
  const [priorityColors, setPriorityColors] = useState<PriorityColor[]>(DEFAULT_PRIORITY_COLORS);
  const [newPriority, setNewPriority] = useState({ level: '', color: '#000000' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const toast = useToast();

  const handleAddPriority = () => {
    if (newPriority.level.trim()) {
      if (priorityColors.some(p => p.level.toLowerCase() === newPriority.level.toLowerCase())) {
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

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="white">Priority Colors</Heading>
      
      <HStack>
        <Input
          placeholder="Enter priority level"
          value={newPriority.level}
          onChange={(e) => setNewPriority({ ...newPriority, level: e.target.value })}
          bg="gray.700"
          color="white"
        />
        <Input
          type="color"
          value={newPriority.color}
          onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
          width="100px"
        />
        <Button
          colorScheme="purple"
          onClick={editingIndex !== null ? handleUpdatePriority : handleAddPriority}
        >
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {priorityColors.map((priority, index) => (
          <HStack key={index} justify="space-between" p={2} bg="gray.700" borderRadius="md">
            <HStack>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: priority.color,
                borderRadius: '4px'
              }} />
              <Text color="white">{priority.level}</Text>
            </HStack>
            <HStack spacing={2}>
              <IconButton
                aria-label="Edit priority"
                icon={<EditIcon />}
                size="sm"
                colorScheme="blue"
                onClick={() => handleEditPriority(index)}
              />
              <IconButton
                aria-label="Delete priority"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => handleDeletePriority(index)}
              />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default PriorityColorSection;