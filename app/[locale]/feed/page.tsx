"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  Divider,
  Skeleton,
  SkeletonText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { SearchIcon, CalendarIcon } from "@chakra-ui/icons";

// ─── CUSTOM DEBOUNCE HOOK FOR SMOOTH TYPING PERFORMANCE ──────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ─── TINY INLINE SVG ICONS ────────────────────────────────────────────────────
const TicketIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#22c55e" />
    <circle cx="2" cy="12" r="2" fill="#111" />
    <circle cx="22" cy="12" r="2" fill="#111" />
    <line x1="9" y1="6" x2="9" y2="18" stroke="#111" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

const LocationPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22c55e" />
    <circle cx="12" cy="9" r="2.5" fill="#111" />
  </svg>
);

// ─── FUZZY KEYWORD INTELLIGENCE DICTIONARY MATRIX ───────────────────────────
const categoryKeywords: Record<string, string[]> = {
  "Faith": ["faith", "gospel", "church", "worship", "praise", "mosque", "annointing", "revival", "religious", "christian", "prayer"],
  "Music & Party": ["music", "party", "concert", "rave", "club", "dance", "night", "groove", "afrobeat", "festival", "jam", "show", "dj", "clubbing"],
  "Dinner & Awards": ["Dinner", "Awards", "Celebration", "Excellence", "Achievement", "Recognition", "Honor", "Success", "Innovation", "Networking", "Elegant", "Prestigious", "Memorable", "Grand", "Inspirational", "Sophisticated", "Unforgettable", "Exquisite", "Sumptuous", "Black-tie"],
  "Arts & Comedy": ["arts", "comedy", "standup", "stand-up", "theatre", "play", "gallery", "exhibition", "showcase", "painting", "improv", "funny", "art"],
  "Conference": ["conference", "summit", "tech", "seminar", "business", "masterclass", "corporate", "talk", "panel", "meeting"],
  "Ceremonies": ["Ceremony", "Celebration", "Tradition", "Honor", "Ritual", "Commencement", "Dedication", "Inauguration", "Graduation", "Coronation", "Festival", "Observance", "Anniversary", "Memorial", "Convocation", "Procession", "Banquet", "Reception", "Gathering", "Occasion"]
};

