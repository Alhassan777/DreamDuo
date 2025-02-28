import { Box, VStack, Heading, FormControl, FormLabel, Input, Button, useToast, Avatar, FormErrorMessage, Flex, Text } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

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

  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {

      try {
        const response = await api.get('/user/profile');
        const data = response.data;
        setFormData(prev => ({
          ...prev,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          email: data.user.email
        }));
        setUserData({
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          email: data.user.email
        });
        setProfileImage(data.user.profile_photo);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load profile',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchProfile();
  }, []);

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

    // Check if any credential fields have changed
    const hasCredentialChanges = 
      formData.firstName !== userData.first_name ||
      formData.lastName !== userData.last_name ||
      formData.email !== userData.email ||
      formData.newPassword;

    // Require current password if there are credential changes
    if (hasCredentialChanges && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required to update profile information';
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
        // First verify the current password if there are credential changes
        const hasCredentialChanges = 
          formData.firstName !== userData.first_name ||
          formData.lastName !== userData.last_name ||
          formData.email !== userData.email ||
          formData.newPassword;

        if (hasCredentialChanges) {
          // Verify current password first
          const verifyResponse = await api.post('/auth/verify-password', {
            password: formData.currentPassword
          });

          if (!verifyResponse.data.valid) {
            toast({
              title: 'Error',
              description: 'Current password is incorrect',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            setIsLoading(false);
            return;
          }
        }

        // If password is verified or no credential changes, proceed with update
        const response = await api.put('/user/profile', {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          new_password: formData.newPassword
        });

        // Update local state with the new user data
        if (response.data && response.data.user) {
          setUserData({
            first_name: response.data.user.first_name,
            last_name: response.data.user.last_name,
            email: response.data.user.email
          });

          // Reset password fields
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }

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
          description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        try {
          const response = await api.put('/user/profile', {
            profile_photo: imageData
          });
          setProfileImage(response.data.user.profile_photo);
          toast({
            title: 'Profile photo updated',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          toast({
            title: 'Error updating profile photo',
            description: error instanceof Error ? error.message : 'An error occurred',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      };
      reader.readAsDataURL(file);
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
                  name={`${formData.firstName} ${formData.lastName}`}
                  bg="purple.500"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                />
              </Box>
              <VStack align="start" spacing={2}>
                <Text color="white" fontSize="lg" fontWeight="bold">{formData.firstName} {formData.lastName}</Text>
                <Text color="gray.400" fontSize="md">{formData.email}</Text>
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