import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner, Text, VStack, useToast } from '@chakra-ui/react';
import { supabaseAuth } from '../services/supabaseAuth';
import './styles/LoginPage.css'; // Reuse the login page background

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        
        // Check for error parameters from Supabase OAuth redirect
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || 'OAuth authentication failed');
        }
        
        // Handle the OAuth callback and sync with backend
        const { data, error } = await supabaseAuth.handleOAuthCallback();

        if (error) {
          throw new Error(error);
        }

        if (data && data.user) {
          setStatus('success');
          
          toast({
            title: 'Welcome to the Survey Corps!',
            description: `Successfully logged in as ${data.user.first_name}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });

          // Redirect to tasks page after brief delay
          setTimeout(() => {
            navigate('/tasks');
          }, 1000);
        } else {
          throw new Error('No user data received');
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        
        toast({
          title: 'Authentication Failed',
          description: error.message || 'Failed to complete authentication',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });

        // Redirect to login after brief delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <Box className="login-page-background">
      <Box className="login-box">
        <VStack spacing={6} padding={8}>
          {status === 'processing' && (
            <>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="rgba(255, 255, 255, 0.2)"
                color="white"
                size="xl"
              />
              <Text color="white" fontSize="lg" fontWeight="bold">
                Authenticating with the Survey Corps...
              </Text>
            </>
          )}

          {status === 'success' && (
            <Text color="green.400" fontSize="lg" fontWeight="bold">
              ✓ Authentication successful! Redirecting...
            </Text>
          )}

          {status === 'error' && (
            <Text color="red.400" fontSize="lg" fontWeight="bold">
              ✗ Authentication failed. Redirecting to login...
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default AuthCallbackPage;

