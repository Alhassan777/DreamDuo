import { Box, Flex, VStack, Text, IconButton, Input, Textarea, Popover, PopoverTrigger, PopoverContent, PopoverBody, Portal, Center, HStack } from '@chakra-ui/react';
import { DeleteIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface CategoryCardProps {
  category: {
    name: string;
    description?: string;
    icon?: string;
  };
  onDelete: () => void;
  onUpdate: (updatedCategory: { name: string; description?: string; icon?: string }) => void;
  index: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [editedDescription, setEditedDescription] = useState(category.description || '');
  const [selectedIcon, setSelectedIcon] = useState(category.icon || '📋');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdate({
        name: editedName.trim(),
        description: editedDescription.trim() || undefined,
        icon: selectedIcon
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
      borderWidth={isEditing ? "2px" : "1px"}
      borderRadius="lg"
      bg={isEditing ? "gray.700" : "gray.800"}
      p={6}
      position="relative"
      transition="all 0.2s"
      boxShadow="lg"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'xl'
      }}
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            textShadow="0 0 10px rgba(255,255,255,0.3)"
          >
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Category name"
                size="lg"
                variant="flushed"
                color="white"
                autoFocus
              />
            ) : (
              category.name
            )}
          </Text>
          <HStack spacing={2}>
            <IconButton
              icon={<DeleteIcon />}
              aria-label="Delete category"
              size="md"
              colorScheme="red"
              variant="ghost"
              onClick={onDelete}
              _hover={{ transform: 'scale(1.1)' }}
            />
            <IconButton
              icon={<EditIcon />}
              aria-label="Edit category"
              size="md"
              colorScheme="blue"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              _hover={{ transform: 'scale(1.1)' }}
            />
          </HStack>
        </Flex>

        {(isEditing || category.description) && (
          <Text color="gray.400" fontSize="sm">
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Category description (optional)"
                size="sm"
                variant="filled"
                bg="gray.600"
                color="white"
                resize="vertical"
                rows={3}
              />
            ) : (
              category.description
            )}
          </Text>
        )}

        <Flex justify="center" align="center">
          <Popover isOpen={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} placement="bottom">
            <PopoverTrigger>
              <Center
                w="60px"
                h="60px"
                bg="gray.700"
                borderRadius="full"
                cursor="pointer"
                _hover={{ transform: 'scale(1.1)', bg: 'gray.600' }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Text fontSize="3xl">{selectedIcon}</Text>
              </Center>
            </PopoverTrigger>
            <Portal>
              <PopoverContent zIndex={99999} width="320px" maxHeight="400px" overflowY="auto" boxShadow="xl">
                <PopoverBody p={0}>
                  <EmojiPicker onEmojiClick={handleEmojiClick} width="320px" height="400px" />
                </PopoverBody>
              </PopoverContent>
            </Portal>
          </Popover>
        </Flex>

        {isEditing && (
          <Flex justify="center" gap={2}>
            <IconButton
              icon={<CheckIcon />}
              aria-label="Save changes"
              colorScheme="green"
              size="sm"
              onClick={handleSave}
              _hover={{ transform: 'scale(1.1)' }}
            />
            <IconButton
              icon={<CloseIcon />}
              aria-label="Cancel changes"
              colorScheme="red"
              size="sm"
              onClick={handleCancel}
              _hover={{ transform: 'scale(1.1)' }}
            />
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default CategoryCard;
