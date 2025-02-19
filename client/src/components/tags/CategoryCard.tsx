import { Box, Flex, VStack, Text, IconButton, Input, Textarea, useDisclosure, Popover, PopoverTrigger, PopoverContent, PopoverBody, Portal } from '@chakra-ui/react';
import { DeleteIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { HexColorPicker } from 'react-colorful';

interface CategoryCardProps {
  category: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  };
  onDelete: () => void;
  onUpdate: (updatedCategory: { name: string; description?: string; icon?: string; color?: string }) => void;
}

const CategoryCard = ({ category, onDelete, onUpdate }: CategoryCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [editedDescription, setEditedDescription] = useState(category.description || '');
  const [selectedIcon, setSelectedIcon] = useState(category.icon || '📋');
  const [selectedColor, setSelectedColor] = useState(category.color || '#2D3748');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  // Remove unused useDisclosure hook since its values aren't being used

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdate({
        name: editedName.trim(),
        description: editedDescription.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor
      });
      setIsEditing(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedIcon(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleCancel = () => {
    setEditedName(category.name);
    setEditedDescription(category.description || '');
    setSelectedIcon(category.icon || '📋');
    setIsEditing(false);
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      bg={category.color || 'gray.800'}
      p={4}
      position="relative"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'lg'
      }}
    >
      <Flex justify="space-between" mb={4}>
        <IconButton
          icon={<DeleteIcon />}
          aria-label="Delete category"
          size="sm"
          colorScheme="red"
          variant="ghost"
          onClick={onDelete}
        />
        <IconButton
          icon={<EditIcon />}
          aria-label="Edit category"
          size="sm"
          colorScheme="blue"
          variant="ghost"
          onClick={() => setIsEditing(!isEditing)}
        />
      </Flex>

      <VStack spacing={3} align="stretch">
        {isEditing ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Category name"
            size="md"
            bg="gray.700"
            color="white"
          />
        ) : (
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="white"
            textAlign="center"
          >
            {category.name}
          </Text>
        )}

        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Category description (optional)"
            size="sm"
            bg="gray.700"
            color="white"
            resize="vertical"
            rows={3}
          />
        ) : (
          category.description && (
            <Text color="gray.300" fontSize="sm" textAlign="center">
              {category.description}
            </Text>
          )
        )}

        <Flex justify="center" align="center" gap={4}>
          <Popover
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            placement="bottom"
          >
            <PopoverTrigger>
              <Box
                as="button"
                fontSize="2xl"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                cursor="pointer"
                transition="transform 0.2s"
                _hover={{ transform: 'scale(1.1)' }}
              >
                {selectedIcon}
              </Box>
            </PopoverTrigger>
            <Portal>
            <PopoverContent 
                zIndex={99999} 
                width="320px" 
                maxHeight="400px" 
                overflowY="auto" 
                boxShadow="xl"
                >
                <PopoverBody p={0}>
                    <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="320px"
                    height="400px" // or remove these to let it auto-size
                    />
                </PopoverBody>
                </PopoverContent>
            </Portal>
          </Popover>

          {isEditing && (
            <Popover
              isOpen={showColorPicker}
              onClose={() => setShowColorPicker(false)}
              placement="bottom"
            >
              <PopoverTrigger>
                <Box
                  as="button"
                  w="30px"
                  h="30px"
                  borderRadius="md"
                  bg={selectedColor}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  cursor="pointer"
                  transition="transform 0.2s"
                  _hover={{ transform: 'scale(1.1)' }}
                />
              </PopoverTrigger>
              <Portal>
                <PopoverContent width="auto">
                  <PopoverBody p={2}>
                    <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                  </PopoverBody>
                </PopoverContent>
              </Portal>
            </Popover>
          )}
        </Flex>

        {isEditing && (
          <Flex justify="center" gap={2} mt={2}>
            <IconButton
              icon={<CheckIcon />}
              aria-label="Save changes"
              colorScheme="green"
              size="sm"
              onClick={handleSave}
            />
            <IconButton
              icon={<CloseIcon />}
              aria-label="Cancel changes"
              colorScheme="red"
              size="sm"
              onClick={handleCancel}
            />
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default CategoryCard;