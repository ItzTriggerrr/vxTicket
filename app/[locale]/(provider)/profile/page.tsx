"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Grid,
  Input,
  FormControl,
  FormLabel,
  Select,
  FormHelperText,
  Button,
  Badge,
  Switch,
  Alert,
  AlertIcon,
  useToast,
} from "@chakra-ui/react";

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
);

const KYCIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M8 12h.01M12 12h.01M16 12h.01"/>
    <path d="M7 7h10M7 17h6"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="20" x2="6" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="18" y1="20" x2="18" y2="14"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4" strokeWidth="1.8"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface FormInputProps {
  label: string;
  placeholder: string;
  type?: string;
  helperText?: string;
  isWarning?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
}

const FormInput = ({ label, placeholder, type = "text", helperText, isWarning = false, value, onChange, isReadOnly = false }: FormInputProps) => (
  <FormControl mb="16px" isReadOnly={isReadOnly}>
    <FormLabel fontSize="13px" color="#aaa" mb="6px">{label}</FormLabel>
    <Input 
      type={type} 
      placeholder={placeholder} 
      bg={isReadOnly ? "#161616" : "#121212"} 
      border="1px solid #2a2a2a" 
      color={isReadOnly ? "#777" : "white"} 
      fontSize="14px"
      borderRadius="8px"
      _hover={{ borderColor: isReadOnly ? "#2a2a2a" : "#444" }}
      _focus={{ borderColor: "#22c55e", boxShadow: "none" }}
      h="44px"
      value={value}
      onChange={onChange}
    />
    {helperText && (
      <FormHelperText fontSize="11px" color={isWarning ? "#f59e0b" : "#666"} mt="6px" lineHeight="1.4">
        {helperText}
      </FormHelperText>
    )}
  </FormControl>
);

const AccountRow = ({ icon, label, sublabel, onClick }: { icon: React.ReactNode; label: string; sublabel?: string; onClick?: () => void }) => (
  <Flex align="center" justify="space-between" py="16px" cursor="pointer" _hover={{ bg: "rgba(255,255,255,0.02)" }} px={{ md: "12px" }} borderRadius={{ md: "8px" }} transition="all 0.15s" onClick={onClick}>
    <Flex align="center" gap="16px">
      <Box color="#aaa" flexShrink={0}>{icon}</Box>
      <Box>
        <Text fontSize="15px" fontWeight="500" color="#fff" lineHeight="1.3">{label}</Text>
        {sublabel && <Text fontSize="13px" color="#888" mt="1px">{sublabel}</Text>}
      </Box>
    </Flex>
    <ChevronRight />
  </Flex>
);

