import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Center,
  Text,
} from '@chakra-ui/react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface CategoryCreationFormProps {
  newCategory: {
    name: string;
    description: string;
    icon: string;
  };
  setNewCategory: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    icon: string;
  }>>;
  showEmojiPicker: boolean;
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
}

const CategoryCreationForm: React.FC<CategoryCreationFormProps> = ({
  newCategory,
  setNewCategory,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiClick,
}) => {
  return (
    <VStack spacing={4}>
      <FormControl>
        <FormLabel>
          Category Name
        </FormLabel>
        <Input
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter category name"
        />
      </FormControl>

      <FormControl>
        <FormLabel>
          Description (Optional)
        </FormLabel>
        <Textarea
          value={newCategory.description}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter category description"
          resize="vertical"
          rows={3}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Icon</FormLabel>
        <Flex justify="center" align="center">
          <Popover
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            placement="bottom"
          >
            <PopoverTrigger>
              <Center
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                sx={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "var(--chakra-colors-gray-700)",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  _hover: {
                    transform: "scale(1.1)",
                    backgroundColor: "var(--chakra-colors-gray-600)"
                  }
                }}
              >
                <Text fontSize="3xl">{newCategory.icon}</Text>
              </Center>
            </PopoverTrigger>

            <Portal>
              <PopoverContent
                width="320px"
                maxHeight="400px"
                overflowY="auto"
                boxShadow="xl"
                sx={{
                  backgroundColor: "var(--chakra-colors-gray-700)",
                  border: "1px solid var(--chakra-colors-gray-600)"
                }}
              >
                <PopoverBody p={0}>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="320px"
                    height="400px"
                  />
                </PopoverBody>
              </PopoverContent>
            </Portal>
          </Popover>
        </Flex>
      </FormControl>
    </VStack>
  );
};

export default CategoryCreationForm;