import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  VStack,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Input,
  Badge,
  Collapse,
  Divider,
  Circle,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Category } from '../../services/tags';
import { CompletionStatus } from '../../hooks/useTaskFilters';
import './FilterPanel.css';

interface PriorityColor {
  level: string;
  color: string;
}

interface FilterPanelProps {
  categories: Category[];
  priorities: PriorityColor[];
  selectedCategoryIds: number[];
  selectedPriorityLevels: string[];
  deadlineBefore: Date | null;
  deadlineAfter: Date | null;
  completionStatus: CompletionStatus;
  onCategoryChange: (categoryIds: number[]) => void;
  onPriorityChange: (priorityLevels: string[]) => void;
  onDeadlineBeforeChange: (date: Date | null) => void;
  onDeadlineAfterChange: (date: Date | null) => void;
  onCompletionStatusChange: (status: CompletionStatus) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  priorities,
  selectedCategoryIds,
  selectedPriorityLevels,
  deadlineBefore,
  deadlineAfter,
  completionStatus,
  onCategoryChange,
  onPriorityChange,
  onDeadlineBeforeChange,
  onDeadlineAfterChange,
  onCompletionStatusChange,
  onClearAll,
  activeFilterCount,
}) => {
  const { isAotMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (categoryId: number) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategoryIds, categoryId]);
    }
  };

  const handlePriorityToggle = (priority: string) => {
    if (selectedPriorityLevels.includes(priority)) {
      onPriorityChange(selectedPriorityLevels.filter(p => p !== priority));
    } else {
      onPriorityChange([...selectedPriorityLevels, priority]);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDeadlineBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDeadlineBeforeChange(value ? new Date(value) : null);
  };

  const handleDeadlineAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDeadlineAfterChange(value ? new Date(value) : null);
  };

  return (
    <Box className="filter-panel-container" data-aot-mode={isAotMode}>
      {/* Filter Toggle Button */}
      <Button
        className="filter-panel-toggle-button"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        rightIcon={isOpen ? <ChevronUpIcon boxSize={5} /> : <ChevronDownIcon boxSize={5} />}
      >
        Filters
        {activeFilterCount > 0 && (
          <Badge 
            className="filter-panel-badge"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Filter Panel Content */}
      <Collapse in={isOpen} animateOpacity>
        <Box className="filter-panel-content">
          <VStack align="stretch" spacing={5}>
            {/* Categories */}
            <Box>
              <Text className="filter-panel-section-title">
                📁 Categories
              </Text>
              <Stack spacing={2} className="filter-panel-section-content">
                {categories.length === 0 ? (
                  <Text className="filter-panel-empty-text">
                    No categories available
                  </Text>
                ) : (
                  categories.map((category) => (
                    <Checkbox
                      key={category.id}
                      className="filter-panel-checkbox"
                      isChecked={selectedCategoryIds.includes(category.id!)}
                      onChange={() => handleCategoryToggle(category.id!)}
                      size="md"
                    >
                      <Flex align="center" gap={2}>
                        {category.icon && <span>{category.icon}</span>}
                        <Text fontSize="sm">
                          {category.name}
                        </Text>
                      </Flex>
                    </Checkbox>
                  ))
                )}
              </Stack>
            </Box>

            <Divider className="filter-panel-divider" />

            {/* Priorities */}
            <Box>
              <Text className="filter-panel-section-title">
                ⭐ Priorities
              </Text>
              <Stack spacing={2}>
                {priorities.length === 0 ? (
                  <Text className="filter-panel-empty-text">
                    No priorities available
                  </Text>
                ) : (
                  priorities.map((priority) => (
                    <Checkbox
                      key={priority.level}
                      className="filter-panel-checkbox"
                      isChecked={selectedPriorityLevels.includes(priority.level)}
                      onChange={() => handlePriorityToggle(priority.level)}
                      size="md"
                    >
                      <Flex align="center" gap={2}>
                        <Circle size="14px" bg={priority.color} boxShadow="sm" />
                        <Text fontSize="sm">
                          {priority.level}
                        </Text>
                      </Flex>
                    </Checkbox>
                  ))
                )}
              </Stack>
            </Box>

            <Divider className="filter-panel-divider" />

            {/* Deadline Filters */}
            <Box>
              <Text className="filter-panel-section-title">
                📅 Deadline
              </Text>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text className="filter-panel-date-label">
                    Before:
                  </Text>
                  <Input
                    className="filter-panel-date-input"
                    type="date"
                    size="sm"
                    value={formatDateForInput(deadlineBefore)}
                    onChange={handleDeadlineBeforeChange}
                  />
                </Box>
                <Box>
                  <Text className="filter-panel-date-label">
                    After:
                  </Text>
                  <Input
                    className="filter-panel-date-input"
                    type="date"
                    size="sm"
                    value={formatDateForInput(deadlineAfter)}
                    onChange={handleDeadlineAfterChange}
                  />
                </Box>
              </VStack>
            </Box>

            <Divider className="filter-panel-divider" />

            {/* Completion Status */}
            <Box>
              <Text className="filter-panel-section-title">
                ✓ Status
              </Text>
              <RadioGroup
                value={completionStatus}
                onChange={(value) => onCompletionStatusChange(value as CompletionStatus)}
              >
                <Stack spacing={2}>
                  <Radio 
                    className="filter-panel-radio"
                    value="all" 
                    size="md"
                  >
                    <Text fontSize="sm">
                      All Tasks
                    </Text>
                  </Radio>
                  <Radio 
                    className="filter-panel-radio"
                    value="completed" 
                    size="md"
                  >
                    <Text fontSize="sm">
                      Completed Only
                    </Text>
                  </Radio>
                  <Radio 
                    className="filter-panel-radio"
                    value="incomplete" 
                    size="md"
                  >
                    <Text fontSize="sm">
                      Incomplete Only
                    </Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            {/* Action Buttons */}
            <Flex gap={3} pt={3} borderTopWidth="1px" className="filter-panel-divider">
              <Button
                className="filter-panel-button-clear"
                size="md"
                onClick={onClearAll}
                variant="outline"
              >
                Clear All
              </Button>
              <Button
                className="filter-panel-button-apply"
                size="md"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </Flex>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterPanel;

