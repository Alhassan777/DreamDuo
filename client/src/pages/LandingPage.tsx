import { Box, Button, Heading, VStack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900" w="100%" p={4}>
      <VStack gap={8} textAlign="center" width="100%">
        <Heading size="2xl" color="white">SURVEY CORPS</Heading>
        <Text color="gray.300" fontSize="xl">
          Manage your missions and defend humanity beyond the walls.
          Join the elite force and track your tasks with precision.
        </Text>
        <Box>
          <Button
            colorScheme="green"
            size="lg"
            mr={4}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </Button>
          <Button
            colorScheme="purple"
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
          >
            Log In
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default LandingPage;