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
      size="md" 
      maxW={{ base: '100%', md: '500px' }}
      flex={{ base: '1', md: '0 1 500px' }}
    >
      <InputLeftElement pointerEvents="none" h="full">
        <SearchIcon 
          color={isAotMode ? '#c89a5a' : 'gray.400'} 
          boxSize={5}
        />
      </InputLeftElement>
      <Input
        placeholder={placeholder}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        pr="2.5rem"
        h="40px"
        fontSize="md"
        bg={isAotMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.1)'}
        borderColor={isAotMode ? 'rgba(220, 162, 83, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
        color={isAotMode ? '#c89a5a' : 'white'}
        _placeholder={{
          color: isAotMode ? 'rgba(200, 154, 90, 0.5)' : 'rgba(255, 255, 255, 0.4)',
        }}
        _hover={{
          borderColor: isAotMode ? '#dca253' : 'rgba(255, 255, 255, 0.4)',
          bg: isAotMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
        }}
        _focus={{
          borderColor: isAotMode ? '#dca253' : 'purple.500',
          boxShadow: isAotMode ? '0 0 0 1px #dca253' : '0 0 0 1px purple.500',
          bg: isAotMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
        }}
        transition="all 0.2s"
      />
      {localQuery && (
        <InputRightElement h="full">
          <IconButton
            aria-label="Clear search"
            icon={<CloseIcon />}
            size="xs"
            onClick={handleClear}
            variant="ghost"
            color={isAotMode ? '#c89a5a' : 'gray.400'}
            _hover={{
              bg: isAotMode ? 'rgba(220, 162, 83, 0.2)' : 'rgba(255, 255, 255, 0.2)',
              color: isAotMode ? '#dca253' : 'white',
            }}
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
};

export default SearchBar;

