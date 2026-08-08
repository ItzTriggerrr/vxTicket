'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Text, 
  Heading, 
  Button, 
  HStack, 
  Grid, 
  Flex, 
  IconButton, 
  Collapse, 
  VStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Spinner,
  Badge,
  Divider,
} from '@chakra-ui/react';

// ─── SVG CUSTOM ICONS ────────────────────────────────────────────────────────
const CheckCircleMini = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="6" fill="#22C55E" />
    <path d="M3.5 6L5 7.5L8.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseMenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── DATA & CATEGORY MATRIX SYNCHRONIZED WITH FEED ─────────────────────────
const featureBadges = [
  'Instant Booking',
  'Zero Hidden Fees',
  'Verified Hosts',
  '24/7 Support',
  'Secure Payments',
  'Instant Payouts',
];

const feedCategories = [
  { label: 'Faith', bg: '#42ba64', img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&q=80' },
  { label: 'Music & Party', bg: '#e61f86', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80' },
  { label: 'Dinner & Awards', bg: '#2393ee', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80' },
  { label: 'Arts & Comedy', bg: '#8a24ca', img: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&q=80' },
  { label: 'Conference', bg: '#ffbe1a', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80' },
  { label: 'Ceremonies', bg: '#ff501a', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80' },
];

export default function Home() {
  const [currentLocale, setCurrentLocale] = useState("en");

  // Dynamic Content States
  const [heroHeading] = useState("Events and Ticketing");
  const [heroDescription] = useState("Welcome to the trusted space of verified event providers and digital tickets for attendees, while giving flexible payouts and event analytic dashboard to providers.");
  
  // 🎈 Shiny Celebration / Party Confetti Image
  const heroBgImage = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80";

  // Supabase Database Stream States
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Drawer & Navigation Overlay States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAboutDrawerOpen, setIsAboutDrawerOpen] = useState(false);
  const [legalTitle, setLegalTitle] = useState("");
  const [legalContent, setLegalContent] = useState("");
  const [isLegalLoading, setIsLegalLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split('/');
      if (pathSegments[1] && pathSegments[1].length === 2) {
        setCurrentLocale(pathSegments[1]);
      }
    }

    async function fetchPublishedEvents() {
      try {
        const response = await fetch("/api/events/manage");
        if (response.ok) {
          const data = await response.json();
          if (!isMounted) return;

          let fetchedList = [];
          if (data && data.all) {
            fetchedList = data.all;
          } else {
            fetchedList = Array.isArray(data) ? data : (data.events || data.data || []);
            fetchedList = fetchedList.filter((item: any) => item.status?.toUpperCase() === "PUBLISHED");
          }

          setLiveEvents(fetchedList);
        }
      } catch (err) {
        console.error("Failed to load events for landing page:", err);
      } finally {
        if (isMounted) setIsLoadingEvents(false);
      }
    }

    fetchPublishedEvents();

    return () => { isMounted = false; };
  }, []);

  const memoizedEvents = useMemo(() => liveEvents || [], [liveEvents]);

  // 🚀 Updated legal drawer function linked directly to /api/legal/[slug] endpoint
  const handleOpenLegalDrawer = useCallback(async (type: "TERMS" | "PRIVACY") => {
    setLegalTitle(type === "TERMS" ? "Terms of Service" : "Privacy Policy");
    setIsDrawerOpen(true);
    setIsLegalLoading(true);
    setLegalContent("");

    // Exact slugs matching your Supabase LegalDocument rows
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
          ? "Welcome to vxTicket. By creating an account or hosting entry listings, you express absolute consent to our platform processing terms, standard ticket verification frameworks, and automatic payout structures.\n\nAll ticketing allocations are monitored to ensure secure operational check-ins."
          : "Your transactional security is our primary focus. vxTicket securely handles identity assertions, verification signatures, and profile fields via database rows protected under strict access rules."
      );
    } finally {
      setIsLegalLoading(false);
    }
  }, []);

  const handleCardRedirection = useCallback((eventId?: string) => {
    if (eventId) {
      window.location.href = `/${currentLocale}/event/${eventId}`;
    } else {
      window.location.href = `/${currentLocale}/feed`;
    }
  }, [currentLocale]);

  return (
    <Box maxW="100%" mx="auto" minH="100vh" bg="#111111" position="relative">
      
      {/* ─── NAVIGATION HEADER ──────────────────────────────────────────────── */}
      <Box position="absolute" top={0} left={0} right={0} zIndex={10} px={{ base: "20px", md: "60px", lg: "80px" }} py="24px">
        <Flex align="center" justify="space-between">
          <Heading fontSize="22px" fontWeight="900" color="white" letterSpacing="-0.5px">
            vxTicket
          </Heading>

          {/* Desktop Navigation */}
          <HStack spacing="28px" display={{ base: "none", md: "flex" }}>
            <Text 
              fontSize="14px" 
              fontWeight="600" 
              color="rgba(255,255,255,0.75)" 
              cursor="pointer" 
              _hover={{ color: "white" }} 
              onClick={() => setIsAboutDrawerOpen(true)}
            >
              About
            </Text>
            <Text fontSize="14px" fontWeight="600" color="rgba(255,255,255,0.75)" cursor="pointer" _hover={{ color: "white" }} onClick={() => handleCardRedirection()}>Discover</Text>
            <Text fontSize="14px" fontWeight="600" color="rgba(255,255,255,0.75)" cursor="pointer" _hover={{ color: "white" }} onClick={() => handleCardRedirection()}>Find Events</Text>
            <Button size="sm" colorScheme="green" bg="#4CAF50" borderRadius="20px" px="16px" fontSize="13px" fontWeight="700" _hover={{ bg: '#43A047' }} onClick={() => window.location.href = `/${currentLocale}/auth`}>
              Create and Sell Events
            </Button>
          </HStack>

          {/* Mobile Navigation Trigger */}
          <IconButton 
            display={{ base: "flex", md: "none" }}
            aria-label="Toggle navigation menu" 
            icon={isMenuOpen ? <CloseMenuIcon /> : <HamburgerIcon />} 
            variant="ghost" 
            color="white" 
            _hover={{ bg: "transparent" }}
            _active={{ bg: "transparent" }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </Flex>

        {/* Mobile Dropdown Panel */}
        <Collapse in={isMenuOpen} animateOpacity>
          <VStack spacing="16px" bg="#161616" borderRadius="16px" mt="12px" p="20px" align="stretch" border="1px solid #2A2A2A" display={{ md: "none" }}>
            <Text 
              fontSize="14px" 
              fontWeight="600" 
              color="white" 
              py="4px" 
              onClick={() => { setIsMenuOpen(false); setIsAboutDrawerOpen(true); }}
            >
              About
            </Text>
            <Text fontSize="14px" fontWeight="600" color="white" py="4px" onClick={() => handleCardRedirection()}>Discover</Text>
            <Text fontSize="14px" fontWeight="600" color="white" py="4px" onClick={() => handleCardRedirection()}>Find Events</Text>
            <Button w="100%" colorScheme="green" bg="#4CAF50" h="44px" borderRadius="12px" fontSize="14px" fontWeight="700" onClick={() => window.location.href = `/${currentLocale}/auth`}>
              Create and Sell Events
            </Button>
          </VStack>
        </Collapse>
      </Box>

      {/* ─── HERO SECTION (BALANCED BRIGHTNESS & LIGHT BLUR) ─────────────────── */}
      <Box position="relative" w="100%" minH={{ base: "480px", md: "650px", lg: "720px" }} overflow="hidden" display="flex" alignItems="center">
        
        {/* Shiny Confetti Image Layer with Subtle Blur & Lifted Brightness */}
        <Box 
          position="absolute" 
          inset="-10px" 
          bgImage={`url('${heroBgImage}')`} 
          bgSize="cover" 
          bgPosition="center center" 
          filter="blur(2px) brightness(0.7) saturate(1.1)"
          transform="scale(1.02)"
        />
        
        {/* Targeted Gradient for Text Legibility without darkening the hero */}
        <Box 
          position="absolute" 
          inset={0} 
          bgGradient="linear(to-b, rgba(0,0,0,0.4) 0%, rgba(17,17,17,0.55) 65%, #111111 100%)" 
        />
        
        <Box position="relative" zIndex={1} px={{ base: "20px", md: "60px", lg: "80px" }} pt={{ base: "140px", md: "60px" }} pb="32px" w="100%">
          <Heading 
            as="h1" 
            fontSize={{ base: "38px", md: "68px", lg: "84px" }} 
            fontWeight="900" 
            lineHeight="1.05" 
            color="white" 
            mb="18px" 
            letterSpacing="-1.5px"
            textShadow="0 4px 18px rgba(0,0,0,0.85)"
          >
            {heroHeading}
          </Heading>
          <Text 
            fontSize={{ base: "14px", md: "18px" }} 
            color="rgba(255,255,255,0.95)" 
            mb="36px" 
            lineHeight="1.6" 
            maxW={{ base: "100%", md: "540px" }}
            fontWeight="600"
            textShadow="0 2px 10px rgba(0,0,0,0.85)"
          >
            {heroDescription}
          </Text>
          <HStack spacing={{ base: "12px", md: "16px" }}>
            <Button 
              bg="#4CAF50" 
              color="white" 
              fontSize={{ base: "14px", md: "16px" }} 
              fontWeight="700" 
              px={{ base: "26px", md: "36px" }} 
              h={{ base: "46px", md: "54px" }} 
              borderRadius="50px" 
              _hover={{ bg: '#43A047', transform: 'translateY(-2px)' }} 
              transition="all 0.2s"
              onClick={() => handleCardRedirection()}
            >
              Browse Events
            </Button>
            
            <Button 
              variant="outline" 
              borderColor="rgba(255,255,255,0.6)" 
              color="white" 
              fontSize={{ base: "14px", md: "16px" }} 
              fontWeight="600" 
              px={{ base: "26px", md: "36px" }} 
              h={{ base: "46px", md: "54px" }} 
              borderRadius="50px" 
              _hover={{ bg: 'rgba(255,255,255,0.15)', borderColor: 'white', transform: 'translateY(-2px)' }} 
              transition="all 0.2s"
              onClick={() => window.location.href = `/${currentLocale}/auth`}
            >
              Create Event
            </Button>
          </HStack>
        </Box>
      </Box>

      {/* ─── FEATURE PILL CAROUSEL ────────────────────────────────────────── */}
      <Box bg="#111111" borderTop="1px solid #1C1C1C" borderBottom="1px solid #1C1C1C" py="16px" px={{ base: "20px", md: "60px", lg: "80px" }}>
        <HStack spacing="12px" overflowX="auto" py="4px" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          {featureBadges.map((badgeText, idx) => (
            <HStack 
              key={idx} 
              bg="#1A1A1A" 
              border="1px solid #2A2A2A" 
              px="18px" 
              py="10px" 
              borderRadius="100px" 
              flexShrink={0}
              spacing="8px"
              transition="all 0.2s"
              _hover={{ bg: "#222222", borderColor: "#22C55E", transform: "translateY(-1px)" }}
            >
              <CheckCircleMini />
              <Text fontSize="13px" fontWeight="700" color="white" letterSpacing="0.2px">
                {badgeText}
              </Text>
            </HStack>
          ))}
        </HStack>
      </Box>

      {/* ─── TRENDING NOW SECTION ───────────────────────────────────────────── */}
      <Box bg="#111111" py={{ base: "32px", md: "48px" }}>
        <Heading fontSize={{ base: "22px", md: "30px" }} fontWeight="800" color="white" px={{ base: "20px", md: "60px", lg: "80px" }} mb="24px" letterSpacing="-0.5px">
          Trending 
        </Heading>
        
        {isLoadingEvents ? (
          <Flex justify="center" py="40px">
            <Spinner color="#22C55E" size="lg" thickness="3px" />
          </Flex>
        ) : (
          <Box overflowX="auto" px={{ base: "20px", md: "60px", lg: "80px" }} pb="16px" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
            <HStack spacing={{ base: "16px", md: "24px" }} align="flex-start" minW="max-content">
              {memoizedEvents.map((item, idx) => (
                <Box key={item.id || idx} w={{ base: "170px", md: "290px" }} flexShrink={0} cursor="pointer" transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)' }} onClick={() => handleCardRedirection(item.id)}>
                  <Box w="100%" h={{ base: "125px", md: "190px" }} borderRadius="18px" overflow="hidden" mb="12px" bg="#1A1A1A">
                    <Box as="img" loading="lazy" src={item.coverImage || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80"} alt={item.title} w="100%" h="100%" objectFit="cover" display="block" transition="transform 0.5s" _hover={{ transform: 'scale(1.05)' }} />
                  </Box>
                  <Text fontSize={{ base: "15px", md: "18px" }} fontWeight="700" color="white" lineHeight="1.3" mb="4px" noOfLines={1}>{item.title}</Text>
                  <Text fontSize={{ base: "13px", md: "15px" }} color="rgba(255,255,255,0.55)" lineHeight="1.3" noOfLines={1}>{item.venueName || item.venue || "Venue Unspecified"}</Text>
                </Box>
              ))}
            </HStack>
          </Box>
        )}
      </Box>

      {/* ─── EXPLORE CATEGORIES SECTION ──────────────────────────────────────── */}
      <Box bg="#111111" px={{ base: "20px", md: "60px", lg: "80px" }} py={{ base: "32px", md: "48px" }}>
        <Heading fontSize={{ base: "22px", md: "30px" }} fontWeight="800" color="white" mb="24px" letterSpacing="-0.5px">
          Categories
        </Heading>
        <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }} gap={{ base: "14px", md: "22px" }}>
          {feedCategories.map((cat) => (
            <Box key={cat.label} bg={cat.bg} borderRadius="18px" h={{ base: "120px", md: "170px" }} position="relative" overflow="hidden" cursor="pointer" transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)' }} onClick={() => handleCardRedirection()}>
              <Box position="absolute" bottom="-15px" right="-15px" w={{ base: "95px", md: "145px" }} h={{ base: "95px", md: "145px" }} borderRadius="14px" overflow="hidden" opacity={0.45} transform="rotate(-10deg)">
                <Box as="img" loading="lazy" src={cat.img} alt={cat.label} w="100%" h="100%" objectFit="cover" display="block" />
              </Box>
              <Text position="absolute" top={{ base: "16px", md: "22px" }} left={{ base: "16px", md: "22px" }} fontSize={{ base: "16px", md: "21px" }} fontWeight="900" color="white" zIndex={1} textShadow="0 2px 5px rgba(0,0,0,0.4)">
                {cat.label}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>

      {/* ─── MADE FOR YOU SECTION ───────────────────────────────────────────── */}
      <Box bg="#111111" py={{ base: "32px", md: "48px" }}>
        <Box px={{ base: "20px", md: "60px", lg: "80px" }} mb="24px">
          <Heading fontSize={{ base: "22px", md: "30px" }} fontWeight="800" color="white" mb="6px" letterSpacing="-0.5px">
            Made For You
          </Heading>
        </Box>

        {isLoadingEvents ? (
          <Flex justify="center" py="40px">
            <Spinner color="#22C55E" size="lg" thickness="3px" />
          </Flex>
        ) : (
          <Box overflowX="auto" px={{ base: "20px", md: "60px", lg: "80px" }} pb="32px" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
            <HStack spacing={{ base: "16px", md: "24px" }} align="flex-start" minW="max-content">
              {memoizedEvents.map((item, idx) => (
                <Box key={item.id || idx} w={{ base: "145px", md: "250px" }} flexShrink={0} cursor="pointer" transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)' }} onClick={() => handleCardRedirection(item.id)}>
                  <Box w="100%" h={{ base: "115px", md: "165px" }} borderRadius="18px" overflow="hidden" mb="12px" bg="#1A1A1A">
                    <Box as="img" loading="lazy" src={item.coverImage || "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80"} alt={item.title} w="100%" h="100%" objectFit="cover" display="block" transition="transform 0.5s" _hover={{ transform: 'scale(1.05)' }} />
                  </Box>
                  <Text fontSize={{ base: "15px", md: "17px" }} fontWeight="700" color="white" lineHeight="1.3" mb="4px" noOfLines={1}>{item.title}</Text>
                  <Text fontSize={{ base: "13px", md: "14px" }} color="rgba(255,255,255,0.55)" noOfLines={1}>{item.venueName || item.venue || "Venue Unspecified"}</Text>
                </Box>
              ))}
            </HStack>
          </Box>
        )}
      </Box>

      {/* ─── FOOTER SECTION ─────────────────────────────────────────────────── */}
      <Box bg="#0a0a0a" px={{ base: "20px", md: "60px", lg: "80px" }} pt={{ base: "40px", md: "64px" }} pb={{ base: "40px", md: "64px" }} borderTop="1px solid #1a1a1a">
        <Box maxW="container.xl" mx="auto">
          <HStack spacing={{ base: 8, md: 16 }} align="flex-start" flexDirection={{ base: "column", md: "row" }} justify="space-between" w="100%">
            
            <Box mb={{ base: 8, md: 0 }}>
              <Heading fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="white" mb="16px">
                 Payment Options
              </Heading>
              <HStack spacing={{ base: "12px", md: "16px" }} flexWrap="wrap">
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="700" color="#4CAF50">Mobile Money</Text>
                <Text fontSize="14px" color="rgba(255,255,255,0.3)">•</Text>
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="700" color="#2196F3">USSD</Text>
                <Text fontSize="14px" color="rgba(255,255,255,0.3)">•</Text>
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="700" color="white">Bank Transfers</Text>
              </HStack>
            </Box>

            <Box mb={{ base: 8, md: 0 }}>
              <Heading fontSize={{ base: "16px", md: "18px" }} fontWeight="700" color="white" mb="16px">
                Connect with vxTicket
              </Heading>
              <HStack spacing={{ base: "16px", md: "24px" }}>
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="600" color="rgba(255,255,255,0.6)" cursor="pointer" _hover={{ color: "white" }}>Instagram</Text>
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="600" color="rgba(255,255,255,0.6)" cursor="pointer" _hover={{ color: "white" }}>X</Text>
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="600" color="rgba(255,255,255,0.6)" cursor="pointer" _hover={{ color: "white" }}>Facebook</Text>
                <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="600" color="rgba(255,255,255,0.6)" cursor="pointer" _hover={{ color: "white" }}>WhatsApp</Text>
              </HStack>
            </Box>

          </HStack>

          <Box mt={{ base: "32px", md: "64px" }} borderTop="1px solid rgba(255,255,255,0.05)" pt={{ base: "24px", md: "32px" }} display={{ md: "flex" }} justifyContent="space-between" alignItems="center">
            <Text fontSize={{ base: "14px", md: "15px" }} fontWeight="600" color="#4CAF50" mb={{ base: "12px", md: 0 }}>
              vxticket@gmail.com
            </Text>
            <Text fontSize={{ base: "12px", md: "14px" }} color="rgba(255,255,255,0.4)" lineHeight="1.8">
              © 2026 QuickServe Network • 
              <Box as="span" ml="6px" cursor="pointer" color="#4CAF50" fontWeight="700" _hover={{ textDecoration: 'underline' }} onClick={() => handleOpenLegalDrawer("TERMS")}>Terms of Service</Box>
              • 
              <Box as="span" ml="6px" cursor="pointer" color="#4CAF50" fontWeight="700" _hover={{ textDecoration: 'underline' }} onClick={() => handleOpenLegalDrawer("PRIVACY")}>Privacy Policy</Box>
            </Text>
          </Box>
        </Box>
      </Box>

      {/* ─── 💡 ABOUT VXTICKET SIDE-SLIDING PANEL DRAWER SHEET ────────────────── */}
      <Drawer isOpen={isAboutDrawerOpen} placement="right" onClose={() => setIsAboutDrawerOpen(false)} size={{ base: "full", md: "md" }}>
        <DrawerOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(8px)" />
        <DrawerContent bg="#141414" borderLeft="1.5px solid #2A2A2A" color="white" p={{ base: "8px", md: "20px" }}>
          <DrawerCloseButton color="rgba(255,255,255,0.4)" top="24px" right="24px" size="md" />
          <DrawerHeader fontSize="22px" fontWeight="800" borderBottom="1px solid #222" pb="20px" mt="10px" letterSpacing="-0.3px">
            About vxTicket
          </DrawerHeader>
          <DrawerBody py="28px" px={{ base: "16px", md: "24px" }}>
            <VStack spacing="20px" align="stretch">
              
              <Box bg="#1A1A1A" p="16px" borderRadius="14px" border="1px solid #2A2A2A">
                <Badge colorScheme="green" mb="8px" px="8px" py="2px" borderRadius="4px">PLATFORM OVERVIEW</Badge>
                <Text fontSize="14px" color="#D1D5DB" lineHeight="1.6">
                  vxTicket is a modern event discovery, ticketing, event hosting and operational management ecosystem engineered for event hosts, artists, and attendees across Africa.
                </Text>
              </Box>

              <Divider borderColor="#222" />

              <Heading fontSize="16px" fontWeight="700" color="white">
                Key Platform Capabilities
              </Heading>

              <VStack spacing="12px" align="stretch">
                <Box bg="#1A1A1A" p="12px 16px" borderRadius="12px" border="1px solid #262626">
                  <Text fontSize="14px" fontWeight="700" color="#22C55E" mb="2px">Instant Ticket Issuance</Text>
                  <Text fontSize="13px" color="#9CA3AF">
                    Automated ticket delivery via MoMo, and Card payments with digital passes.
                  </Text>
                </Box>

                <Box bg="#1A1A1A" p="12px 16px" borderRadius="12px" border="1px solid #262626">
                  <Text fontSize="14px" fontWeight="700" color="#22C55E" mb="2px">Multi-Event Workspace Switcher</Text>
                  <Text fontSize="13px" color="#9CA3AF">
                    Seamlessly manage and toggle between multiple active or past event listings under a single provider account context.
                  </Text>
                </Box>

                <Box bg="#1A1A1A" p="12px 16px" borderRadius="12px" border="1px solid #262626">
                  <Text fontSize="14px" fontWeight="700" color="#22C55E" mb="2px">Gate Attendant Terminal</Text>
                  <Text fontSize="13px" color="#9CA3AF">
                    Seamless QR code scanning and manual code entry for instant gate validation.
                  </Text>
                </Box>

                <Box bg="#1A1A1A" p="12px 16px" borderRadius="12px" border="1px solid #262626">
                  <Text fontSize="14px" fontWeight="700" color="#22C55E" mb="2px">Host Operational Analytics</Text>
                  <Text fontSize="13px" color="#9CA3AF">
                    Real-time revenue calculation, ticket options breakdowns, and check-in metrics.
                  </Text>
                </Box>

                <Box bg="#1A1A1A" p="12px 16px" borderRadius="12px" border="1px solid #262626">
                  <Text fontSize="14px" fontWeight="700" color="#22C55E" mb="2px">Verified Host Identity</Text>
                  <Text fontSize="13px" color="#9CA3AF">
                    KYC compliance framework protecting both organizers and ticket buyers.
                  </Text>
                </Box>
              </VStack>

              <Button 
                w="100%" 
                h="52px" 
                bg="#22C55E" 
                color="black" 
                borderRadius="50px" 
                mt="20px" 
                fontSize="15px" 
                fontWeight="800" 
                _hover={{ bg: "#16A34A" }} 
                onClick={() => setIsAboutDrawerOpen(false)}
              >
                Close Overview
              </Button>

            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ─── LEGAL DRAWER SHEET ────────────────────────────────────────────── */}
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
            <Button w="100%" h="52px" bg="#22C55E" color="white" borderRadius="50px" mt="36px" fontSize="15px" fontWeight="800" _hover={{ bg: "#16A34A" }} onClick={() => setIsDrawerOpen(false)}>
              Acknowledge & Return
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

    </Box>
  );
}