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
    <Box position="relative">
      {/* Filter Toggle Button */}
      <Button
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        rightIcon={isOpen ? <ChevronUpIcon boxSize={5} /> : <ChevronDownIcon boxSize={5} />}
        bg={isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'}
        color={isAotMode ? '#c89a5a' : 'white'}
        borderWidth="1px"
        borderColor={isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
        _hover={{
          bg: isAotMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
          borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.4)',
          transform: 'translateY(-1px)',
        }}
        _active={{
          transform: 'translateY(0)',
        }}
        transition="all 0.2s"
        fontWeight="medium"
        h="40px"
      >
        Filters
        {activeFilterCount > 0 && (
          <Badge 
            ml={2} 
            bg={isAotMode ? '#8B0000' : 'purple.600'}
            color="white"
            borderRadius="full"
            px={2}
            fontSize="xs"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Filter Panel Content */}
      <Collapse in={isOpen} animateOpacity>
        <Box 
          position="absolute" 
          top="calc(100% + 8px)"
          left={0} 
          zIndex={1500} 
          minW={{ base: "320px", md: "400px" }}
          maxW={{ base: "100vw", md: "500px" }}
        >
        <Box
          p={5}
          borderWidth="1px"
          borderRadius="lg"
          borderColor={isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
          bg={isAotMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.95)'}
          backdropFilter="blur(10px)"
          boxShadow="2xl"
          maxH="70vh"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(159, 122, 234, 0.5)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: isAotMode ? 'rgba(220, 162, 83, 0.7)' : 'rgba(159, 122, 234, 0.7)',
            },
          }}
        >
          <VStack align="stretch" spacing={5}>
            {/* Categories */}
            <Box>
              <Text 
                fontWeight="semibold" 
                mb={3} 
                fontSize="md"
                color={isAotMode ? '#dca253' : 'purple.300'}
              >
                📁 Categories
              </Text>
                  <Stack spacing={2} maxH="200px" overflowY="auto" pr={2}>
                {categories.length === 0 ? (
                  <Text fontSize="sm" color={isAotMode ? 'rgba(200, 154, 90, 0.6)' : 'gray.500'}>
                    No categories available
                  </Text>
                ) : (
                  categories.map((category) => (
                    <Checkbox
                      key={category.id}
                      isChecked={selectedCategoryIds.includes(category.id!)}
                      onChange={() => handleCategoryToggle(category.id!)}
                      colorScheme={isAotMode ? 'orange' : 'purple'}
                      size="md"
                      sx={{
                        '.chakra-checkbox__control': {
                          borderColor: isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(159, 122, 234, 0.5)',
                          bg: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <Flex align="center" gap={2}>
                        {category.icon && <span>{category.icon}</span>}
                        <Text fontSize="sm" color={isAotMode ? '#c89a5a' : 'white'}>
                          {category.name}
                        </Text>
                      </Flex>
                    </Checkbox>
                  ))
                )}
              </Stack>
            </Box>

            <Divider borderColor={isAotMode ? 'rgba(220, 162, 83, 0.2)' : 'rgba(255, 255, 255, 0.1)'} />

            {/* Priorities */}
            <Box>
              <Text 
                fontWeight="semibold" 
                mb={3} 
                fontSize="md"
                color={isAotMode ? '#dca253' : 'purple.300'}
              >
                ⭐ Priorities
              </Text>
              <Stack spacing={2}>
                {priorities.length === 0 ? (
                  <Text fontSize="sm" color={isAotMode ? 'rgba(200, 154, 90, 0.6)' : 'gray.500'}>
                    No priorities available
                  </Text>
                ) : (
                  priorities.map((priority) => (
                    <Checkbox
                      key={priority.level}
                      isChecked={selectedPriorityLevels.includes(priority.level)}
                      onChange={() => handlePriorityToggle(priority.level)}
                      colorScheme={isAotMode ? 'orange' : 'purple'}
                      size="md"
                      sx={{
                        '.chakra-checkbox__control': {
                          borderColor: isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(159, 122, 234, 0.5)',
                          bg: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <Flex align="center" gap={2}>
                        <Circle size="14px" bg={priority.color} boxShadow="sm" />
                        <Text fontSize="sm" color={isAotMode ? '#c89a5a' : 'white'}>
                          {priority.level}
                        </Text>
                      </Flex>
                    </Checkbox>
                  ))
                )}
              </Stack>
            </Box>

            <Divider borderColor={isAotMode ? 'rgba(220, 162, 83, 0.2)' : 'rgba(255, 255, 255, 0.1)'} />

            {/* Deadline Filters */}
            <Box>
              <Text 
                fontWeight="semibold" 
                mb={3} 
                fontSize="md"
                color={isAotMode ? '#dca253' : 'purple.300'}
              >
                📅 Deadline
              </Text>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text 
                    fontSize="sm" 
                    mb={2}
                    color={isAotMode ? '#c89a5a' : 'gray.300'}
                    fontWeight="medium"
                  >
                    Before:
                  </Text>
                  <Input
                    type="date"
                    size="sm"
                    value={formatDateForInput(deadlineBefore)}
                    onChange={handleDeadlineBeforeChange}
                    bg={isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)'}
                    borderColor={isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
                    color={isAotMode ? '#c89a5a' : 'white'}
                    _hover={{
                      borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.4)',
                    }}
                    _focus={{
                      borderColor: isAotMode ? '#dca253' : 'purple.500',
                      boxShadow: isAotMode ? '0 0 0 1px #dca253' : '0 0 0 1px purple.500',
                    }}
                  />
                </Box>
                <Box>
                  <Text 
                    fontSize="sm" 
                    mb={2}
                    color={isAotMode ? '#c89a5a' : 'gray.300'}
                    fontWeight="medium"
                  >
                    After:
                  </Text>
                  <Input
                    type="date"
                    size="sm"
                    value={formatDateForInput(deadlineAfter)}
                    onChange={handleDeadlineAfterChange}
                    bg={isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)'}
                    borderColor={isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
                    color={isAotMode ? '#c89a5a' : 'white'}
                    _hover={{
                      borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.4)',
                    }}
                    _focus={{
                      borderColor: isAotMode ? '#dca253' : 'purple.500',
                      boxShadow: isAotMode ? '0 0 0 1px #dca253' : '0 0 0 1px purple.500',
                    }}
                  />
                </Box>
              </VStack>
            </Box>

            <Divider borderColor={isAotMode ? 'rgba(220, 162, 83, 0.2)' : 'rgba(255, 255, 255, 0.1)'} />

            {/* Completion Status */}
            <Box>
              <Text 
                fontWeight="semibold" 
                mb={3} 
                fontSize="md"
                color={isAotMode ? '#dca253' : 'purple.300'}
              >
                ✓ Status
              </Text>
              <RadioGroup
                value={completionStatus}
                onChange={(value) => onCompletionStatusChange(value as CompletionStatus)}
                colorScheme={isAotMode ? 'orange' : 'purple'}
              >
                <Stack spacing={2}>
                  <Radio 
                    value="all" 
                    size="md"
                    sx={{
                      '.chakra-radio__control': {
                        borderColor: isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(159, 122, 234, 0.5)',
                        bg: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <Text fontSize="sm" color={isAotMode ? '#c89a5a' : 'white'}>
                      All Tasks
                    </Text>
                  </Radio>
                  <Radio 
                    value="completed" 
                    size="md"
                    sx={{
                      '.chakra-radio__control': {
                        borderColor: isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(159, 122, 234, 0.5)',
                        bg: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <Text fontSize="sm" color={isAotMode ? '#c89a5a' : 'white'}>
                      Completed Only
                    </Text>
                  </Radio>
                  <Radio 
                    value="incomplete" 
                    size="md"
                    sx={{
                      '.chakra-radio__control': {
                        borderColor: isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(159, 122, 234, 0.5)',
                        bg: isAotMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <Text fontSize="sm" color={isAotMode ? '#c89a5a' : 'white'}>
                      Incomplete Only
                    </Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            {/* Action Buttons */}
            <Flex gap={3} pt={3} borderTopWidth="1px" borderColor={isAotMode ? 'rgba(220, 162, 83, 0.2)' : 'rgba(255, 255, 255, 0.1)'}>
              <Button
                size="md"
                onClick={onClearAll}
                variant="outline"
                flex={1}
                borderColor={isAotMode ? 'rgba(220, 162, 83, 0.5)' : 'rgba(255, 255, 255, 0.3)'}
                color={isAotMode ? '#c89a5a' : 'white'}
                _hover={{
                  bg: isAotMode ? 'rgba(220, 162, 83, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.5)',
                }}
              >
                Clear All
              </Button>
              <Button
                size="md"
                onClick={() => setIsOpen(false)}
                flex={1}
                bg={isAotMode ? '#8B0000' : 'purple.600'}
                color="white"
                _hover={{
                  bg: isAotMode ? '#a00' : 'purple.700',
                  transform: 'translateY(-1px)',
                  boxShadow: 'md',
                }}
                _active={{
                  transform: 'translateY(0)',
                }}
                transition="all 0.2s"
              >
                Apply
              </Button>
            </Flex>
          </VStack>
        </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterPanel;

