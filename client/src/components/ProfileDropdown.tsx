import { Box, VStack, Avatar, Text, Button, Menu, MenuButton, MenuList, MenuItem, useToast } from '@chakra-ui/react';
  import { useNavigate } from 'react-router-dom';
  import { useRef, useState, useEffect } from 'react';
  import api from '../services/api';
  import { useTheme } from '../contexts/ThemeContext';

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
    const { isAotMode } = useTheme();

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

    const displayName = firstName || 'User';

    return (
      <Menu>
        <MenuButton
          as={Box}
          cursor="pointer"
          bg={isAotMode ? 'var(--aot-primary)' : 'gray.700'}
          p={2}
          borderRadius="md"
          _hover={{ bg: isAotMode ? 'var(--aot-primary-bg-hover)' : 'gray.600' }}
          transition="all 0.2s"
        >
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              size="sm"
              src={profileImage}
              name={displayName}
              bg={isAotMode ? 'var(--aot-accent)' : 'purple.500'}
            />
            {!isCollapsed && <Text color={isAotMode ? 'var(--aot-text)' : 'white'} fontSize="md" fontWeight="bold">{displayName}</Text>}
          </Box>
        </MenuButton>
        <MenuList 
          bg={isAotMode ? 'var(--aot-secondary)' : 'gray.800'} 
          borderColor={isAotMode ? 'var(--aot-border)' : 'gray.700'}
        >
          <MenuItem
            onClick={() => navigate('/edit-profile')}
            bg={isAotMode ? 'var(--aot-secondary)' : 'gray.800'}
            _hover={{ bg: isAotMode ? 'var(--aot-primary)' : 'gray.700' }}
            color={isAotMode ? 'var(--aot-text)' : 'gray.100'}
            transition="all 0.2s"
          >
            Edit Profile
          </MenuItem>
          <MenuItem
            onClick={handleSignOut}
            bg={isAotMode ? 'var(--aot-secondary)' : 'gray.800'}
            _hover={{ bg: isAotMode ? 'var(--aot-primary)' : 'gray.700' }}
            color={isAotMode ? '#ff6b6b' : 'red.400'}
            transition="all 0.2s"
          >
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    );
  };

  export default ProfileDropdown;