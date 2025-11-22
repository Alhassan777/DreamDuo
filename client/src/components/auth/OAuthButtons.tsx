import { Button, VStack, HStack, Text, useToast } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaFacebook } from 'react-icons/fa';
import { useState } from 'react';
import { supabaseAuth } from '../../services/supabaseAuth';
import { isSupabaseConfigured } from '../../config/supabase';
import { Provider } from '@supabase/supabase-js';
import './styles/OAuthButtons.css';

interface OAuthButtonsProps {
  mode?: 'login' | 'signup';
}

const OAuthButtons = ({ mode = 'login' }: OAuthButtonsProps) => {
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleOAuthLogin = async (provider: Provider, providerName: string) => {
    if (!isSupabaseConfigured()) {
      toast({
        title: 'OAuth Not Available',
        description: 'OAuth authentication is not configured on this server.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(providerName);
    try {
      await supabaseAuth.signInWithOAuth(provider);
      // The actual redirect happens automatically via Supabase
    } catch (error: any) {
      console.error(`${providerName} OAuth error:`, error);
      toast({
        title: 'Authentication Failed',
        description: error.message || `Failed to authenticate with ${providerName}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(null);
    }
  };

  return (
    <VStack spacing={3} width="100%">
      <HStack width="100%" spacing={2}>
        <div className="divider-line" />
        <Text className="divider-text" fontSize="sm" whiteSpace="nowrap">
          {mode === 'login' ? 'Or login with' : 'Or sign up with'}
        </Text>
        <div className="divider-line" />
      </HStack>

      <HStack width="100%" spacing={3}>
        <Button
          className="oauth-button google-button"
          onClick={() => handleOAuthLogin('google', 'Google')}
          isLoading={loading === 'Google'}
          leftIcon={<FcGoogle size={20} />}
          flex={1}
        >
          Google
        </Button>

        <Button
          className="oauth-button facebook-button"
          onClick={() => handleOAuthLogin('facebook', 'Facebook')}
          isLoading={loading === 'Facebook'}
          leftIcon={<FaFacebook size={20} color="#1877F2" />}
          flex={1}
        >
          Facebook
        </Button>
      </HStack>
      
      <HStack width="100%" spacing={3}>
        <Button
          className="oauth-button github-button"
          onClick={() => handleOAuthLogin('github', 'GitHub')}
          isLoading={loading === 'GitHub'}
          leftIcon={<FaGithub size={20} />}
          width="100%"
        >
          GitHub
        </Button>
      </HStack>
    </VStack>
  );
};

export default OAuthButtons;

