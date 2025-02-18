import { VStack, Heading, Button, Input, HStack, Text, IconButton, useToast } from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface TaskCategoriesSectionProps {
  categories: string[];
  setCategories: (categories: string[]) => void;
}

const TaskCategoriesSection: React.FC<TaskCategoriesSectionProps> = ({ categories, setCategories }) => {

  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const toast = useToast();

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      if (categories.includes(newCategory.trim())) {
        toast({
          title: 'Category already exists',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
        return;
      }
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleEditCategory = (index: number) => {
    setEditingIndex(index);
    setNewCategory(categories[index]);
  };

  const handleUpdateCategory = () => {
    if (editingIndex !== null && newCategory.trim()) {
      const updatedCategories = [...categories];
      updatedCategories[editingIndex] = newCategory.trim();
      setCategories(updatedCategories);
      setNewCategory('');
      setEditingIndex(null);
    }
  };

  const handleDeleteCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="white">Task Categories</Heading>
      
      <HStack>
        <Input
          placeholder="Enter category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          bg="gray.700"
          color="white"
        />
        <Button
          colorScheme="purple"
          onClick={editingIndex !== null ? handleUpdateCategory : handleAddCategory}
        >
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {categories.map((category, index) => (
          <HStack key={index} justify="space-between" p={2} bg="gray.700" borderRadius="md">
            <Text color="white">{category}</Text>
            <HStack spacing={2}>
              <IconButton
                aria-label="Edit category"
                icon={<EditIcon />}
                size="sm"
                colorScheme="blue"
                onClick={() => handleEditCategory(index)}
              />
              <IconButton
                aria-label="Delete category"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => handleDeleteCategory(index)}
              />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default TaskCategoriesSection;