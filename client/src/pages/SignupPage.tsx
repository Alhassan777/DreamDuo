import { Button, FormControl, FormLabel, Input, VStack, Heading, FormErrorMessage, useToast, InputGroup, InputRightElement, Text, Link } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/SignupPage.css';
import surveyCorpsLogo from '../assets/survey_corps.png';
import hidePasswordIcon from '../assets/show_password.png';
import showPasswordIcon from '../assets/hide_password.png';

const SignupPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 400) {
            setErrors(prev => ({ ...prev, email: 'Email already exists' }));
            throw new Error('Email already exists');
          }
          throw new Error(data.error || 'Registration failed');
        }

        toast({
          title: 'Account created.',
          description: 'Welcome to the Survey Corps!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        localStorage.setItem('token', data.access_token);
        navigate('/daily-tasks');
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
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
    <div className="signup-page-background">
      <div className="signup-form-box">
        <div className="survey-corps-logo">
          <img src={surveyCorpsLogo} alt="Survey Corps Emblem" />
        </div>
        <VStack spacing={4} align="stretch" className="signup-content">
          <Heading className="signup-heading">
            Ready to Join the Survey Corps?
          </Heading>
          
          <form onSubmit={handleSubmit} className="signup-form">
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel className="form-label">First Name</FormLabel>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="form-input"
                />
                <FormErrorMessage>{errors.firstName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel className="form-label">Last Name</FormLabel>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="form-input"
                />
                <FormErrorMessage>{errors.lastName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel className="form-label">Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
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
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-button"
                      p={1}
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

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel className="form-label">Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="form-input"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle-button"
                      p={1}
                    >
                      <img
                        src={showConfirmPassword ? hidePasswordIcon : showPasswordIcon}
                        alt={showConfirmPassword ? "Hide password" : "Show password"}
                        className="password-toggle-icon"
                      />
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                className="submit-button"
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Sign Up
              </Button>
            </VStack>
          </form>

          <Text className="login-link-text">
            Already have an account?{' '}
            <Link className="login-link" onClick={() => navigate('/')}>
              Login here
            </Link>
          </Text>
        </VStack>
      </div>
    </div>
  );
};

export default SignupPage;