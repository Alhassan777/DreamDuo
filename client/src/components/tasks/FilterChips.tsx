import React from 'react';
import {
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  Button,
  Circle,
} from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import { Category } from '../../services/tags';
import { format } from 'date-fns';

interface PriorityColor {
  level: string;
  color: string;
}

interface FilterChipsProps {
  searchQuery: string;
  selectedCategoryIds: number[];
  selectedPriorityLevels: string[];
  deadlineBefore: Date | null;
  deadlineAfter: Date | null;
  completionStatus: 'all' | 'completed' | 'incomplete';
  categories: Category[];
  priorities: PriorityColor[];
  onRemoveSearch: () => void;
  onRemoveCategory: (categoryId: number) => void;
  onRemovePriority: (priority: string) => void;
  onRemoveDeadlineBefore: () => void;
  onRemoveDeadlineAfter: () => void;
  onRemoveCompletionStatus: () => void;
  onClearAll: () => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  searchQuery,
  selectedCategoryIds,
  selectedPriorityLevels,
  deadlineBefore,
  deadlineAfter,
  completionStatus,
  categories,
  priorities,
  onRemoveSearch,
  onRemoveCategory,
  onRemovePriority,
  onRemoveDeadlineBefore,
  onRemoveDeadlineAfter,
  onRemoveCompletionStatus,
  onClearAll,
}) => {
  const { isAotMode } = useTheme();

  // Check if there are any active filters
  const hasFilters =
    searchQuery.trim() ||
    selectedCategoryIds.length > 0 ||
    selectedPriorityLevels.length > 0 ||
    deadlineBefore ||
    deadlineAfter ||
    completionStatus !== 'all';

  if (!hasFilters) {
    return null;
  }

  // Helper to get category name by ID
  const getCategoryName = (id: number) => {
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
  };

  // Helper to get category icon by ID
  const getCategoryIcon = (id: number) => {
    const category = categories.find(c => c.id === id);
    return category?.icon || '';
  };

  // Helper to get priority color
  const getPriorityColor = (level: string) => {
    const priority = priorities.find(p => p.level === level);
    return priority?.color || '#gray';
  };

  return (
    <Flex gap={2} flexWrap="wrap" align="center" mt={4} mb={4}>
      {/* Search Query Chip */}
      {searchQuery.trim() && (
        <Tag
          size="md"
          colorScheme={isAotMode ? 'red' : 'blue'}
          variant="solid"
        >
          <TagLabel>Search: "{searchQuery}"</TagLabel>
          <TagCloseButton onClick={onRemoveSearch} />
        </Tag>
      )}

      {/* Category Chips */}
      {selectedCategoryIds.map((categoryId) => (
        <Tag
          key={`category-${categoryId}`}
          size="md"
          colorScheme={isAotMode ? 'red' : 'blue'}
          variant="solid"
        >
          <TagLabel>
            {getCategoryIcon(categoryId)} {getCategoryName(categoryId)}
          </TagLabel>
          <TagCloseButton onClick={() => onRemoveCategory(categoryId)} />
        </Tag>
      ))}

      {/* Priority Chips */}
      {selectedPriorityLevels.map((priority) => (
        <Tag
          key={`priority-${priority}`}
          size="md"
          colorScheme={isAotMode ? 'red' : 'blue'}
          variant="solid"
        >
          <Circle size="12px" bg={getPriorityColor(priority)} mr={2} />
          <TagLabel>{priority}</TagLabel>
          <TagCloseButton onClick={() => onRemovePriority(priority)} />
        </Tag>
      ))}

      {/* Deadline Before Chip */}
      {deadlineBefore && (
        <Tag
          size="md"
          colorScheme={isAotMode ? 'red' : 'blue'}
          variant="solid"
        >
          <TagLabel>Due Before: {format(deadlineBefore, 'MMM d, yyyy')}</TagLabel>
          <TagCloseButton onClick={onRemoveDeadlineBefore} />
        </Tag>
      )}

      {/* Deadline After Chip */}
      {deadlineAfter && (
        <Tag
          size="md"
          colorScheme={isAotMode ? 'red' : 'blue'}
          variant="solid"
        >
          <TagLabel>Due After: {format(deadlineAfter, 'MMM d, yyyy')}</TagLabel>
          <TagCloseButton onClick={onRemoveDeadlineAfter} />
        </Tag>
      )}

      {/* Completion Status Chip */}
      {completionStatus !== 'all' && (
        <Tag
          size="md"
          colorScheme={isAotMode ? 'red' : 'blue'}
          variant="solid"
        >
          <TagLabel>
            Status: {completionStatus === 'completed' ? 'Completed' : 'Incomplete'}
          </TagLabel>
          <TagCloseButton onClick={onRemoveCompletionStatus} />
        </Tag>
      )}

      {/* Clear All Button */}
      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearAll}
          colorScheme={isAotMode ? 'red' : 'blue'}
        >
          Clear All Filters
        </Button>
      )}
    </Flex>
  );
};

export default FilterChips;

