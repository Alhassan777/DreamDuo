  import { Box, VStack, Avatar, Text, Button, Menu, MenuButton, MenuList, MenuItem, useToast } from '@chakra-ui/react';
  import { useNavigate } from 'react-router-dom';
  import { useRef, useState, useEffect } from 'react';
  import api from '../services/api';

  interface ProfileDropdownProps {
    firstName?: string;
    lastName?: string;
    userPhoto?: string;
    isCollapsed?: boolean;
  }

  const ProfileDropdown = ({ firstName, lastName, userPhoto, isCollapsed = false }: ProfileDropdownProps) => {
    const navigate = useNavigate();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profileImage, setProfileImage] = useState<string | undefined>(userPhoto);

    useEffect(() => {
      setProfileImage(userPhoto);
    }, [userPhoto]);

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
            // ✅ Use Axios instead of fetch
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

    const handleSignOut = () => {
      localStorage.removeItem('token');
      navigate('/');
    };

    const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'User';

    return (
      <Menu>
        <MenuButton
          as={Box}
          cursor="pointer"
          bg="gray.700"
          p={2}
          borderRadius="md"
          _hover={{ bg: 'gray.600' }}
        >
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              size="sm"
              src={profileImage}
              name={displayName}
              bg="purple.500"
            />
            {!isCollapsed && <Text color="white" fontSize="sm">{displayName}</Text>}
          </Box>
        </MenuButton>
        <MenuList bg="gray.800" borderColor="gray.700">
          <MenuItem
            onClick={() => navigate('/edit-profile')}
            bg="gray.800"
            _hover={{ bg: 'gray.700' }}
            color="gray.100"
          >
            Edit Profile
          </MenuItem>
          <MenuItem
            onClick={handleSignOut}
            bg="gray.800"
            _hover={{ bg: 'gray.700' }}
            color="red.400"
          >
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    );
  };

  export default ProfileDropdown;