import React from 'react';
import {
  Box,
  Flex,
  Select,
  Button,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  Circle,
  VStack,
} from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import { Category } from '../../services/tags';

interface PriorityColor {
  level: string;
  color: string;
}

interface DashboardFiltersProps {
  categories: Category[];
  priorities: PriorityColor[];
  selectedCategoryIds: number[];
  selectedPriorityLevels: string[];
  onCategoryChange: (categoryIds: number[]) => void;
  onPriorityChange: (priorityLevels: string[]) => void;
  onClearAll: () => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  categories,
  priorities,
  selectedCategoryIds,
  selectedPriorityLevels,
  onCategoryChange,
  onPriorityChange,
  onClearAll,
}) => {
  const { isAotMode } = useTheme();

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    if (selectedId && !selectedCategoryIds.includes(selectedId)) {
      onCategoryChange([...selectedCategoryIds, selectedId]);
    }
    // Reset select
    e.target.value = '';
  };

  const handlePrioritySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = e.target.value;
    if (selectedLevel && !selectedPriorityLevels.includes(selectedLevel)) {
      onPriorityChange([...selectedPriorityLevels, selectedLevel]);
    }
    // Reset select
    e.target.value = '';
  };

  const removeCategory = (categoryId: number) => {
    onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId));
  };

  const removePriority = (priority: string) => {
    onPriorityChange(selectedPriorityLevels.filter(p => p !== priority));
  };

  const getCategoryName = (id: number) => {
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
  };

  const getCategoryIcon = (id: number) => {
    const category = categories.find(c => c.id === id);
    return category?.icon || '';
  };

  const getPriorityColor = (level: string) => {
    const priority = priorities.find(p => p.level === level);
    return priority?.color || '#gray';
  };

  const hasFilters = selectedCategoryIds.length > 0 || selectedPriorityLevels.length > 0;

  return (
    <Box>
      <VStack align="stretch" spacing={3}>
        {/* Filter Controls */}
        <Flex gap={3} flexWrap="wrap" align="center">
          <Text fontWeight="medium" fontSize="sm">
            Filter by:
          </Text>
          
          <Select
            placeholder="Category"
            size="sm"
            maxW="200px"
            onChange={handleCategorySelect}
            data-aot-mode={isAotMode}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>

          <Select
            placeholder="Priority"
            size="sm"
            maxW="200px"
            onChange={handlePrioritySelect}
            data-aot-mode={isAotMode}
          >
            {priorities.map((priority) => (
              <option key={priority.level} value={priority.level}>
                {priority.level}
              </option>
            ))}
          </Select>

          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearAll}
              colorScheme={isAotMode ? 'red' : 'blue'}
            >
              Clear Filters
            </Button>
          )}
        </Flex>

        {/* Active Filter Chips */}
        {hasFilters && (
          <Flex gap={2} flexWrap="wrap">
            {selectedCategoryIds.map((categoryId) => (
              <Tag
                key={`cat-${categoryId}`}
                size="md"
                colorScheme={isAotMode ? 'red' : 'blue'}
                variant="solid"
              >
                <TagLabel>
                  {getCategoryIcon(categoryId)} {getCategoryName(categoryId)}
                </TagLabel>
                <TagCloseButton onClick={() => removeCategory(categoryId)} />
              </Tag>
            ))}

            {selectedPriorityLevels.map((priority) => (
              <Tag
                key={`pri-${priority}`}
                size="md"
                colorScheme={isAotMode ? 'red' : 'blue'}
                variant="solid"
              >
                <Circle size="12px" bg={getPriorityColor(priority)} mr={2} />
                <TagLabel>{priority}</TagLabel>
                <TagCloseButton onClick={() => removePriority(priority)} />
              </Tag>
            ))}
          </Flex>
        )}

        {/* Filter Summary */}
        {hasFilters && (
          <Text fontSize="xs" color={isAotMode ? 'gray.400' : 'gray.500'}>
            Showing:{' '}
            {selectedCategoryIds.length > 0 && (
              <>
                {selectedCategoryIds.map(id => getCategoryName(id)).join(', ')} tasks
              </>
            )}
            {selectedCategoryIds.length > 0 && selectedPriorityLevels.length > 0 && ' with '}
            {selectedPriorityLevels.length > 0 && (
              <>
                {selectedPriorityLevels.join(', ')} priority
              </>
            )}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default DashboardFilters;

