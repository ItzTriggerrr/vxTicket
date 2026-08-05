"use client";

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState } from "react";

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function LoginPage() {
  const toast = useToast();

  // Input Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mechanics States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Directs exactly to your local nested login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      // Content-Type Guard Check: intercepts raw HTML 404 pages before they cause client crashes
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setErrorMessage(`Server configuration anomaly (Status ${response.status}). Verify that your login API folder is located exactly at /api/auth/login.`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check your credentials.");
      } else {
        toast({
          title: "Logged in successfully.",
          description: "Welcome back! Initializing your dashboard...",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });

        // 🚀 Caches profile attributes so dashboard greetings update dynamically
        localStorage.setItem("qs_user_profile", JSON.stringify(data.profile));

        setEmail("");
        setPassword("");

        setTimeout(() => {
          window.location.href = "/en/dashboard";
        }, 1200);
      }
    } catch (err) {
      console.error("Frontend login handling exception:", err);
      setErrorMessage("An unexpected network anomaly occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      bg="#0D0D0D"
      color="white"
      align={{ base: "flex-start", md: "center" }}
      justify="center"
      px={{ base: "24px", md: "40px" }}
      py={{ base: "20px", md: "40px" }}
    >
      <Box as="form" onSubmit={handleLogin} w="100%" maxW={{ base: "100%", md: "460px" }} position="relative">
        
        {/* Back button */}
        <Box mb={{ base: "32px", md: "40px" }}>
          <IconButton
            aria-label="Go back"
            icon={<ArrowLeftIcon />}
            variant="ghost"
            color="white"
            p={0}
            minW="auto"
            h="auto"
            _hover={{ bg: "transparent", opacity: 0.7 }}
            _active={{ bg: "transparent" }}
            onClick={() => window.location.href = '/en/'}
          />
        </Box>

        {/* Header */}
        <Box mb={{ base: "28px", md: "36px" }}>
          <Text fontSize={{ base: "32px", md: "40px" }} fontWeight="800" lineHeight="1.15" color="white" mb="8px" letterSpacing="-0.5px">
            Welcome Back
          </Text>
          <Text fontSize={{ base: "14px", md: "16px" }} color="rgba(255,255,255,0.55)" fontWeight="500">
            Log in to manage your vxTicket events and tickets
          </Text>
        </Box>

        {/* Live System Logic Error Warning Alerts */}
        {errorMessage && (
          <Alert status="error" bg="rgba(239, 68, 68, 0.1)" border="1px solid #ef4444" borderRadius="12px" color="white" mb="24px" fontSize="14px">
            <AlertIcon color="#ef4444" />
            {errorMessage}
          </Alert>
        )}

        {/* Form Elements */}
        <VStack spacing={{ base: "20px", md: "24px" }} align="stretch">
          
          {/* Email Address */}
          <FormControl isRequired>
            <FormLabel color="white" fontSize="14px" fontWeight="600" mb="8px">
              Email Address
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="52px" pl="4px">
                <Box color="rgba(255,255,255,0.45)">
                  <MailIcon />
                </Box>
              </InputLeftElement>
              <Input
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                h="52px"
                bg="#1A1A1A"
                border="1.5px solid #2A2A2A"
                borderRadius="12px"
                color="white"
                fontSize="15px"
                pl="44px"
                _placeholder={{ color: "rgba(255,255,255,0.35)" }}
                _hover={{ borderColor: "#3A3A3A" }}
                _focus={{ borderColor: "#22C55E", boxShadow: "none" }}
              />
            </InputGroup>
          </FormControl>

          {/* Password */}
          <FormControl isRequired>
            <Flex justify="space-between" align="center" mb="8px">
              <FormLabel color="white" fontSize="14px" fontWeight="600" m={0}>
                Password
              </FormLabel>
              <Link 
                fontSize="13px" 
                color="#22C55E" 
                fontWeight="500" 
                _hover={{ textDecoration: "underline" }}
                onClick={() => window.location.href = '/en/forgot-password'}
              >
                Forgot Password?
              </Link>
            </Flex>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="52px" pl="4px">
                <Box color="rgba(255,255,255,0.45)">
                  <LockIcon />
                </Box>
              </InputLeftElement>
              <Input
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                h="52px"
                bg="#1A1A1A"
                border="1.5px solid #2A2A2A"
                borderRadius="12px"
                color="white"
                fontSize="15px"
                pl="44px"
                pr="48px"
                _placeholder={{ color: "rgba(255,255,255,0.45)", fontSize: "20px", letterSpacing: "3px" }}
                _hover={{ borderColor: "#3A3A3A" }}
                _focus={{ borderColor: "#22C55E", boxShadow: "none" }}
              />
              <InputRightElement h="52px" pr="4px">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  icon={showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  variant="ghost"
                  color="rgba(255,255,255,0.45)"
                  size="sm"
                  minW="auto"
                  h="auto"
                  p="6px"
                  _hover={{ bg: "transparent", color: "white" }}
                  _active={{ bg: "transparent" }}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          {/* Log In Button */}
          <Button
            type="submit"
            isLoading={isLoading}
            loadingText="Logging in..."
            h={{ base: "56px", md: "60px" }}
            bg="#22C55E"
            color="white"
            fontSize="16px"
            fontWeight="700"
            borderRadius="100px"
            mt="12px"
            _hover={{ bg: "#16A34A" }}
            _active={{ bg: "#15803D" }}
            letterSpacing="0.2px"
            w="100%"
          >
            Log In
          </Button>
        </VStack>

        {/* Divider line */}
        <Flex align="center" mt={{ base: "32px", md: "40px" }} gap="0">
          <Box flex={1} h="1px" bg="#1E1E1E" />
          <Box flex={1} h="1px" bg="#1E1E1E" />
        </Flex>

        {/* Signup Redirect link */}
        <Flex justify="center" mt={{ base: "40px", md: "48px" }} gap="6px">
          <Text fontSize={{ base: "14px", md: "15px" }} color="rgba(255,255,255,0.55)">
            Don't have an account yet?
          </Text>
          <Link
            fontSize={{ base: "14px", md: "15px" }}
            color="#22C55E"
            fontWeight="600"
            textDecoration="none"
            _hover={{ textDecoration: "underline" }}
            onClick={() => window.location.href = '/en/auth'}
          >
            Sign Up
          </Link>
        </Flex>
      </Box>
    </Flex>
  );
}