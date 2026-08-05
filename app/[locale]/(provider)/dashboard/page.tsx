'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Button, 
  Flex,
  Text,
  Heading,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Spinner,
  Divider,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'

// ─── SVG ICONS ──────────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#22c55e" />
    <path d="M8 14l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WaitlistIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="2" width="18" height="24" rx="3" stroke="#f97316" strokeWidth="2" fill="none"/>
    <path d="M9 9h8M9 14h8M9 19h5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="24" r="6" fill="#161616"/>
    <path d="M24 21v3l1.5 1.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TicketIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M3 11a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V11z" stroke="#22c55e" strokeWidth="2" fill="none"/>
    <line x1="12" y1="9" x2="12" y2="23" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2.5 2.5"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const DefaultUserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export default function DashboardPage() {
  const toast = useToast();
  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentLocale, setCurrentLocale] = useState("en");

  const [showTooltip, setShowTooltip] = useState(true);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isTierBreakdownOpen, setIsTierBreakdownOpen] = useState(false); 
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Manual code entry & Mode switching state
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [checkInCount, setCheckInCount] = useState(1);

  // Compliance state tracking definition
  const [isKycVerified, setIsKycVerified] = useState<boolean>(true);

  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState("");
  const [attendeeDetails, setAttendeeDetails] = useState<any>(null);
  
  const scannerInstanceRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let resolvedProviderId = "";

    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split('/');
      if (pathSegments[1] && pathSegments[1].length === 2) {
        setCurrentLocale(pathSegments[1]);
      }

      const cachedProfile = localStorage.getItem("qs_user_profile");
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          if (profile.avatarUrl || profile.avatar) setAvatarUrl(profile.avatarUrl || profile.avatar);
          if (profile.id) resolvedProviderId = profile.id;
        } catch (err) {
          console.error("Local profile session parsing anomaly:", err);
        }
      }
    }

    async function syncDashboardDataset(providerId: string) {
      if (!providerId) {
        setIsLoading(false);
        return; 
      }
      
      setIsLoading(true);
      try {
        const kycRes = await fetch(`/api/provider/profile?userId=${providerId}`);
        if (kycRes.ok) {
          const kycData = await kycRes.json();
          if (kycData && typeof kycData.isVerified !== "undefined") {
            setIsKycVerified(kycData.isVerified);
          }
        }

        const response = await fetch(`/api/provider/dashboard?providerId=${providerId}`, {
          cache: 'no-store' 
        });
        if (!response.ok) throw new Error("Could not access live datastream.");
        
        const data = await response.json();
        const allEvents = data.events || [];
        setEvents(allEvents);

        // 🚀 DYNAMIC ACTIVE EVENT SELECTOR (Reads from localStorage selection)
        if (typeof window !== "undefined") {
          const cachedActiveId = localStorage.getItem("qs_active_event_id");
          if (cachedActiveId && allEvents.length > 0) {
            const matchedIndex = allEvents.findIndex((e: any) => e.id === cachedActiveId);
            if (matchedIndex !== -1) {
              setCurrentEventIndex(matchedIndex);
            }
          }
        }
      } catch (err: any) {
        toast({
          title: "Connection Pipeline Anomaly",
          description: "Displaying temporary offline information due to network bounds.",
          status: "error",
          duration: 4000,
          position: "top",
        });
      } finally {
        setIsLoading(false);
      }
    }

    syncDashboardDataset(resolvedProviderId);

    const timer = setTimeout(() => { setShowTooltip(false); }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const hasActiveEntries = events.length > 0;
  const activeEvent = hasActiveEntries ? events[currentEventIndex] : null;
  
  const totalTicketsSold = activeEvent?.tiers ? activeEvent.tiers.reduce((acc: number, tier: any) => acc + (tier.sold || 0), 0) : 0;
  const totalCheckedIn = activeEvent?.tiers ? activeEvent.tiers.reduce((acc: number, tier: any) => acc + (tier.checkedIn || 0), 0) : 0;
  
  const grossRevenue = activeEvent?.tiers ? activeEvent.tiers.reduce((acc: number, tier: any) => acc + ((tier.price || 0) * (tier.sold || 0)), 0) : 0;
  const netEarningsPayout = grossRevenue * 0.93; 
  
  const totalWaitlist = totalTicketsSold - totalCheckedIn;

  // Handle Event Switching & Persist Selection
  const handleSelectEvent = (index: number, eventId: string) => {
    setCurrentEventIndex(index);
    if (typeof window !== "undefined") {
      localStorage.setItem("qs_active_event_id", eventId);
    }
    setIsSwitchModalOpen(false);
  };

  // Camera initialization logic
  useEffect(() => {
    let isMounted = true;
    let checkDomInterval: NodeJS.Timeout;

    if (!isScannerOpen || isManualMode) {
      cleanupScanner();
      return;
    }

    import("html5-qrcode").then((module) => {
      checkDomInterval = setInterval(async () => {
        const targetElement = document.getElementById("reader");
        
        if (!isMounted || !targetElement) return;

        if (scannerInstanceRef.current) {
          clearInterval(checkDomInterval);
          return;
        }

        clearInterval(checkDomInterval);

        try {
          const html5QrCode = new module.Html5Qrcode("reader");
          scannerInstanceRef.current = html5QrCode;

          if (!isMounted) {
            await html5QrCode.clear();
            scannerInstanceRef.current = null;
            return;
          }

          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 10, 
              qrbox: (w, h) => { 
                const size = Math.min(w, h) * 0.68; 
                return { width: size, height: size }; 
              } 
            },
            (decodedText) => { 
              handleTicketVerification(decodedText); 
            },
            () => {} 
          );
        } catch (err) {
          console.warn("HTML5 QR Code initialization prevented safely:", err);
          scannerInstanceRef.current = null;
        }
      }, 100);
    });

    return () => {
      isMounted = false;
      if (checkDomInterval) clearInterval(checkDomInterval);
      cleanupScanner();
    };
  }, [isScannerOpen, isManualMode, currentEventIndex]);

  const cleanupScanner = () => {
    isProcessingRef.current = false;
    if (scannerInstanceRef.current) {
      const instance = scannerInstanceRef.current;
      scannerInstanceRef.current = null; 
      if (instance.isScanning) {
        instance.stop().catch((err: any) => console.warn("Failed to stop scanner smoothly:", err));
      }
    }
  };

  const handleTicketVerification = async (ticketCode: string) => {
    const code = ticketCode.trim();
    if (!code) {
      toast({
        title: "Validation code required",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanStatus('loading');

    try {
      const response = await fetch("/api/scanner/check-in", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          manualCode: code, 
          checkInCount: Number(checkInCount),
          eventId: activeEvent?.id,
        }) 
      });
      const data = await response.json();
      if (!response.ok || data.status !== "SUCCESS") { 
        setScanStatus('error'); 
        setScanMessage(data.message || data.error || "Denied Entry"); 
      }
      else { 
        setScanStatus('success'); 
        setScanMessage(data.message || "Pass Verified Successfully!");
        setAttendeeDetails({
          name: data.details?.attendee || "Guest",
          tierName: data.details?.tier || "Standard",
          checkedInNow: data.details?.checkedInNow || 1,
          totalCheckedIn: data.details?.totalCheckedIn,
          totalQuantity: data.details?.totalQuantity,
        }); 
        setManualCode("");
      }
    } catch (err) { 
      setScanStatus('error'); 
      setScanMessage("Network/Server delay occurred."); 
    }
  };

  const handleResumeScanning = () => {
    isProcessingRef.current = false;
    setScanStatus('idle');
    setAttendeeDetails(null);
    setScanMessage("");
  };

  const handleCopyBouncerLink = () => {
    if (!activeEvent?.id) return;
    const bouncerGateUrl = `${window.location.origin}/${currentLocale}/scan/${activeEvent.id}`;
    navigator.clipboard.writeText(bouncerGateUrl);
    toast({
      title: "Gate Link Copied!",
      description: "Send this secure link to your bouncers. No login required.",
      status: "success",
      duration: 3000,
      position: "top-right",
    });
  };

  if (isLoading) {
    return (
      <Flex minH="100vh" bg="#0d0d0d" align="center" justify="center">
        <VStack spacing="16px">
          <Spinner size="xl" thickness="4px" speed="0.85s" color="#22c55e" />
          <Text fontSize="14px" fontWeight="600" color="#6b7280" letterSpacing="0.5px">SYNCHRONIZING WITH DATABASE...</Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="#0d0d0d" display="flex" justifyContent="center">
      <Box w="100%" maxW={{ base: "100%", md: "container.xl" }} bg="#0d0d0d" minH="100vh" pb="48px">

        <Flex px={{ base: "16px", md: "40px" }} pt={{ base: "40px", md: "64px" }} pb="8px" justify="space-between" align="center">
          <Box>
            <Heading as="h1" fontSize={{ base: "24px", md: "36px" }} fontWeight="700" color="white" letterSpacing="-0.5px">
              Vendor Dashboard
            </Heading>
            <Text fontSize={{ base: "13px", md: "16px" }} color="#9ca3af" mt="4px">
              {activeEvent ? `Performance metrics for ${activeEvent.title}` : "Real-time event performance metrics."}
            </Text>
          </Box>
          
          <Box position="relative">
            <Box w="46px" h="46px" borderRadius="full" border="2.5px solid #22c55e" overflow="hidden" cursor="pointer" onClick={() => window.location.href = `/${currentLocale}/profile`} display="flex" alignItems="center" justifyContent="center" bg="#1A1A1A">
              {avatarUrl ? (
                <Box w="full" h="full" style={{ backgroundImage: `url('${avatarUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              ) : (
                <DefaultUserIcon />
              )}
            </Box>
            {showTooltip && (
              <Box position="absolute" top="115%" right="0" bg="#22c55e" color="black" p="12px" borderRadius="12px" w="220px" zIndex={10}>
                <Box position="absolute" top="-5px" right="20px" w="12px" h="12px" bg="#22c55e" transform="rotate(45deg)" />
                <Flex justify="space-between" align="flex-start">
                  <Text fontSize="13px" fontWeight="700">Click to view profile</Text>
                  <Box as="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowTooltip(false); }} background="none" border="none" cursor="pointer"><CloseIcon /></Box>
                </Flex>
              </Box>
            )}
          </Box>
        </Flex>

        {/* COMPLIANCE BANNER */}
        {!isKycVerified && (
          <Box px={{ base: "16px", md: "40px" }} mt="20px">
            <Alert status="warning" bg="rgba(245, 158, 11, 0.08)" border="1px solid #f59e0b" borderRadius="16px" color="white" p="20px">
              <AlertIcon color="#f59e0b" />
              <Box flex="1">
                <AlertTitle fontSize="15px" fontWeight="700" mb="4px">KYC Verification Required</AlertTitle>
                <AlertDescription fontSize="13px" color="#D1D5DB" lineHeight="1.5">
                  Complete KYC verification to publish events. A 7% service fee is automatically deducted per ticket sold.
                </AlertDescription>
              </Box>
              <Button
                ml={{ base: "0", md: "16px" }}
                mt={{ base: "12px", md: "0" }}
                size="sm"
                bg="#f59e0b"
                color="black"
                fontWeight="700"
                _hover={{ bg: "#d97706" }}
                onClick={() => window.location.href = `/${currentLocale}/profile`}
              >
                Complete Setup
              </Button>
            </Alert>
          </Box>
        )}

        {!hasActiveEntries ? (
          <Flex direction="column" align="center" justify="center" p={{ base: "32px 16px", md: "60px" }} mx={{ base: "16px", md: "40px" }} mt="40px" bg="#161616" border="1px solid #2A2A2A" borderRadius="24px">
            <TicketIcon />
            <Text fontWeight="700" fontSize="18px" color="white" mt="16px" textAlign="center">No event Discovered</Text>
            <Text fontSize="14px" color="#6b7280" mt="4px" mb="24px" textAlign="center" maxW="380px">Create your event and start making sales.</Text>
            <Button isDisabled={!isKycVerified} w={{ base: "100%", sm: "auto" }} bg="#22c55e" color="white" h="52px" px="36px" borderRadius="50px" _hover={{ bg: "#16a34a" }} onClick={() => window.location.href = `/${currentLocale}/events/create`}>Create Your First Event</Button>
          </Flex>
        ) : (
          <>
            <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={{ base: "10px", md: "12px" }} px={{ base: "16px", md: "40px" }} mt="24px">
              <GridItem>
                <Box bg="#161616" borderRadius="16px" border="2px solid #22c55e" p={{ base: "12px", md: "16px" }} h="100%">
                  <Flex justify="space-between" align="baseline" mb="8px">
                    <Text fontSize="11px" color="#9ca3af" fontWeight="500">Net Take-Home</Text>
                    <Badge colorScheme="green" fontSize="8px" px="4px" borderRadius="4px">NET GH₵</Badge>
                  </Flex>
                  <Heading as="h2" fontSize={{ base: "20px", md: "32px" }} fontWeight="700" color="white">
                    GH₵{netEarningsPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Heading>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box bg="#161616" borderRadius="16px" border="2px solid #7c3aed" p={{ base: "12px", md: "16px" }} h="100%" cursor="pointer" _hover={{ bg: "#1F1F1F" }} onClick={() => setIsTierBreakdownOpen(true)}>
                  <Flex justify="space-between" align="baseline" mb="8px">
                    <Text fontSize="11px" color="#9ca3af" fontWeight="500">Tickets Sold</Text>
                    <Text fontSize="8px" fontWeight="700" color="#7c3aed">VIEW</Text>
                  </Flex>
                  <Heading as="h2" fontSize={{ base: "20px", md: "32px" }} fontWeight="700" color="white">
                    {totalTicketsSold.toLocaleString()}
                  </Heading>
                </Box>
              </GridItem>

              <GridItem>
                <Box bg="#1a1a1a" borderRadius="16px" p={{ base: "12px", md: "14px" }} h="100%" display="flex" flexDirection="column" justifyContent="space-between">
                  <Text fontSize="11px" color="#6b7280" mb="8px">Checked in</Text>
                  <Flex align="center" gap="6px">
                    <CheckCircleIcon />
                    <Heading as="h3" fontSize={{ base: "18px", md: "24px" }} fontWeight="700" color="white">{totalCheckedIn}</Heading>
                  </Flex>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box bg="#1a1a1a" borderRadius="16px" p={{ base: "12px", md: "14px" }} h="100%" display="flex" flexDirection="column" justifyContent="space-between">
                  <Text fontSize="11px" color="#6b7280" mb="8px">Waitlist</Text>
                  <Flex align="center" gap="6px">
                    <WaitlistIcon />
                    <Heading as="h3" fontSize={{ base: "18px", md: "24px" }} fontWeight="700" color="white">{totalWaitlist}</Heading>
                  </Flex>
                </Box>
              </GridItem>
            </Grid>

            <Flex direction={{ base: "column", lg: "row" }} px={{ base: "16px", md: "40px" }} mt="40px" gap="32px">
              <Box flex="1">
                <Heading as="h2" fontSize="20px" fontWeight="700" color="white" mb="14px">Active Event</Heading>
                <Box borderRadius="16px" overflow="hidden" w="100%" maxW={{ base: "100%", lg: "400px" }} mb="12px" bg="#1A1A1A" h="180px" display="flex" alignItems="center" justifyContent="center">
                  {activeEvent?.coverImage ? (
                    <img src={activeEvent.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                  ) : (
                    <TicketIcon />
                  )}
                </Box>
                <Heading as="h3" fontSize="17px" fontWeight="700" color="white" mb="3px">{activeEvent?.title}</Heading>
                <Text fontSize="14px" color="#6b7280">{activeEvent?.venue}</Text>
              </Box>

              <Box flex="1">
                <Heading as="h2" fontSize="20px" fontWeight="700" color="white" mb="14px">Quick Actions</Heading>
                <Flex direction="column" gap="16px">
                  <Flex direction={{ base: "column", md: "row" }} bg="#121212" p="16px" borderRadius="16px" border="1px solid #2A2A2A" justify="space-between" align={{ base: "stretch", md: "center" }} gap="16px" w="100%">
                    <VStack align="start" spacing="4px">
                      <Text fontSize="14px" fontWeight="700" color="white">Gate Attendant Mode</Text>
                      <Text fontSize="12px" color="gray.500">Verify codes manually or scan QR tickets directly.</Text>
                    </VStack>
                    <Flex direction={{ base: "column", sm: "row" }} gap="10px" w={{ base: "100%", md: "auto" }}>
                      <Button w={{ base: "100%", sm: "auto" }} size="sm" h="38px" bg="#22c55e" color="black" fontWeight="800" _hover={{ bg: "#16a34a" }} onClick={() => { setScanStatus('idle'); setIsScannerOpen(true); }}>
                        Verify / Scan
                      </Button>
                      <Button w={{ base: "100%", sm: "auto" }} size="sm" h="38px" variant="outline" color="white" borderColor="#2A2A2A" _hover={{ bg: "#222" }} onClick={handleCopyBouncerLink}>
                        Copy Bouncer Link
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>
              </Box>
            </Flex>

            <Flex direction={{ base: "column", sm: "row" }} px={{ base: "16px", md: "40px" }} mt="40px" gap="12px">
              <Button isDisabled={!isKycVerified} flex="1" h="54px" bg="#22c55e" color="white" borderRadius="50px" fontSize="16px" fontWeight="600" _hover={{ bg: '#16a34a' }} onClick={() => window.location.href = `/${currentLocale}/events/create`}>
                Create Event
              </Button>
              <Button flex="1" h="54px" bg="#1a1a1a" color="white" borderRadius="50px" fontSize="15px" fontWeight="500" border="1px solid #2a2a2a" _hover={{ bg: '#222' }} onClick={() => setIsSwitchModalOpen(true)}>
                Switch Between Events
              </Button>
            </Flex>
          </>
        )}

      </Box>

      {/* TIER BREAKDOWN MODAL */}
      {activeEvent && activeEvent.tiers && (
        <Modal isOpen={isTierBreakdownOpen} onClose={() => setIsTierBreakdownOpen(false)} isCentered>
          <ModalOverlay bg="rgba(0,0,0,0.85)" backdropFilter="blur(4px)" />
          <ModalContent bg="#161616" border="1.5px solid #2A2A2A" borderRadius="20px" color="white" maxW="460px" mx="16px">
            <ModalHeader fontSize="18px" fontWeight="700" borderBottom="1px solid #222" pb="16px">Ticket Tier Performance</ModalHeader>
            <ModalCloseButton color="rgba(255,255,255,0.4)" />
            <ModalBody py="20px" px={{ base: "12px", md: "24px" }}>
              <VStack spacing="14px" align="stretch">
                {activeEvent.tiers.map((tier: any, idx: number) => {
                  const tierNetIncome = ((tier.price || 0) * (tier.sold || 0)) * 0.93;
                  return (
                    <Box key={idx} p="14px" bg="#1C1C1C" border="1px solid #2A2A2A" borderRadius="14px">
                      <Flex justify="space-between" align="center" mb="8px">
                        <Text fontWeight="700" fontSize="15px">{tier.name}</Text>
                        <Badge colorScheme="purple" borderRadius="6px" px="8px" py="2px">GH₵{tier.price}</Badge>
                      </Flex>
                      <Divider borderColor="#2A2A2A" my="8px" />
                      <Grid templateColumns="1fr 1fr" gap="8px" fontSize="13px" color="#9ca3af">
                        <GridItem>Tickets Sold:</GridItem>
                        <GridItem fontWeight="600" color="white" textAlign="right">{(tier.sold || 0).toLocaleString()}</GridItem>
                        <GridItem>Checked In:</GridItem>
                        <GridItem fontWeight="600" color="white" textAlign="right">{(tier.checkedIn || 0).toLocaleString()}</GridItem>
                        <GridItem>Net Income Payout:</GridItem>
                        <GridItem fontWeight="700" color="#22c55e" textAlign="right">
                          GH₵{tierNetIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </GridItem>
                      </Grid>
                    </Box>
                  )
                })}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* EVENT SWITCH MODAL */}
      <Modal isOpen={isSwitchModalOpen} onClose={() => setIsSwitchModalOpen(false)} isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.85)" backdropFilter="blur(4px)" />
        <ModalContent bg="#161616" border="1.5px solid #2A2A2A" borderRadius="20px" color="white" maxW="420px" mx="16px">
          <ModalHeader fontSize="18px" fontWeight="700" borderBottom="1px solid #222" pb="16px">Select Active Event</ModalHeader>
          <ModalCloseButton color="rgba(255,255,255,0.4)" />
          <ModalBody py="20px">
            <VStack spacing="12px" align="stretch">
              {events.map((evt, idx) => (
                <Flex
                  key={evt.id} p="14px" bg={currentEventIndex === idx ? "rgba(34, 197, 94, 0.1)" : "#1C1C1C"} border="1.5px solid" borderColor={currentEventIndex === idx ? "#22c55e" : "#2A2A2A"} borderRadius="14px" cursor="pointer" align="center" gap="14px"
                  onClick={() => handleSelectEvent(idx, evt.id)}
                >
                  <Box w="50px" h="50px" borderRadius="10px" overflow="hidden" flexShrink={0} bg="#1A1A1A" display="flex" alignItems="center" justifyContent="center">
                    {evt.coverImage ? (
                      <img src={evt.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <TicketIcon />
                    )}
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="600" fontSize="15px" noOfLines={1}>{evt.title || "Untitled Listing"}</Text>
                    <Text fontSize="12px" color="#6b7280" mt="2px">{evt.venue}</Text>
                  </Box>
                  {currentEventIndex === idx && <Box w="10px" h="10px" borderRadius="full" bg="#22c55e" />}
                </Flex>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* CHECK-IN VERIFICATION MODAL (CAMERA + MANUAL VERIFICATION) */}
      <Modal isOpen={isScannerOpen} onClose={() => { cleanupScanner(); setIsScannerOpen(false); }} size="full">
        <ModalOverlay bg="#0D0D0D" />
        <ModalContent bg="#0D0D0D" color="white" display="flex" alignItems="center" justifyContent="center">
          <ModalCloseButton top="30px" right="30px" size="lg" onClick={() => { cleanupScanner(); setIsScannerOpen(false); }} />
          <ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center" w="100%" maxW="460px" px="24px">
            <VStack spacing="24px" w="100%" textAlign="center">
              <Box>
                <Heading fontSize="22px" fontWeight="700" mb="6px">Verification Terminal</Heading>
                <Text color="#9ca3af" fontSize="13px">Checking passes for {activeEvent?.title}</Text>
              </Box>

              {/* GUEST COUNT CALCULATOR */}
              <Flex justify="space-between" align="center" bg="#161616" w="100%" p={3} borderRadius="14px" border="1px solid #222">
                <Text fontSize="13px" fontWeight="600" color="gray.300">
                  Guests Checking In
                </Text>
                <NumberInput
                  maxW="100px"
                  value={checkInCount}
                  min={1}
                  max={20}
                  onChange={(_, val) => setCheckInCount(val || 1)}
                >
                  <NumberInputField bg="#0D0D0D" border="1px solid #333" h="38px" fontSize="15px" fontWeight="700" textAlign="center" />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="white" border="none" />
                    <NumberDecrementStepper color="white" border="none" />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
              
              {/* DISPLAY AREA FOR CAMERA / MANUAL / RESULTS */}
              <Box position="relative" w="100%" minH="280px" bg="#161616" border={scanStatus === 'idle' ? "2px dashed rgba(255,255,255,0.15)" : "2px solid transparent"} borderRadius="24px" display="flex" alignItems="center" justifyContent="center" overflow="hidden" p={4}>
                
                {scanStatus === 'loading' && <Spinner size="lg" color="#22c55e" thickness="4px" />}
                
                {scanStatus === 'success' && (
                  <VStack spacing="10px">
                    <Heading fontSize="20px" color="#22c55e">✓ ACCESS GRANTED</Heading>
                    <Text fontSize="14px" color="white" fontWeight="700">{attendeeDetails?.name || "Valid Pass Holder"}</Text>
                    <Badge colorScheme="green" px={3} py={1} borderRadius="6px">{attendeeDetails?.tierName || "Verified Tier"}</Badge>
                    <Text fontSize="12px" color="gray.400" mt={2}>{scanMessage}</Text>
                  </VStack>
                )}
                
                {scanStatus === 'error' && (
                  <VStack spacing="10px">
                    <Heading fontSize="20px" color="#ef4444">✕ ADMISSION DENIED</Heading>
                    <Text fontSize="13px" color="gray.300">{scanMessage || "Invalid Pass Structure"}</Text>
                  </VStack>
                )}

                {scanStatus === 'idle' && (
                  <>
                    {!isManualMode ? (
                      /* CAMERA QR SCANNER MODE */
                      <Box id="reader" w="100%" h="100%" />
                    ) : (
                      /* MANUAL ENTRY CODE MODE */
                      <VStack spacing="14px" w="100%" align="stretch">
                        <Text fontSize="13px" color="gray.300" textAlign="left" fontWeight="600">
                          Enter Verification Code
                        </Text>
                        <Input
                          placeholder="e.g. VX-88492"
                          bg="#0D0D0D"
                          border="1px solid #333"
                          color="white"
                          h="50px"
                          fontSize="16px"
                          fontWeight="700"
                          value={manualCode}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualCode(e.target.value)}
                          _focus={{ borderColor: "#22c55e", boxShadow: "none" }}
                          autoFocus
                        />
                        <Button
                          h="48px"
                          bg="#22c55e"
                          color="black"
                          fontWeight="800"
                          fontSize="15px"
                          borderRadius="12px"
                          onClick={() => handleTicketVerification(manualCode)}
                          _hover={{ bg: "#16a34a" }}
                        >
                          Verify Code
                        </Button>
                      </VStack>
                    )}
                  </>
                )}
              </Box>

              {/* MODE TOGGLE LINK */}
              {scanStatus === 'idle' && (
                <Button
                  variant="ghost"
                  color="#22c55e"
                  fontSize="13px"
                  fontWeight="700"
                  onClick={() => setIsManualMode(!isManualMode)}
                  _hover={{ bg: "transparent" }}
                >
                  {isManualMode ? "← Switch to QR Camera Scanner" : "Use verification code"}
                </Button>
              )}

              {/* ACTION FOOTER BUTTONS */}
              <Flex direction={{ base: "column", sm: "row" }} gap="12px" w="100%" justify="center">
                {scanStatus !== 'idle' && (
                  <Button h="50px" w="100%" bg="#22C55E" color="black" fontWeight="800" borderRadius="50px" px="28px" _hover={{ bg: '#16A34A' }} onClick={handleResumeScanning}>
                    Verify Next Ticket
                  </Button>
                )}
                <Button h="50px" w="100%" bg="#1A1A1A" color="white" border="1px solid #2A2A2A" borderRadius="50px" px="28px" onClick={() => { cleanupScanner(); setIsScannerOpen(false); }}>
                  Close Terminal
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  )
}