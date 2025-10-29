import { Box, Avatar, Text, Menu, MenuButton, MenuList, MenuItem, useToast } from '@chakra-ui/react';
  import { useNavigate } from 'react-router-dom';
  import { useState, useEffect } from 'react';
  import api from '../services/api';
  import { useTheme } from '../contexts/ThemeContext';
  import './styles/ProfileDropdown.css';

  interface ProfileDropdownProps {
    firstName?: string;
    lastName?: string;
    userPhoto?: string;
    isCollapsed?: boolean;
  }

  const ProfileDropdown = ({ firstName, userPhoto, isCollapsed = false }: ProfileDropdownProps) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [profileImage, setProfileImage] = useState<string | undefined>(userPhoto);
    const { isAotMode } = useTheme();

    useEffect(() => {
      setProfileImage(userPhoto);
    }, [userPhoto]);

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