export default function ProfileSettings() {
  const toast = useToast();
  
  const [isKycVerified, setIsKycVerified] = useState(false); 
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummaryView, setShowSummaryView] = useState(false); 

  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("alex@example.com");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState("GHANA_CARD");
  const [idNumber, setIdNumber] = useState("");
  const [bankProvider, setBankProvider] = useState("MTN");
  const [accountNumber, setAccountNumber] = useState("");
  const [subaccountCode, setSubaccountCode] = useState<string | null>(null);

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);

  // Load state parameters and fire rehydration queries immediately on mount
  useEffect(() => {
    const cachedProfile = localStorage.getItem("qs_user_profile");
    let realUserId = "";

    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.legal_name) setLegalName(parsed.legal_name);
        if (parsed.email_address) setEmail(parsed.email_address);
        realUserId = parsed.id || parsed.userId || "";
      } catch (e) {}
    }

    if (realUserId) {
      rehydrateProfileFromDatabase(realUserId);
    }

    async function rehydrateProfileFromDatabase(userId: string) {
      try {
        const res = await fetch(`/api/provider/profile?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.profile) {
            const p = data.profile;
            if (p.legalFullName) setLegalName(p.legalFullName);
            if (p.contactEmail) setEmail(p.contactEmail);
            if (p.contactPhone) setPhone(p.contactPhone);
            if (p.documentType) setDocumentType(p.documentType);
            if (p.documentNumber) setIdNumber(p.documentNumber);
            if (p.bankCode) setBankProvider(p.bankCode);
            if (p.payoutAccountId) setAccountNumber(p.payoutAccountId);
            if (p.paystackSubaccountCode) setSubaccountCode(p.paystackSubaccountCode);
            
            setIsKycVerified(data.isVerified);
          }
        }
      } catch (err) {
        console.error("Failed to rehydrate data parameters from server:", err);
      }
    }
  }, []);

  const validateFields = () => {
    if (!legalName || !phone || !idNumber || !accountNumber) {
      toast({
        title: "Required Fields Missing",
        description: "Please complete all fields within the parameters before checking verification.",
        status: "error",
        duration: 3000,
        position: "top",
      });
      return false;
    }

    if (documentType === "VOTERS_ID") {
      const votersRegex = /^\d{10}$/;
      if (!votersRegex.test(idNumber.trim())) {
        toast({
          title: "Invalid Voters ID Number",
          description: "Voters Identification passes must consist of exactly 10 numerical digits.",
          status: "error",
          duration: 4000,
          position: "top",
        });
        return false;
      }
    }

    if (documentType === "GHANA_CARD") {
      const cleanGhanaCard = idNumber.trim().toUpperCase();
      const ghanaCardRegex = /^GHA-\d{9}-\d$/;
      if (!ghanaCardRegex.test(cleanGhanaCard)) {
        toast({
          title: "Invalid Ghana Card Format",
          description: "Ghana Card must use uppercase characters and match the standard format sequence (e.g. GHA-123456789-1).",
          status: "error",
          duration: 4000,
          position: "top",
        });
        return false;
      }
    }

    return true;
  };

  const handleInitialVerifyClick = () => {
    if (validateFields()) {
      setShowSummaryView(true);
    }
  };

  const handlePushToSupabase = async () => {
    setIsSaving(true);
    try {
      const cachedProfileStr = localStorage.getItem("qs_user_profile");
      let realUserId = "";

      if (cachedProfileStr) {
        try {
          const parsed = JSON.parse(cachedProfileStr);
          realUserId = parsed.id || parsed.userId || "";
        } catch (err) {
          console.error("Failed to parse cached profile ID", err);
        }
      }

      if (!realUserId) {
        throw new Error("Active session mapping not found. Please log out and log in again to sync account credentials.");
      }

      const response = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: realUserId,
          legalName,
          email,
          phone,
          documentType,
          idNumber: idNumber.trim().toUpperCase(),
          bankProvider,
          accountNumber
        }),
      });

      const serverData = await response.json();

      if (!response.ok) {
        throw new Error(serverData.error || "Failed to commit record updates.");
      }

      setIsKycVerified(true);
      setShowSummaryView(false);
      setIsEditingPayout(false);
      
      if (serverData.paystackSubaccountCode) {
        setSubaccountCode(serverData.paystackSubaccountCode);
      }

      localStorage.setItem(
        "qs_user_profile",
        JSON.stringify({ id: realUserId, legal_name: legalName, email_address: email })
      );

      toast({
        title: "Verification Synchronized",
        description: "Profile records and Paystack split metrics are cleanly synchronized.",
        status: "success",
        duration: 4000,
        position: "top",
      });
    } catch (err: any) {
      console.error("Database sync fault:", err);
      toast({
        title: "Synchronization Refused",
        description: err.message || "Could not write verification fields to database cluster.",
        status: "error",
        duration: 5000,
        position: "top",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerReKycProcess = () => {
    setIsEditingPayout(true);
    toast({
      title: "Security Lock Warning",
      description: "Modifying layout payout options flags your record profile for compliance re-evaluation.",
      status: "warning",
      duration: 5000,
      position: "top-right",
    });
  };

  return (
    <Box minH="100vh" bg="#121212" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" pb="48px">
      <Box maxW={{ base: "100%", md: "600px", lg: "800px" }} mx="auto" pb="32px">
        
        {/* Header Section */}
        <Box px={{ base: "20px", md: "40px" }} pt={{ base: "32px", md: "52px" }} pb="28px">
          <Box 
            as="button" mb="24px" color="white" display="flex" alignItems="center" gap="8px" cursor="pointer" _hover={{ opacity: 0.7 }} 
            onClick={() => window.location.href = '/en/dashboard'} background="none" border="none"
          >
            <ArrowLeftIcon />
            <Text fontSize="14px" fontWeight="600">Back to Dashboard</Text>
          </Box>

          <Flex align="center" gap="16px">
            <Box w={{ base: "60px", md: "80px" }} h={{ base: "60px", md: "80px" }} borderRadius="full" bg="#2a2a2a" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
              <Text fontSize={{ base: "16px", md: "20px" }} fontWeight="600" color="#fff">AR</Text>
            </Box>
            <Box>
              <Text fontSize={{ base: "24px", md: "32px" }} fontWeight="700" color="#fff" letterSpacing="-0.3px">{legalName || "New Account"}</Text>
              <Text fontSize="14px" color="#888" mt="2px">
                {isKycVerified && !isEditingPayout ? "Verified Account Provider" : "Unverified Setup Account"}
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Content Wrapper */}
        <Box px={{ base: "0", md: "40px" }}>
          
          {isKycVerified && !isEditingPayout && (
            <Box mx={{ base: "20px", md: "0" }} mb="24px">
              <Alert status="info" bg="rgba(34, 197, 94, 0.05)" border="1px solid rgba(34, 197, 94, 0.2)" borderRadius="12px" color="white" alignItems="flex-start">
                <AlertIcon color="#22c55e" mt="2px" />
                <Box fontSize="13px" lineHeight="1.5">
                  <Text fontWeight="700" color="#22c55e" mb="2px">ANTI-FRAUD SETTLEMENT PROTECTION ACTIVE</Text>
                  To secure marketplace capital reserves from checkout takeovers, updating payout accounts triggers a verification process with details initially provided. Revenue balances will be released 48hrs successful verification.
                </Box>
              </Alert>
            </Box>
          )}

          {/* Account Overview */}
          <Box px={{ base: "20px", md: "0" }} pb="8px" mb={{ md: "24px" }}>
            <Text fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="#fff" mb="8px" px={{ md: "12px" }}>Account Overview</Text>
            <Box bg={{ md: "#1a1a1a" }} borderRadius={{ md: "16px" }} p={{ base: "0", md: "12px" }}>
              
              <Flex align="center" justify="space-between" py="16px" px={{ md: "12px" }} borderBottom="1px solid #2a2a2a">
                <Flex align="center" gap="16px">
                  <Box color="#aaa"><KYCIcon /></Box>
                  <Box>
                    <Text fontSize="15px" fontWeight="500" color="#fff" lineHeight="1.3">KYC Verification State</Text>
                    <Text fontSize="13px" color="#888" mt="1px">
                      {isKycVerified && !isEditingPayout ? `Verified via ${documentType === "GHANA_CARD" ? "Ghana Card" : "Voters ID"}` : "Awaiting Information Processing"}
                    </Text>
                  </Box>
                </Flex>
                <Badge 
                  bg={isKycVerified && !isEditingPayout ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)"} 
                  color={isKycVerified && !isEditingPayout ? "#4ade80" : "#f59e0b"} 
                  border={isKycVerified && !isEditingPayout ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(245, 158, 11, 0.4)"} 
                  borderRadius="full" px="10px" py="3px" textTransform="none" fontWeight="600"
                >
                  {isKycVerified && !isEditingPayout ? "Identity Fully Locked" : "Action Required"}
                </Badge>
              </Flex>

              <AccountRow 
                icon={<BarChartIcon />} 
                label="Published Events and Draft"
                onClick={() => window.location.href = '/en/events/my-listings'}
              />

            </Box>
          </Box>

          <Box h="8px" bg="#1a1a1a" my="20px" display={{ md: "none" }} />

          {/* MAIN UNIFIED LEDGER CONTAINER */}
          <Box px={{ base: "20px", md: "0" }} pb="8px" mb={{ md: "24px" }}>
            <Flex align="center" justify="space-between" mb="12px" px={{ md: "12px" }}>
              <Text fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="#fff">Legal Identification Ledger</Text>
              {isKycVerified && !isEditingPayout && (
                <Button size="xs" bg="rgba(239, 68, 68, 0.1)" color="#ef4444" border="1px solid rgba(239, 68, 68, 0.2)" _hover={{ bg: "rgba(239, 68, 68, 0.2)" }} onClick={triggerReKycProcess}>
                  Modify Settlement Account
                </Button>
              )}
            </Flex>

            <Box bg={{ md: "#1a1a1a" }} borderRadius={{ md: "16px" }} p={{ base: "0", md: "20px" }}>
              
              {showSummaryView ? (
                <VStack spacing="20px" align="stretch" pb="8px">
                  <Alert status="warning" bg="rgba(245, 158, 11, 0.05)" border="1px solid rgba(245, 158, 11, 0.3)" borderRadius="8px" color="white">
                    <AlertIcon color="#f59e0b" />
                    <Box fontSize="12px" fontWeight="600">Please review your verification manifest summary carefully before final execution.</Box>
                  </Alert>

                  <Box bg="#121212" borderRadius="12px" border="1px solid #2a2a2a" p="16px">
                    <Text fontSize="13px" fontWeight="700" color="#22c55e" mb="12px" letterSpacing="0.5px">CONFIRMATION MANIFEST REVIEW</Text>
                    <Grid templateColumns="1fr 1fr" gap="12px" fontSize="13px" color="#fff">
                      <Text color="#666">Full Legal Name:</Text>
                      <Text fontWeight="600" textAlign="right">{legalName}</Text>
                      
                      <Text color="#666">Email Target:</Text>
                      <Text fontWeight="600" textAlign="right">{email}</Text>
                      
                      <Text color="#666">Contact Phone:</Text>
                      <Text fontWeight="600" textAlign="right">{phone}</Text>
                      
                      <Text color="#666">Document Tracked:</Text>
                      <Text fontWeight="600" textAlign="right">{documentType === "GHANA_CARD" ? "Ghana Card (NIA)" : "Voters ID Pass"}</Text>
                      
                      <Text color="#666">ID Serial Reference:</Text>
                      <Text fontWeight="600" textAlign="right" color="#22c55e">{idNumber.trim().toUpperCase()}</Text>

                      <Text color="#666">Payout Destination:</Text>
                      <Text fontWeight="600" textAlign="right" textTransform="uppercase">{bankProvider} network</Text>

                      <Text color="#666">Payout Account Number:</Text>
                      <Text fontWeight="600" textAlign="right" color="#22c55e">{accountNumber}</Text>
                    </Grid>
                  </Box>

                  <Text fontSize="11px" color="#666" textAlign="center" px="12px">
                    By confirming, you certify that this configuration matches your official documentation. Changes are subject to the terms.
                  </Text>

                  <Flex gap="12px" mt="4px">
                    <Button flex={1} bg="#2a2a2a" color="white" border="1px solid #333" h="44px" borderRadius="8px" fontSize="14px" fontWeight="600" isDisabled={isSaving} onClick={() => setShowSummaryView(false)}>
                      Edit Fields
                    </Button>
                    <Button flex={1} bg="#22c55e" color="black" h="44px" borderRadius="8px" fontSize="14px" fontWeight="700" _hover={{ bg: "#16a34a" }} isLoading={isSaving} loadingText="Verifying..." onClick={handlePushToSupabase}>
                      Confirm & Submit
                    </Button>
                  </Flex>
                </VStack>
              ) : (
                <VStack spacing="0" align="stretch">
                  
                  <FormInput 
                    label="Legal Full Name" 
                    placeholder="Enter official registration name" 
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    isReadOnly={isKycVerified && !isEditingPayout}
                    helperText={isKycVerified && !isEditingPayout ? "🔒 Locked Profile: Connected directly to Supabase production tables." : "⚠️ Critically Important: Must match your official national card registry exactly."}
                  />
                  
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px">
                    <FormInput label="Email Address" type="email" placeholder="alex@example.com" value={email} onChange={(e) => setEmail(e.target.value)} isReadOnly={isKycVerified && !isEditingPayout} />
                    <FormInput label="Phone Number" type="tel" placeholder="+233 ## ### ####" value={phone} onChange={(e) => setPhone(e.target.value)} isReadOnly={isKycVerified && !isEditingPayout} />
                  </Grid>

                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px" mt="4px" mb="24px">
                    <FormControl isRequired isDisabled={isKycVerified && !isEditingPayout}>
                      <FormLabel fontSize="13px" color="#aaa" mb="6px">Identification Document Type</FormLabel>
                      <Select 
                        value={documentType}
                        onChange={(e) => {
                          setDocumentType(e.target.value);
                          setIdNumber(""); 
                        }}
                        bg="#121212" border="1px solid #2a2a2a" color="white" fontSize="14px" borderRadius="8px" h="44px" _hover={{ borderColor: "#444" }} _focus={{ borderColor: "#22c55e", boxShadow: "none" }}
                      >
                        <option value="GHANA_CARD" style={{ background: "#121212" }}>Ghana Card (NIA)</option>
                        <option value="VOTERS_ID" style={{ background: "#121212" }}>Voters ID Card</option>
                      </Select>
                    </FormControl>

                    <FormInput 
                      label="Document Reference Number" 
                      placeholder={documentType === "GHANA_CARD" ? "e.g. GHA-123456789-1" : "e.g. 1234567890"} 
                      value={idNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIdNumber(documentType === "GHANA_CARD" ? val.toUpperCase() : val);
                      }}
                      isReadOnly={isKycVerified && !isEditingPayout}
                    />
                  </Grid>

                  <Box borderTop="1px solid #2a2a2a" pt="24px" mb="16px">
                    <Text fontSize="15px" fontWeight="700" color="#fff" mb="16px">Payout Account Destination</Text>
                    
                    {isEditingPayout && (
                      <Box mb="16px">
                        <Alert status="error" bg="rgba(239, 68, 68, 0.08)" border="1px solid #ef4444" borderRadius="8px" color="white">
                          <AlertIcon color="#ef4444" />
                          <Box fontSize="12px" lineHeight="1.4">
                            <Text fontWeight="700" color="#ef4444" mb="1px">MANDATORY PROFILE RE-KYC DETECTED</Text>
                            Altering destination coordinates suspends auto-settlements until safety agents re-verify parameters inside your Supabase profile.
                          </Box>
                        </Alert>
                      </Box>
                    )}

                    <FormControl mb="16px" isDisabled={isKycVerified && !isEditingPayout}>
                      <FormLabel fontSize="13px" color="#aaa" mb="6px">Settlement Provider / Bank Channel</FormLabel>
                      <Select 
                        value={bankProvider} onChange={(e) => setBankProvider(e.target.value)}
                        bg="#121212" border="1px solid #2a2a2a" color="white" fontSize="14px" borderRadius="8px" h="44px" _hover={{ borderColor: "#444" }} _focus={{ borderColor: "#22c55e", boxShadow: "none" }}
                      >
                        <option value="MTN" style={{ background: "#121212" }}>MTN Mobile Money</option>
                        <option value="VOD" style={{ background: "#121212" }}>Telecel Cash</option>
                        <option value="ATL" style={{ background: "#121212" }}>AT Money</option>
                        <option value="GCB" style={{ background: "#121212" }}>GCB Bank</option>
                        <option value="ECOBANK" style={{ background: "#121212" }}>Ecobank</option>
                      </Select>
                    </FormControl>

                    <FormInput 
                      label="Account Number / Mobile Money Number" type="text" placeholder="#### #### ####" 
                      value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                      isReadOnly={isKycVerified && !isEditingPayout}
                      helperText="The name of the account holder must match the verified legal Details as provided above."
                    />
                  </Box>

                  {(!isKycVerified || isEditingPayout) && (
                    <Button 
                      bg="#22c55e" color="black" w="100%" h="44px" fontSize="14px" fontWeight="600" borderRadius="8px" mt="16px" _hover={{ bg: "#16a34a" }}
                      onClick={isEditingPayout ? handlePushToSupabase : handleInitialVerifyClick}
                    >
                      {isEditingPayout ? "Save & Apply Modifications" : "Submit for Verification"}
                    </Button>
                  )}

                  {isKycVerified && !isEditingPayout && (
                    <Box mt="14px" p="12px" bg="#121212" borderRadius="8px" border="1px solid #2a2a2a">
                      <Flex align="center" gap="8px">
                        <Box w="6px" h="6px" bg="#22c55e" borderRadius="full" />
                        <VStack align="start" spacing="2px">
                          <Text fontSize="12px" fontWeight="600" color="#aaa">
                            Active System Record: Profile verified safely.
                          </Text>
                          {subaccountCode && (
                            <Text fontSize="11px" fontFamily="monospace" color="#22c55e">
                              Paystack Subaccount: {subaccountCode}
                            </Text>
                          )}
                        </VStack>
                      </Flex>
                    </Box>
                  )}

                </VStack>
              )}

            </Box>
          </Box>

          <Box h="8px" bg="#1a1a1a" my="20px" display={{ md: "none" }} />

          {/* Hardening Matrix */}
          <Box px={{ base: "20px", md: "0" }} pb="8px" mb={{ md: "24px" }}>
            <Text fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="#fff" mb="12px" px={{ md: "12px" }}>Advanced Hardening Security</Text>
            <Box bg={{ md: "#1a1a1a" }} borderRadius={{ md: "16px" }} p="20px">
              <VStack spacing="20px" align="stretch">
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontSize="14px" fontWeight="600" color="white">Two-Factor Withdrawal Token (2FA)</Text>
                    <Text fontSize="12px" color="#666" mt="2px">KYC and OTP will be conducted to ensure it is you changing payout destination.</Text>
                  </Box>
                  <Switch colorScheme="green" isChecked={isTwoFactorEnabled} onChange={(e) => setIsTwoFactorEnabled(e.target.checked)} />
                </Flex>
              </VStack>
            </Box>
          </Box>

          {/* Preferences & Log Out */}
          <Box px={{ base: "20px", md: "0" }} pb="24px">
            <Box bg={{ md: "#1a1a1a" }} borderRadius={{ md: "16px" }} p="12px">
              
              {/* ─── 🚀 RELOCATED COST TRANSPARENCY BANNER MATRIX ─── */}
              <Box mb="16px" mt="4px" px={{ md: "12px" }}>
                <Alert status="info" bg="rgba(34, 197, 94, 0.04)" border="1px solid rgba(34, 197, 94, 0.15)" borderRadius="12px" color="#9ca3af" alignItems="flex-start">
                  <AlertIcon color="#22c55e" mt="2px" />
                  <Box fontSize="12px" lineHeight="1.4">
                    <Text as="span" fontWeight="700" color="white" mr="4px">vxTicket DISCLOSURE COMPLIANCE:</Text>
                    A standard 7% marketplace service fee is automatically deducted from each ticket tier sale prior to final settlement payout dispatches into your payout account.
                  </Box>
                </Alert>
              </Box>

              <Flex align="center" justify="space-between" py="16px" px={{ md: "12px" }} borderBottom="1px solid #2a2a2a">
                <Box>
                  <Text fontSize="15px" fontWeight="500" color="#fff">System Language</Text>
                  <Text fontSize="13px" color="#666" mt="1px">English (US)</Text>
                </Box>
                <Badge variant="outline" colorScheme="gray" textTransform="none">Default</Badge>
              </Flex>

              <AccountRow 
                icon={<ShieldIcon />} 
                label="Privacy Ledger Details" 
                onClick={() => window.location.href = '/en/legal/terms-of-use'}
              />
              
              <Flex align="center" justify="space-between" py="16px" cursor="pointer" _hover={{ bg: "rgba(255,255,255,0.02)" }} px={{ md: "12px" }} borderRadius={{ md: "8px" }} transition="all 0.15s" color="#ef4444" onClick={() => window.location.href = '/en/login'}>
                <Flex align="center" gap="16px">
                  <Box><LogOutIcon /></Box>
                  <Text fontSize="15px" fontWeight="500">Log Out Session</Text>
                </Flex>
              </Flex>
            </Box>
          </Box>

        </Box>

        {/* Footer */}
        <Box textAlign={{ base: "center", md: "left" }} px={{ md: "52px" }} pt="20px">
          <Text fontSize="12px" color="#555">vxTicket Network v1.0.3</Text>
        </Box>

      </Box>
    </Box>
  );
}