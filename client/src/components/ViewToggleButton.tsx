import React from 'react';
import { Button, ButtonGroup, Icon } from '@chakra-ui/react';
import { BsGrid3X3, BsKanban } from 'react-icons/bs';

export type ViewMode = 'list' | 'canvas';

interface ViewToggleButtonProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ viewMode, onToggle }) => {
  return (
    <ButtonGroup isAttached size="md">
      <Button
        leftIcon={<Icon as={BsGrid3X3} />}
        onClick={() => onToggle('list')}
        bg={viewMode === 'list' ? 'var(--color-button-primary)' : 'transparent'}
        color={viewMode === 'list' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
        borderWidth="1px"
        borderColor={viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-border)'}
        borderRadius="var(--border-radius-md)"
        transition={`all var(--animation-duration) var(--animation-timing)`}
        _hover={{
          bg: viewMode === 'list' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
          borderColor: 'var(--color-primary)',
          transform: 'translateY(-1px)'
        }}
      >
        List View
      </Button>
      <Button
        leftIcon={<Icon as={BsKanban} />}
        onClick={() => onToggle('canvas')}
        bg={viewMode === 'canvas' ? 'var(--color-button-primary)' : 'transparent'}
        color={viewMode === 'canvas' ? 'var(--color-button-primary-text)' : 'var(--color-text)'}
        borderWidth="1px"
        borderColor={viewMode === 'canvas' ? 'var(--color-primary)' : 'var(--color-border)'}
        borderRadius="var(--border-radius-md)"
        transition={`all var(--animation-duration) var(--animation-timing)`}
        _hover={{
          bg: viewMode === 'canvas' ? 'var(--color-button-primary-hover)' : 'var(--color-hover-overlay)',
          borderColor: 'var(--color-primary)',
          transform: 'translateY(-1px)'
        }}
      >
        Canvas View
      </Button>
    </ButtonGroup>
  );
};

export default ViewToggleButton;


