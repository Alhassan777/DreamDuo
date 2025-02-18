import { Box, VStack, Avatar, Text, Button, Menu, MenuButton, MenuList, MenuItem, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';

interface ProfileDropdownProps {
  userName?: string;
  userPhoto?: string;
  isCollapsed?: boolean;
}

const ProfileDropdown = ({ userName = 'Scout', userPhoto, isCollapsed = false }: ProfileDropdownProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>(userPhoto);

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
        // Here you would typically upload the image to your backend
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

  const handleSignOut = () => {
    // Here you would typically handle sign out logic
    navigate('/login');
  };

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
            name={userName}
            bg="purple.500"
          />
          {!isCollapsed && <Text color="white" fontSize="sm">{userName}</Text>}
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