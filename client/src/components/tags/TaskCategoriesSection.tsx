import { VStack, Heading, Button, Input, Grid, Textarea, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, useDisclosure } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import CategoryCard from './CategoryCard';

interface Category {
  name: string;
  description?: string;
  icon?: string;
}

interface TaskCategoriesSectionProps {
  categories: string[];
  setCategories: (categories: string[]) => void;
}

const TaskCategoriesSection: React.FC<TaskCategoriesSectionProps> = ({ categories, setCategories }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categoryList, setCategoryList] = useState<Category[]>(categories.map(name => ({ name })));
  const [newCategory, setNewCategory] = useState<Category>({
    name: '',
    description: '',
    icon: '📋'
  });
  const toast = useToast();

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      if (categories.includes(newCategory.name.trim())) {
        toast({
          title: 'Category already exists',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
        return;
      }
      const updatedList = [
        ...categoryList,
        { name: newCategory.name.trim(), description: newCategory.description?.trim(), icon: newCategory.icon }
      ];
      setCategoryList(updatedList);
      setCategories(updatedList.map(cat => cat.name));
      setNewCategory({ name: '', description: '', icon: '📋' });
      onClose();
    }
  };

  const handleDeleteCategory = (index: number) => {
    const updatedCategories = categoryList.filter((_, i) => i !== index);
    setCategoryList(updatedCategories);
    setCategories(updatedCategories.map(cat => cat.name));
  };

  const handleUpdateCategory = (index: number, updatedCategory: Category) => {
    const newCategoryList = [...categoryList];
    newCategoryList[index] = updatedCategory;
    setCategoryList(newCategoryList);
    setCategories(newCategoryList.map(cat => cat.name));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const newCategoryList = Array.from(categoryList);
    [newCategoryList[sourceIndex], newCategoryList[destinationIndex]] = 
      [newCategoryList[destinationIndex], newCategoryList[sourceIndex]];
    
    setCategoryList(newCategoryList);
    setCategories(newCategoryList.map(cat => cat.name));
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="white">Task Categories</Heading>
      
      <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={onOpen} alignSelf="flex-end">
        Create New Category
      </Button>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories" direction="horizontal">
          {(provided) => (
            <Grid
              templateColumns="repeat(3, 1fr)"
              gap={6}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {categoryList.map((category, index) => (
                <Draggable key={category.name + index} draggableId={category.name + index} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <CategoryCard
                        category={category}
                        onDelete={() => handleDeleteCategory(index)}
                        onUpdate={(updatedCategory) => handleUpdateCategory(index, updatedCategory)}
                        index={index}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Grid>
          )}
        </Droppable>
      </DragDropContext>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">Create New Category</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel color="gray.300">Category Name</FormLabel>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
                bg="gray.700"
                color="white"
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.300">Description (Optional)</FormLabel>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter category description"
                bg="gray.700"
                color="white"
                resize="vertical"
                rows={3}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="gray.300">
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleAddCategory}>
              Create Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default TaskCategoriesSection;
