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
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { useState } from "react";

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

export default function AuthPage() {
  const toast = useToast();

  // Input Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mechanics States
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ─── 🚀 HIGH-END SAAS DRAWER SYSTEM OVERLAY STATES ────────────────────────
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [legalTitle, setLegalTitle] = useState("");
  const [legalContent, setLegalContent] = useState("");
  const [isLegalLoading, setIsLegalLoading] = useState(false);

  // 🚀 Updated drawer handler linked directly to Supabase via /api/legal/[slug]
  const handleOpenLegalDrawer = async (type: "TERMS" | "PRIVACY") => {
    setLegalTitle(type === "TERMS" ? "Terms of Service" : "Privacy Policy");
    setIsDrawerOpen(true);
    setIsLegalLoading(true);
    setLegalContent("");

    // Exact slugs matching your Supabase LegalDocument table
    const slug = type === "TERMS" ? "terms-of-use" : "privacy-policy";

    try {
      const response = await fetch(`/api/legal/${slug}`);
      if (!response.ok) throw new Error("Fallback required.");
      const data = await response.json();
      
      // Pulls content column directly from Supabase
      setLegalContent(data.content || "Documentation currently empty.");
    } catch (err) {
      setLegalContent(
        type === "TERMS" 
          ? "Welcome to vxTicket. By creating an account or hosting entry listings, you express absolute consent to our platform processing terms, standard ticket verification frameworks, and automatic payout structures.\n\nAll ticketing allocations are monitored to ensure secure operational check-ins. Unauthorized manipulation of parameters or platform circumventing tricks will result in immediate termination of provider workspace privileges."
          : "Your transactional security is our primary focus. vxTicket securely handles identity assertions, verification signatures, and profile fields via database rows protected under access token rules.\n\nWe preserve your registration email parameter to manage transactional event listings distributions and maintain live check-in logs inside the validation scanner terminal terminal. Hashed credentials are fully encrypted."
      );
    } finally {
      setIsLegalLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !email || !password) {
      setErrorMessage("Please fill out all fields before signing up.");
      return;
    }

    if (!agreed) {
      setErrorMessage("You must accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email: email,
          password: password,
          role: "PROVIDER", 
          // ─── 🚀 PRIVACY LEDGER METADATA ENGINE ─────────────────────────────
          agreedToTerms: true,
          agreedAt: new Date().toISOString(), // Generates an unforgeable compliance timestamp
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setErrorMessage(`Server configuration anomaly (Status ${response.status}). Check that your API folder structure is exactly at /api/auth/register.`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "An error occurred during account creation.");
      } else {
        toast({
          title: "Account created successfully.",
          description: "Welcome to vxTicket! Redirecting to your command center...",
          status: "success",
          duration: 4000,
          isClosable: true,
          position: "top",
        });

        // Save session credentials locally to facilitate pipeline rehydration
        if (data.user) {
          localStorage.setItem("qs_user_profile", JSON.stringify(data.user));
        }

        setFullName("");
        setEmail("");
        setPassword("");
        setAgreed(false);

        setTimeout(() => {
          window.location.href = "/en/dashboard";
        }, 1500);
      }
    } catch (err) {
      console.error("Frontend registration handling exception:", err);
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
      <Box as="form" onSubmit={handleSignUp} w="100%" maxW={{ base: "100%", md: "460px" }} position="relative">
        
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
            Create Account
          </Text>
          <Text fontSize={{ base: "14px", md: "16px" }} color="rgba(255,255,255,0.55)" fontWeight="500">
            Join vxTicket to create or host amazing events
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
          
          {/* Full Name */}
          <FormControl isRequired>
            <FormLabel color="white" fontSize="14px" fontWeight="600" mb="8px">
              Full Name
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="52px" pl="4px">
                <Box color="rgba(255,255,255,0.45)">
                  <UserIcon />
                </Box>
              </InputLeftElement>
              <Input
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
            <FormLabel color="white" fontSize="14px" fontWeight="600" mb="8px">
              Password
            </FormLabel>
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

          {/* Terms checkbox */}
          <Flex align="center" gap="12px" mt="4px">
            <Box
              w="26px"
              h="26px"
              borderRadius="50%"
              bg={agreed ? "#22C55E" : "transparent"}
              border={agreed ? "none" : "2px solid #3A3A3A"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              flexShrink={0}
              onClick={() => setAgreed(!agreed)}
              transition="all 0.15s"
            >
              {agreed && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Box>
            <Text fontSize={{ base: "13px", md: "14px" }} color="rgba(255,255,255,0.65)" fontWeight="400">
              I agree to the{" "}
              <Text as="span" cursor="pointer" color="#22C55E" fontWeight="700" _hover={{ textDecoration: "underline" }} onClick={() => handleOpenLegalDrawer("TERMS")}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text as="span" cursor="pointer" color="#22C55E" fontWeight="700" _hover={{ textDecoration: "underline" }} onClick={() => handleOpenLegalDrawer("PRIVACY")}>
                Privacy Policy
              </Text>
            </Text>
          </Flex>

          {/* Create Account button */}
          {agreed && (
            <Button
              type="submit"
              isLoading={isLoading}
              loadingText="Creating Account..."
              h={{ base: "56px", md: "60px" }}
              bg="#22C55E"
              color="white"
              fontSize="16px"
              fontWeight="700"
              borderRadius="100px"
              mt="8px"
              _hover={{ bg: "#16A34A" }}
              _active={{ bg: "#15803D" }}
              letterSpacing="0.2px"
              w="100%"
            >
              Create Account
            </Button>
          )}
        </VStack>

        {/* Divider line */}
        <Flex align="center" mt={{ base: "32px", md: "40px" }} gap="0">
          <Box flex={1} h="1px" bg="#1E1E1E" />
          <Box flex={1} h="1px" bg="#1E1E1E" />
        </Flex>

        {/* Login link */}
        <Flex justify="center" mt={{ base: "40px", md: "48px" }} gap="6px">
          <Text fontSize={{ base: "14px", md: "15px" }} color="rgba(255,255,255,0.55)">
            Already have an account?
          </Text>
          <Link
            fontSize={{ base: "14px", md: "15px" }}
            color="#22C55E"
            fontWeight="600"
            textDecoration="none"
            _hover={{ textDecoration: "underline" }}
            onClick={() => window.location.href = '/en/login'}
          >
            Log In
          </Link>
        </Flex>
      </Box>

      {/* ─── 🚀 HIGH-END SAAS SIDE-SLIDING VIEWPANEL DRAWER SHEET ───────────────── */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={() => setIsDrawerOpen(false)} size={{ base: "full", md: "md" }}>
        <DrawerOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(8px)" />
        <DrawerContent bg="#141414" borderLeft="1.5px solid #2A2A2A" color="white" p={{ base: "8px", md: "20px" }}>
          <DrawerCloseButton color="rgba(255,255,255,0.4)" top="24px" right="24px" size="md" />
          <DrawerHeader fontSize="22px" fontWeight="800" borderBottom="1px solid #222" pb="20px" mt="10px" letterSpacing="-0.3px">
            {legalTitle}
          </DrawerHeader>
          <DrawerBody py="28px" px={{ base: "16px", md: "24px" }}>
            {isLegalLoading ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner color="#22C55E" size="lg" thickness="3.5px" speed="0.75s" />
              </Flex>
            ) : (
              <Text fontSize="14px" color="#9CA3AF" lineHeight="1.7" whiteSpace="pre-wrap" fontWeight="500">
                {legalContent}
              </Text>
            )}
            <Button w="100%" h="52px" bg="#22C55E" color="white" borderRadius="50px" mt="36px" fontSize="15px" fontWeight="800" _hover={{ bg: "#16A34A" }} _active={{ bg: "#15803D" }} onClick={() => setIsDrawerOpen(false)}>
              Acknowledge & Return
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

    </Flex>
  );
}