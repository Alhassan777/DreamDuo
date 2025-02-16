import { Box, Button, Input, VStack, Heading, Text, Link, InputGroup, InputRightElement, useToast } from '@chakra-ui/react';
import { FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
const navigate = useNavigate();
const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: ''
    };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Simulate a brief loading state
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in to Survey Corps.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        navigate('/daily-tasks');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900" w="100%" p={4}>
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg="gray.800" maxW="500px" w="100%">
        <VStack spacing={4} align="stretch">
          <Heading color="white" textAlign="center" mb={6}>
            Welcome to The Survey corps, Ready to View your Missions?
          </Heading>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="gray.300">Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  bg="gray.700"
                  color="white"
                  autoComplete="email"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel color="gray.300">Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    bg="gray.700"
                    color="white"
                    autoComplete="current-password"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                      color="gray.300"
                    >
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Logging in..."
              >
                Login
              </Button>
            </VStack>
          </form>

          <Text color="gray.300" textAlign="center" mt={4}>
            Haven't Joined Us yet?{' '}
            <Link color="purple.300" onClick={() => navigate('/signup')}>
              Please Register
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default LoginPage;