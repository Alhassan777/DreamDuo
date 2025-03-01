import { Box, Button, Input, VStack, Heading, Text, Link, InputGroup, InputRightElement, useToast } from '@chakra-ui/react';
import { FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react';
import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LoginPage.css';
import surveyCorpsKey from '../assets/key.png';
import hidePasswordIcon from '../assets/show_password.png';
import showPasswordIcon from '../assets/hide_password.png';
import api from '../services/api';
import { auth } from '../services/api';

const LoginPage = () => {
const navigate = useNavigate();
const toast = useToast();

  useEffect(() => {
    // No need to check localStorage token anymore as we're using cookies
  }, []);

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
        const response = await auth.login(formData.email, formData.password);
        
        if (response && response.user) {
          toast({
            title: 'Welcome back!',
            description: 'Successfully logged in to Survey Corps.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          navigate('/daily-tasks');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        let errorMessage = 'An unexpected error occurred. Please try again.';

        if (error.response) {
          switch (error.response.status) {
            case 401:
              errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
              break;
            case 404:
              errorMessage = 'Email not registered. Please sign up first.';
              break;
            case 429:
              errorMessage = 'Too many login attempts. Please try again later.';
              break;
            case 403:
              errorMessage = 'Account is locked. Please contact support.';
              break;
            default:
              errorMessage = 'Unable to log in. Please try again later.';
          }
        }

        toast({
          title: 'Login Failed',
          description: errorMessage,
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
    <Box className="login-page-background">
      <Box className="login-box">
        <Box className="login-container">
          <Box className="login-form-container">
            <VStack spacing={4} align="stretch">
              <Box className="key-image-container">
                <img src={surveyCorpsKey} alt="Survey Corps Key" className="login-key-image" />
              </Box>
              <Heading className="login-heading">
                Welcome Danchou, Ready to View your Missions?
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
                          p={1}
                          background={"transparent"}
                        _hover={{ bg: "transparent" }}
                        >
                          <img
                            src={showPassword ? hidePasswordIcon : showPasswordIcon}
                            alt={showPassword ? "Hide password" : "Show password"}
                            className="password-toggle-icon"
                          />
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
              
                  <Button
                    type="submit"
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