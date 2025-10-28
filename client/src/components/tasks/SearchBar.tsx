import React, { useState, useEffect } from 'react';
import {
  InputGroup,
  Input,
  InputLeftElement,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useTheme } from '../../contexts/ThemeContext';
import './SearchBar.css';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search tasks, subtasks, and categories...',
}) => {
  const { isAotMode } = useTheme();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, onSearchChange]);

  // Sync with prop changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
  };

  return (
    <InputGroup 
      className="search-bar-container"
      size="md"
      data-aot-mode={isAotMode}
    >
      <InputLeftElement pointerEvents="none" h="full">
        <SearchIcon 
          className="search-bar-icon"
          boxSize={5}
        />
      </InputLeftElement>
      <Input
        className="search-bar-input"
        placeholder={placeholder}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        pr="2.5rem"
      />
      {localQuery && (
        <InputRightElement h="full">
          <IconButton
            className="search-bar-clear-button"
            aria-label="Clear search"
            icon={<CloseIcon />}
            size="xs"
            onClick={handleClear}
            variant="ghost"
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
};

export default SearchBar;

