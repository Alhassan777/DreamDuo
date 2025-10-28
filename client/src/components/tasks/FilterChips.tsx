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
import './FilterChips.css';

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
    <Flex className="filter-chips-container" data-aot-mode={isAotMode}>
      {/* Search Query Chip */}
      {searchQuery.trim() && (
        <Tag className="filter-chip" size="md" variant="solid">
          <TagLabel className="filter-chip-label">Search: "{searchQuery}"</TagLabel>
          <TagCloseButton className="filter-chip-close-button" onClick={onRemoveSearch} />
        </Tag>
      )}

      {/* Category Chips */}
      {selectedCategoryIds.map((categoryId) => (
        <Tag
          key={`category-${categoryId}`}
          className="filter-chip"
          size="md"
          variant="solid"
        >
          <TagLabel className="filter-chip-label">
            {getCategoryIcon(categoryId)} {getCategoryName(categoryId)}
          </TagLabel>
          <TagCloseButton className="filter-chip-close-button" onClick={() => onRemoveCategory(categoryId)} />
        </Tag>
      ))}

      {/* Priority Chips */}
      {selectedPriorityLevels.map((priority) => (
        <Tag
          key={`priority-${priority}`}
          className="filter-chip"
          size="md"
          variant="solid"
        >
          <Circle className="filter-chip-priority-indicator" size="12px" bg={getPriorityColor(priority)} mr={2} />
          <TagLabel className="filter-chip-label">{priority}</TagLabel>
          <TagCloseButton className="filter-chip-close-button" onClick={() => onRemovePriority(priority)} />
        </Tag>
      ))}

      {/* Deadline Before Chip */}
      {deadlineBefore && (
        <Tag className="filter-chip" size="md" variant="solid">
          <TagLabel className="filter-chip-label">Due Before: {format(deadlineBefore, 'MMM d, yyyy')}</TagLabel>
          <TagCloseButton className="filter-chip-close-button" onClick={onRemoveDeadlineBefore} />
        </Tag>
      )}

      {/* Deadline After Chip */}
      {deadlineAfter && (
        <Tag className="filter-chip" size="md" variant="solid">
          <TagLabel className="filter-chip-label">Due After: {format(deadlineAfter, 'MMM d, yyyy')}</TagLabel>
          <TagCloseButton className="filter-chip-close-button" onClick={onRemoveDeadlineAfter} />
        </Tag>
      )}

      {/* Completion Status Chip */}
      {completionStatus !== 'all' && (
        <Tag className="filter-chip" size="md" variant="solid">
          <TagLabel className="filter-chip-label">
            Status: {completionStatus === 'completed' ? 'Completed' : 'Incomplete'}
          </TagLabel>
          <TagCloseButton className="filter-chip-close-button" onClick={onRemoveCompletionStatus} />
        </Tag>
      )}

      {/* Clear All Button */}
      {hasFilters && (
        <Button
          className="filter-chips-clear-all-button"
          size="sm"
          variant="ghost"
          onClick={onClearAll}
        >
          Clear All Filters
        </Button>
      )}
    </Flex>
  );
};

export default FilterChips;

