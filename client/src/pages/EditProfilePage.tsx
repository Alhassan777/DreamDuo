import { Box, VStack, Heading, FormControl, FormLabel, Input, Button, useToast, Avatar, FormErrorMessage, Flex, Text } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        toast({
          title: 'Profile photo updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required to set new password';
      isValid = false;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
      isValid = false;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (formData.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
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
        // Here you would typically update the user profile in your backend
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call

        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        navigate('/daily-tasks');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <Box maxW="600px" mx="auto" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading color="white">Edit Profile</Heading>

          <Box bg="gray.800" p={6} borderRadius="lg" mb={4}>
            <Flex align="center" justify="center" gap={6}>
              <Box position="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <Avatar
                  size="2xl"
                  src={profileImage}
                  name="User"
                  bg="purple.500"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                />
              </Box>
              <VStack align="start" spacing={2}>
                <Text color="white" fontSize="lg" fontWeight="bold">Profile Photo</Text>
                <Button
                  leftIcon={<EditIcon />}
                  variant="outline"
                  colorScheme="purple"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>
              </VStack>
            </Flex>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel color="gray.300">First Name</FormLabel>
                <Input
                  bg="gray.700"
                  color="white"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <FormErrorMessage>{errors.firstName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel color="gray.300">Last Name</FormLabel>
                <Input
                  bg="gray.700"
                  color="white"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                <FormErrorMessage>{errors.lastName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="gray.300">Email</FormLabel>
                <Input
                  type="email"
                  bg="gray.700"
                  color="white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.currentPassword}>
                <FormLabel color="gray.300">Current Password</FormLabel>
                <Input
                  type="password"
                  bg="gray.700"
                  color="white"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
                <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.newPassword}>
                <FormLabel color="gray.300">New Password</FormLabel>
                <Input
                  type="password"
                  bg="gray.700"
                  color="white"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel color="gray.300">Confirm New Password</FormLabel>
                <Input
                  type="password"
                  bg="gray.700"
                  color="white"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Updating..."
              >
                Save Changes
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </DashboardLayout>
  );
};

export default EditProfilePage;