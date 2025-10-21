import React from 'react';
import { Box, Text, Icon } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

interface AddTaskCardProps {
  onClick: () => void;
}

const AddTaskCard: React.FC<AddTaskCardProps> = ({ onClick }) => {
  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minH="200px"
      border="2px dashed"
      borderColor="var(--color-border)"
      borderRadius="var(--border-radius-lg)"
      bg="transparent"
      transition={`all var(--animation-duration) var(--animation-timing)`}
      _hover={{
        borderColor: 'var(--color-primary)',
        bg: 'var(--color-hover-overlay)',
        transform: 'translateY(-2px)',
      }}
      gap={3}
      p={6}
    >
      <Icon
        as={AddIcon}
        boxSize={8}
        color="var(--color-text-secondary)"
        transition={`all var(--animation-duration) var(--animation-timing)`}
        _groupHover={{ color: 'var(--color-primary)' }}
      />
      <Text
        fontSize="lg"
        fontWeight="medium"
        color="var(--color-text-secondary)"
        transition={`all var(--animation-duration) var(--animation-timing)`}
      >
        Add New Task
      </Text>
    </Box>
  );
};

export default AddTaskCard;

