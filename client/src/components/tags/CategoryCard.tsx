import { Box, Flex, VStack, Text, IconButton, Input, Textarea, Popover, PopoverTrigger, PopoverContent, PopoverBody, Portal, Center, HStack } from '@chakra-ui/react';
import { DeleteIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import '../styles/CategoryCard.css';
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
    <Box className={`category-card ${isEditing ? 'editing' : ''}`}>

      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Text className="category-card-title">

            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Category name"
                size="lg"
                variant="flushed"
                autoFocus
                className="category-card-title-input"
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
              variant="ghost"
              onClick={onDelete}
              className="category-card-button delete"
            />
            <IconButton
              icon={<EditIcon />}
              aria-label="Edit category"
              size="md"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="category-card-button edit"
            />
          </HStack>
        </Flex>

        {(isEditing || category.description) && (
          <Text className="category-card-description">

            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Category description (optional)"
                size="sm"
                variant="filled"
                resize="vertical"
                rows={3}
                className="category-card-description-textarea"
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
                className="category-card-emoji-picker"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >

                <Text className="category-card-icon">{selectedIcon}</Text>
              </Center>
            </PopoverTrigger>
            <Portal>
              <PopoverContent className="category-card-emoji-content">

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
              size="sm"
              onClick={handleSave}
              className="category-card-button save"
            />
            <IconButton
              icon={<CloseIcon />}
              aria-label="Cancel changes"
              size="sm"
              onClick={handleCancel}
              className="category-card-button cancel"
            />
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default CategoryCard;
