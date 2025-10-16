import { useState, useMemo } from 'react';

export type TimeScope = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CompletionStatus = 'all' | 'completed' | 'incomplete';

export interface TaskFilters {
  timeScope: TimeScope;
  anchorDate: Date;
  searchQuery: string;
  categoryIds: number[];
  priorityLevels: string[];
  deadlineBefore: Date | null;
  deadlineAfter: Date | null;
  completionStatus: CompletionStatus;
}

export const useTaskFilters = () => {
  const [filters, setFilters] = useState<TaskFilters>({
    timeScope: 'daily',
    anchorDate: new Date(),
    searchQuery: '',
    categoryIds: [],
    priorityLevels: [],
    deadlineBefore: null,
    deadlineAfter: null,
    completionStatus: 'all',
  });

  // Calculate active filter count (excluding time scope and anchor date)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.priorityLevels.length > 0) count++;
    if (filters.deadlineBefore) count++;
    if (filters.deadlineAfter) count++;
    if (filters.completionStatus !== 'all') count++;
    return count;
  }, [filters]);

  const setTimeScope = (timeScope: TimeScope) => {
    setFilters(prev => ({ ...prev, timeScope }));
  };

  const setAnchorDate = (anchorDate: Date) => {
    setFilters(prev => ({ ...prev, anchorDate }));
  };

  const setSearchQuery = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  };

  const setCategoryIds = (categoryIds: number[]) => {
    setFilters(prev => ({ ...prev, categoryIds }));
  };

  const toggleCategory = (categoryId: number) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const setPriorityLevels = (priorityLevels: string[]) => {
    setFilters(prev => ({ ...prev, priorityLevels }));
  };

  const togglePriority = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priorityLevels: prev.priorityLevels.includes(priority)
        ? prev.priorityLevels.filter(p => p !== priority)
        : [...prev.priorityLevels, priority]
    }));
  };

  const setDeadlineBefore = (deadlineBefore: Date | null) => {
    setFilters(prev => ({ ...prev, deadlineBefore }));
  };

  const setDeadlineAfter = (deadlineAfter: Date | null) => {
    setFilters(prev => ({ ...prev, deadlineAfter }));
  };

  const setCompletionStatus = (completionStatus: CompletionStatus) => {
    setFilters(prev => ({ ...prev, completionStatus }));
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      categoryIds: [],
      priorityLevels: [],
      deadlineBefore: null,
      deadlineAfter: null,
      completionStatus: 'all',
    }));
  };

  const clearFilter = (filterType: string, value?: any) => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'category':
        if (value !== undefined) {
          setCategoryIds(filters.categoryIds.filter(id => id !== value));
        } else {
          setCategoryIds([]);
        }
        break;
      case 'priority':
        if (value !== undefined) {
          setPriorityLevels(filters.priorityLevels.filter(p => p !== value));
        } else {
          setPriorityLevels([]);
        }
        break;
      case 'deadlineBefore':
        setDeadlineBefore(null);
        break;
      case 'deadlineAfter':
        setDeadlineAfter(null);
        break;
      case 'completionStatus':
        setCompletionStatus('all');
        break;
    }
  };

  return {
    filters,
    activeFilterCount,
    setTimeScope,
    setAnchorDate,
    setSearchQuery,
    setCategoryIds,
    toggleCategory,
    setPriorityLevels,
    togglePriority,
    setDeadlineBefore,
    setDeadlineAfter,
    setCompletionStatus,
    clearAllFilters,
    clearFilter,
  };
};

