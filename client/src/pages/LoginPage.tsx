import { Box, Button, Input, VStack, Heading, Text, Link, InputGroup, InputRightElement, useToast } from '@chakra-ui/react';
import { FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LoginPage.css';

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
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store the token in localStorage
        localStorage.setItem('token', data.access_token);

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
          description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
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
        <Box className="login-container">
          <Box className="login-form-container">
            <VStack spacing={4} align="stretch">
              <Heading className="login-heading">
                Welcome to The Survey corps, Ready to View your Missions?
              </Heading>
              
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel className="form-label">Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                      autoComplete="email"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
              
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel className="form-label">Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="form-input"
                        autoComplete="current-password"
                      />
                      <InputRightElement>
                        <Button
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-button"
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
                    className="submit-button"
                    isLoading={isLoading}
                    loadingText="Logging in..."
                  >
                    Login
                  </Button>
                </VStack>
              </form>
              
              <Text className="signup-link-text">
                Haven't Joined Us yet?{' '}
                <Link className="signup-link" onClick={() => navigate('/signup')}>
                  Please Register
                </Link>
              </Text>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;