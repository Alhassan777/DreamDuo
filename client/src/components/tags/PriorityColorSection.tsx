import { VStack, Heading, HStack, Text, Input, Button, IconButton, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { IoColorPaletteOutline } from 'react-icons/io5';
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
    if (editingIndex === index) {
      // If clicking the same edit button, reset to initial state
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

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="white">Task Urgency Levels</Heading>
      
      <HStack>
        <Input
          placeholder="Enter priority level"
          value={newPriority.level}
          onChange={(e) => setNewPriority({ ...newPriority, level: e.target.value })}
          bg="gray.700"
          color="white"
        />
        <HStack
          position="relative"
          width="38px"
          height="38px"
          bg="gray.700"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.600"
          p={0}
          cursor="pointer"
          _hover={{ borderColor: 'gray.500' }}
          justify="center"
          align="center"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input[type="color"]');
            if (input && input instanceof HTMLElement) input.click();
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: newPriority.color,
              borderRadius: '50%',
              border: '2px solid white',
              margin: 0
            }}
          />
          <Input
            type="color"
            value={newPriority.color}
            onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
            position="absolute"
            opacity={0}
            width="100%"
            height="100%"
            top={0}
            left={0}
            p={0}
            m={0}
            cursor="pointer"
          />
        </HStack>
        <Button
          colorScheme={editingIndex !== null ? "green" : "purple"}
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
                width: '24px',
                height: '24px',
                backgroundColor: priority.color,
                borderRadius: '4px',
                border: '2px solid white'
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