export default function VxTicketHome() {
  // ─── CORE SYSTEM STATE ENGINES ────────────────────────────────────────────
  const [curatedData, setCuratedData] = useState<{ hero: any; featured: any[]; popular: any[]; all: any[] }>({
    hero: null, featured: [], popular: [], all: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // ─── 🌍 INTERNATIONAL SCALE MATRIX REGISTRY ──────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState("Ghana");
  const supportedCountries = ["Ghana", "Nigeria", "Kenya", "South Africa"];

  const categories = useMemo(() => [
    { label: "Faith", bg: "#42ba64" },
    { label: "Music & Party", bg: "#e61f86" },
    { label: "Dinner & Awards", bg: "#2393ee" },
    { label: "Arts & Comedy", bg: "#8a24ca" },
    { label: "Conference", bg: "#ffbe1a" },
    { label: "Ceremonies", bg: "#ff501a" },
  ], []);

  // ─── 🚀 LIVE DATABASE DOWNSTREAM SYNCHRONIZATION ──────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function rehydrateFeedInventory() {
      try {
        const response = await fetch("/api/events/manage");
        if (!response.ok) throw new Error("API stream rejected response context.");
        const data = await response.json();
        
        if (!isMounted) return;

        let allListings: any[] = [];

        if (data && data.all) {
          allListings = data.all || [];
        } else {
          allListings = Array.isArray(data) ? data : (data.events || data.data || []);
        }

        // Filter for published events
        allListings = allListings.filter((item: any) => item.status?.toUpperCase() === "PUBLISHED");

        // 1. Hero Event: EXCLUSIVELY events explicitly flagged as isHero === true
        const hero = data.hero && data.hero.isHero ? data.hero : null;

        // 2. Featured Events: Automatic top 4 upcoming events sorted chronologically
        const featured = [...allListings]
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 4);

        // 3. Made for You (Popular / All): Full collection of all published events
        const popular = allListings;
        
        setCuratedData({ hero, featured, popular, all: allListings });
      } catch (err) {
        console.error("Discovery engine synchronization fault:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    rehydrateFeedInventory();

    return () => { isMounted = false; };
  }, []);

  // ─── OPTIMIZED MEMOIZED FILTER PIPELINE ───────────────────────────────────
  const processFiltering = useCallback((sourceList: any[], query: string, category: string | null, country: string) => {
    const q = query.toLowerCase().trim();
    const targetCountry = country.toLowerCase();

    return sourceList.filter((event) => {
      const titleText = (event.title || "").toLowerCase();
      const categoryText = (event.category || "").toLowerCase();
      const venueText = (event.venueName || "").toLowerCase();
      const cityText = (event.city || "").toLowerCase();
      const countryText = (event.country || "ghana").toLowerCase();

      const matchesSearch = !q || 
        titleText.includes(q) || 
        venueText.includes(q) || 
        cityText.includes(q);

      const matchesCountry = countryText === targetCountry;

      let matchesCategory = true;
      if (category) {
        const words = categoryKeywords[category] || [];
        matchesCategory = 
          categoryText === category.toLowerCase() ||
          words.some((keyword) => categoryText.includes(keyword) || titleText.includes(keyword));
      }

      return matchesSearch && matchesCategory && matchesCountry;
    });
  }, []);

  const displayFeatured = useMemo(() => {
    return processFiltering(curatedData.featured, debouncedSearchQuery, activeCategory, selectedCountry);
  }, [curatedData.featured, debouncedSearchQuery, activeCategory, selectedCountry, processFiltering]);

  const displayPopular = useMemo(() => {
    return processFiltering(curatedData.popular, debouncedSearchQuery, activeCategory, selectedCountry);
  }, [curatedData.popular, debouncedSearchQuery, activeCategory, selectedCountry, processFiltering]);

  // ─── 🏷️ TICKET CAPACITY & SOLD OUT EVALUATOR ─────────────────────────────
  const checkIfSoldOut = useCallback((tiers: any[]) => {
    if (!tiers || tiers.length === 0) return false;
    const totalCapacity = tiers.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
    const totalSold = tiers.reduce((acc, t) => acc + (Number(t.sold) || 0), 0);
    return totalCapacity > 0 && totalSold >= totalCapacity;
  }, []);

  // ─── 🌍 DYNAMIC INTEL REGIONAL CURRENCY CONFIGURATOR ─────────────────────
  const evaluateStartingPrice = useCallback((tiers: any[]) => {
    if (!tiers || tiers.length === 0) return "Free";
    const possessesFreeTier = tiers.some((t) => t.isFree || Number(t.price) === 0);
    if (possessesFreeTier) return "Free";
    
    const numericPrices = tiers.map((t) => Number(t.price || 0));
    const minimumPrice = Math.min(...numericPrices);

    let dynamicLabel = "GHC";
    if (selectedCountry === "Nigeria") dynamicLabel = "NGN";
    else if (selectedCountry === "Kenya") dynamicLabel = "KES";
    else if (selectedCountry === "South Africa") dynamicLabel = "ZAR";

    return `${dynamicLabel} ${minimumPrice}`;
  }, [selectedCountry]);

  const transformISOToDisplayDate = useCallback((isoString: string, timeString: string) => {
    if (!isoString) return "Date Pending";
    const dateInstance = new Date(isoString);
    const datePart = dateInstance.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return timeString ? `${datePart} • ${timeString}` : datePart;
  }, []);

  const handleCardRedirection = useCallback((id: string) => {
    window.location.href = `/event/${id}`;
  }, []);

  // ─── ⚡ SKELETON PLACEHOLDER LOADER (DARK THEMED) ─────────────────────────
  if (isLoading) {
    return (
      <Box bg="#111111" color="white" minH="100vh" fontFamily="'Inter', sans-serif" pb={6}>
        <Box maxW={{ base: "100%", md: "container.xl" }} mx="auto">
          {/* Header Skeleton */}
          <Box px={{ base: 4, md: 8 }} py={4}>
            <Skeleton h="24px" w="120px" startColor="#1e1e1e" endColor="#2a2a2a" borderRadius="6px" />
          </Box>

          {/* Hero Banner Skeleton */}
          <Box mx={{ base: 4, md: 8 }} mt={4} borderRadius="14px" overflow="hidden">
            <Skeleton h={{ base: "160px", md: "380px" }} w="100%" startColor="#1e1e1e" endColor="#2a2a2a" />
          </Box>

          {/* Category Bar Skeleton */}
          <Box px={{ base: 4, md: 8 }} mt={6}>
            <Skeleton h="20px" w="100px" mb={3} startColor="#1e1e1e" endColor="#2a2a2a" />
            <HStack spacing={3} overflowX="hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} flexShrink={0} w={{ base: "110px", md: "150px" }} h={{ base: "64px", md: "80px" }} borderRadius="14px" startColor="#1e1e1e" endColor="#2a2a2a" />
              ))}
            </HStack>
          </Box>

          {/* Featured Cards Skeleton */}
          <Box px={{ base: 4, md: 8 }} mt={7}>
            <Skeleton h="20px" w="140px" mb={3} startColor="#1e1e1e" endColor="#2a2a2a" />
            <HStack spacing={4} overflowX="hidden">
              {[1, 2, 3, 4].map((i) => (
                <Box key={i} flexShrink={0} w={{ base: "200px", md: "260px" }} bg="#1a1a1a" borderRadius="14px" p={3} border="1px solid #2a2a2a">
                  <Skeleton h="130px" w="100%" borderRadius="10px" startColor="#1e1e1e" endColor="#2a2a2a" mb={3} />
                  <SkeletonText noOfLines={3} spacing="2" startColor="#1e1e1e" endColor="#2a2a2a" />
                </Box>
              ))}
            </HStack>
          </Box>
        </Box>
      </Box>
    );
  }

  const heroFeaturedEvent = curatedData.hero;

  return (
    <Box bg="#111111" color="white" minH="100vh" fontFamily="'Inter', sans-serif" pb={6}>
      <Box maxW={{ base: "100%", md: "container.xl" }} mx="auto">
        
        {/* ── NAV WITH DIFFUSED GRADIENT BACKDROP ── */}
        <Box bgGradient="linear(to-b, #0d1f14 0%, #111111 100%)" px={{ base: 4, md: 8 }} py={4}>
          <HStack spacing={2}>
            <TicketIcon />
            <Text fontWeight={700} fontSize="18px" letterSpacing="-0.3px">
              vxTicket
            </Text>
          </HStack>
        </Box>

        {/* ── HERO BANNER (ONLY RENDERS IF AN EVENT HAS isHero = true) ── */}
        {heroFeaturedEvent && (
          <Box mx={{ base: 4, md: 8 }} mt={4} borderRadius="14px" overflow="hidden" position="relative" cursor="pointer" onClick={() => handleCardRedirection(heroFeaturedEvent.id)}>
            <Image
              src={heroFeaturedEvent.coverImage || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80"}
              alt={heroFeaturedEvent.title}
              w="100%"
              h={{ base: "160px", md: "380px" }}
              objectFit="cover"
              objectPosition="center"
              loading="eager"
            />
            <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.800 40%, blackAlpha.200)" />
            <Box position="absolute" bottom={0} left={0} right={0} p={{ base: 4, md: 8 }}>
              <Badge bg="#7c3aed" color="white" fontSize={{ base: "10px", md: "12px" }} px={2} py="2px" borderRadius="4px" mb={2} letterSpacing="1px">
                TRENDING
              </Badge>
              <Text fontWeight={800} fontSize={{ base: "22px", md: "36px" }} lineHeight="1.2" mb="2px">
                {heroFeaturedEvent.title}
              </Text>
              <Text fontSize={{ base: "12px", md: "14px" }} color="whiteAlpha.800" mb={4}>
                {transformISOToDisplayDate(heroFeaturedEvent.startDate, heroFeaturedEvent.startTime)}
              </Text>
              <Button bg="#22c55e" color="black" fontWeight={700} fontSize={{ base: "14px", md: "16px" }} h={{ base: "38px", md: "46px" }} w={{ base: "100%", md: "240px" }} borderRadius="8px" _hover={{ bg: "#16a34a" }}>
                Get Tickets
              </Button>
            </Box>
          </Box>
        )}

        {/* ── LOCATION DROP-DOWN MECHANISM & SEARCH BAR ── */}
        <Flex direction={{ base: "column", md: "row" }} px={{ base: 4, md: 8 }} mt={5} gap={4} align={{ base: "flex-start", md: "center" }}>
          <Box flexShrink={0}>
            <Menu>
              <MenuButton as={Button} variant="unstyled" h="auto" p={0} _focus={{ boxShadow: "none" }} _active={{ bg: "transparent" }}>
                <HStack spacing={1.5} cursor="pointer">
                  <LocationPinIcon />
                  <Text fontSize="14px" fontWeight="600" color="white">{selectedCountry}</Text>
                  <Text fontSize="10px" color="gray.400" transition="all 0.2s">▼</Text>
                </HStack>
              </MenuButton>
              <MenuList bg="#1e1e1e" border="1px solid #2a2a2a" color="white" minW="140px" zIndex={10} p={1} borderRadius="8px">
                {supportedCountries.map((country) => (
                  <MenuItem
                    key={country}
                    bg={selectedCountry === country ? "#2a2a2a" : "#1e1e1e"}
                    color={selectedCountry === country ? "#22c55e" : "white"}
                    _hover={{ bg: "#2a2a2a" }}
                    _focus={{ bg: "#2a2a2a" }}
                    fontSize="13px"
                    fontWeight={600}
                    borderRadius="6px"
                    onClick={() => setSelectedCountry(country)}
                  >
                    {country}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </Box>

          <Box flex={1} w="100%">
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="42px">
                <SearchIcon color="gray.500" boxSize={4} />
              </InputLeftElement>
              <Input
                placeholder="Search events, artists, venues..."
                bg="#1e1e1e"
                border="none"
                borderRadius="10px"
                h="42px"
                fontSize="13px"
                color="gray.300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                _placeholder={{ color: "gray.500" }}
                _focus={{ boxShadow: "none", border: "1px solid #22c55e" }}
                pl={9}
              />
            </InputGroup>
          </Box>
        </Flex>

        {/* ── BROWSE CATEGORIES ── */}
        <Box px={{ base: 4, md: 8 }} mt={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight={700} fontSize="16px">Categories</Text>
            {activeCategory && (
              <Text color="#22c55e" fontSize="13px" fontWeight="600" cursor="pointer" onClick={() => setActiveCategory(null)}>
                Clear Selection
              </Text>
            )}
          </Flex>
          <HStack spacing={3} overflowX="auto" pb={2} sx={{ "&::-webkit-scrollbar": { display: "none" } }}>
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.label;
              return (
                <Box
                  key={cat.label}
                  flexShrink={0}
                  w={{ base: "110px", md: "150px" }}
                  h={{ base: "64px", md: "80px" }}
                  bg={cat.bg}
                  opacity={activeCategory && !isSelected ? 0.35 : 1}
                  border={isSelected ? "2.5px solid white" : "none"}
                  borderRadius="14px"
                  display="flex"
                  alignItems="center"
                  p={4}
                  cursor="pointer"
                  onClick={() => setActiveCategory(isSelected ? null : cat.label)}
                  transition="all 0.15s"
                >
                  <Text fontWeight={800} fontSize={{ base: "13px", md: "15px" }} color="white" lineHeight="1.2">
                    {cat.label}
                  </Text>
                </Box>
              );
            })}
          </HStack>
        </Box>

        {/* ── FEATURED EVENTS ── */}
        <Box px={{ base: 4, md: 8 }} mt={7}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight={700} fontSize="16px">Featured Events</Text>
            <Text fontSize="13px" color="gray.400"></Text>
          </Flex>

          {displayFeatured.length === 0 ? (
            <Box bg="#1a1a1a" p={8} borderRadius="14px" textAlign="center" border="1px dashed #2a2a2a" w="100%">
              <Text color="gray.500" fontSize="13px">No events matched your search.</Text>
            </Box>
          ) : (
            <HStack spacing={4} overflowX="auto" pb={2} align="stretch" sx={{ "&::-webkit-scrollbar": { display: "none" } }}>
              {displayFeatured.map((event) => {
                const isSoldOut = checkIfSoldOut(event.ticketTiers || event.tiers);
                return (
                  <Box key={event.id} flexShrink={0} w={{ base: "200px", md: "260px" }} bg="#1a1a1a" borderRadius="14px" overflow="hidden" border="1px solid #2a2a2a" cursor="pointer" onClick={() => handleCardRedirection(event.id)}>
                    <Box position="relative">
                      <Image 
                        src={event.coverImage || "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80"} 
                        alt={event.title} 
                        w="100%" 
                        h="130px" 
                        objectFit="cover" 
                        loading="lazy" 
                        filter={isSoldOut ? "grayscale(40%)" : "none"}
                      />
                      {isSoldOut && (
                        <Badge position="absolute" top={2} right={2} bg="#ef4444" color="white" fontSize="10px" px={2} py="2px" borderRadius="4px" fontWeight={800}>
                          SOLD OUT
                        </Badge>
                      )}
                    </Box>

                    <Box p={4}>
                      <Text fontWeight={700} fontSize={{ base: "14px", md: "16px" }} mb={1} noOfLines={1}>
                        {event.title}
                      </Text>
                      <HStack spacing={1} mb={1}>
                        <CalendarIcon color="gray.500" boxSize={3} />
                        <Text fontSize="11px" color="gray.400" noOfLines={1}>
                          {transformISOToDisplayDate(event.startDate, event.startTime)}
                        </Text>
                      </HStack>
                      <HStack spacing={1} mb={2}>
                        <LocationPinIcon />
                        <Text fontSize="11px" color="gray.400" noOfLines={1}>
                          {event.venueName}, {event.city}
                        </Text>
                      </HStack>
                      <HStack spacing={1} mb={4}>
                        <Text fontSize="13px" fontWeight={700} color={isSoldOut ? "gray.500" : "#22c55e"}>
                          {isSoldOut ? "Sold Out" : evaluateStartingPrice(event.ticketTiers || event.tiers)}
                        </Text>
                      </HStack>
                      <Button 
                        bg={isSoldOut ? "#2a2a2a" : "#22c55e"} 
                        color={isSoldOut ? "gray.500" : "black"} 
                        fontWeight={700} 
                        fontSize="12px" 
                        h="36px" 
                        w="100%" 
                        borderRadius="8px" 
                        isDisabled={isSoldOut}
                        _hover={{ bg: isSoldOut ? "#2a2a2a" : "#16a34a" }}
                      >
                        {isSoldOut ? "Sold Out" : "View Details"}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </HStack>
          )}
        </Box>

        {/* ── MADE FOR YOU (ALL PUBLISHED EVENTS) ── */}
        <Box px={{ base: 4, md: 8 }} mt={8}>
          <Text fontWeight={700} fontSize="16px" mb={4}>Made for You</Text>
          {displayPopular.length === 0 ? (
            <Box bg="#1a1a1a" p={8} borderRadius="14px" textAlign="center" border="1px dashed #2a2a2a" w="100%">
              <Text fontSize="13px" color="gray.500">No events found.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {displayPopular.map((ev) => {
                const isSoldOut = checkIfSoldOut(ev.ticketTiers || ev.tiers);
                return (
                  <Box key={ev.id} bg="#1a1a1a" borderRadius="12px" overflow="hidden" border="1px solid #2a2a2a" cursor="pointer" onClick={() => handleCardRedirection(ev.id)}>
                    <HStack spacing={0} align="stretch" h="100%">
                      <Box position="relative" flexShrink={0} w="100px">
                        <Image 
                          src={ev.coverImage || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&q=80"} 
                          alt={ev.title} 
                          w="100px" 
                          h="100%" 
                          objectFit="cover" 
                          minH="110px" 
                          loading="lazy" 
                          filter={isSoldOut ? "grayscale(40%)" : "none"}
                        />
                        <Box position="absolute" bottom={1} left={0} right={0} display="flex" justifyContent="center">
                          <Badge bg={isSoldOut ? "#ef4444" : "#22c55e"} color={isSoldOut ? "white" : "black"} fontSize="9px" px="6px" py="2px" borderRadius="4px" fontWeight={700}>
                            {isSoldOut ? "Sold Out" : "Reserve"}
                          </Badge>
                        </Box>
                      </Box>

                      <Box p={3} flex={1} display="flex" flexDirection="column" justifyContent="center">
                        <Text fontWeight={700} fontSize="14px" mb="2px" noOfLines={1}>{ev.title}</Text>
                        <Text fontSize="11px" color="gray.400" mb="2px">{transformISOToDisplayDate(ev.startDate, ev.startTime)}</Text>
                        <Text fontSize="11px" color="gray.500" mb={2} lineHeight="1.4" noOfLines={1}>{ev.venueName}</Text>
                        <Text fontSize="13px" fontWeight={700} color={isSoldOut ? "gray.500" : "#22c55e"}>
                          {isSoldOut ? "Sold Out" : evaluateStartingPrice(ev.ticketTiers || ev.tiers)}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </Box>

        {/* ── CONSOLIDATED PRODUCTION MARKETPLACE FOOTER LAYER ── */}
        <Box mt={12} px={{ base: 4, md: 8 }} pb={8}>
          <Divider borderColor="#2a2a2a" mb={6} />

          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            gap={6}
            mb={6}
          >
            <VStack spacing={0} align={{ base: "center", md: "flex-start" }}>
              <Text fontSize="11px" color="gray.500" fontWeight={500}>Contact Support</Text>
              <Text fontSize="13px" color="#22c55e" fontWeight="600">vxticket@gmail.com</Text>
            </VStack>

            <HStack spacing={3} justify="center" flexWrap="wrap">
              <Text fontSize="12px" fontWeight={700} color="#f59e0b">MoMo</Text>
              <Text fontSize="12px" color="gray.600">•</Text>
              <Text fontSize="12px" fontWeight={700} color="#3b82f6">USSD</Text>
              <Text fontSize="12px" color="gray.600">•</Text>
              <Text fontSize="12px" fontWeight={700} color="gray.400">Bank Transfer</Text>
              <Text fontSize="12px" color="gray.600">•</Text>
              <Text fontSize="12px" fontWeight={700} color="gray.400">Card</Text>
            </HStack>

            <HStack spacing={5} justify="center">
              <Text fontSize="12px" fontWeight={600} color="gray.400" cursor="pointer" _hover={{ color: "white" }}>Instagram</Text>
              <Text fontSize="12px" fontWeight={600} color="gray.400" cursor="pointer" _hover={{ color: "white" }}>X (Twitter)</Text>
              <Text fontSize="12px" fontWeight={600} color="gray.400" cursor="pointer" _hover={{ color: "white" }}>Facebook</Text>
            </HStack>
          </Flex>

          <Text fontSize="11px" color="gray.600" textAlign="center">
            © 2026 vxTicket Events
          </Text>
        </Box>

      </Box>
    </Box>
  );
}