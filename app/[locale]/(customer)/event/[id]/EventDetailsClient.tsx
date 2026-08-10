'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Flex, Text, Heading, Badge, IconButton,
  Divider, Button, HStack, VStack, Spinner, useToast, Image,
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, 
  DrawerContent, DrawerCloseButton, FormControl, FormLabel, Input, Select,
  Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react'

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

interface ClientContainerProps {
  initialEvent: any;
}

export default function DynamicEventDetailsContainer({ initialEvent }: ClientContainerProps) {
  const toast = useToast()
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'en'

  const [event] = useState<any>(initialEvent)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    initialEvent.tiers && initialEvent.tiers.length > 0 ? initialEvent.tiers[0].id : null
  )
  
  // Carousel State Controllers
  const [activeSlide, setActiveSlide] = useState(0)
  const [mediaGallery, setMediaGallery] = useState<string[]>([])

  // ─── CHECKOUT DRAWER STATE CONTROLLERS ──────────────────────────────────────
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutQuantity, setCheckoutQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [momoProvider, setMomoProvider] = useState("MTN")
  const [momoNumber, setMomoNumber] = useState("")
  const [isBooking, setIsBooking] = useState(false)

  // Populate gallery instantly from pre-fetched properties
  useEffect(() => {
    if (event) {
      const imagesPool: string[] = [];
      if (event.coverImage) imagesPool.push(event.coverImage);
      if (event.gallery && Array.isArray(event.gallery)) {
        event.gallery.forEach((img: string) => {
          if (img && !imagesPool.includes(img)) imagesPool.push(img);
        });
      }
      if (imagesPool.length === 0) imagesPool.push("https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80");
      setMediaGallery(imagesPool);
    }
  }, [event]);

  // Carousel slider intervals
  useEffect(() => {
    if (mediaGallery.length <= 1) return;
    
    const sliderInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % mediaGallery.length);
    }, 4000);

    return () => clearInterval(sliderInterval);
  }, [mediaGallery]);

  const resolveCurrencyMetrics = () => {
    if (!event) return { code: "GHS", symbol: "₵" };
    const localeString = `${event.city} ${event.address} ${event.venueName}`.toLowerCase();
    
    if (localeString.includes("nigeria") || localeString.includes("lagos") || localeString.includes("abuja")) {
      return { code: "NGN", symbol: "₦" };
    }
    return { code: "GHS", symbol: "₵" };
  };

  const currency = resolveCurrencyMetrics();

  const handleShareEvent = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link Copied!",
        description: "Link copied to clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (err) {
      console.error("Clipboard routing fault:", err);
    }
  };

  const transformISOToDisplayDate = (isoString: string) => {
    if (!isoString) return "Date Pending"
    const dateInstance = new Date(isoString)
    return dateInstance.toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  };

  const handleManualSlideNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setActiveSlide((prev) => (prev === 0 ? mediaGallery.length - 1 : prev - 1));
    } else {
      setActiveSlide((prev) => (prev + 1) % mediaGallery.length);
    }
  };

  const activeSelectedTier = event.tiers?.find((t: any) => t.id === selectedTierId)
  
  // ─── CAPACITY CALCULATION & ALERT BANNER LOGIC ─────────────────────────────
  const isTierSoldOut = activeSelectedTier && activeSelectedTier.capacity !== null && (activeSelectedTier.sold || 0) >= activeSelectedTier.capacity;
  const remainingCapacity = activeSelectedTier && activeSelectedTier.capacity !== null ? activeSelectedTier.capacity - (activeSelectedTier.sold || 0) : null;
  const isRunningLow = remainingCapacity !== null && remainingCapacity > 0 && remainingCapacity <= Math.max(5, Math.ceil(activeSelectedTier.capacity * 0.1));

  const computedDisplayPrice = activeSelectedTier 
    ? (activeSelectedTier.isFree || Number(activeSelectedTier.price) === 0 ? "Free Pass" : `${currency.code} ${Number(activeSelectedTier.price).toFixed(2)}`)
    : "Select Option"

  // ─── CHECKOUT PRICE BREAKDOWN CALCULATIONS ────────────────────────────────
  const ticketBasePrice = activeSelectedTier ? Number(activeSelectedTier.price) : 0
  const grandTotal = ticketBasePrice * checkoutQuantity 
  const securePlatformFee = activeSelectedTier?.isFree ? 0 : grandTotal * 0.07 
  const providerPayout = grandTotal - securePlatformFee 

  // ─── DYNAMIC TICKET ORDER DISPATCHER ──────────────────────────────────────
  const handleFinalizeBooking = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast({
        title: "Information Missing",
        description: "Enter your name and email.",
        status: "warning",
        position: "top"
      });
      return;
    }

    if (!activeSelectedTier?.isFree && !momoNumber.trim()) {
      toast({
        title: "MoMo Details Required",
        description: "Input your Mobile Money phone number to initiate payment.",
        status: "warning",
        position: "top"
      });
      return;
    }

    setIsBooking(true);

    try {
      const orderPayload = {
        eventId: event.id,
        ticketTierName: activeSelectedTier.name,
        quantity: checkoutQuantity,
        totalAmount: grandTotal, 
        currency: currency.code,
        platformFee: securePlatformFee, 
        providerPayout: providerPayout, 
        paymentProvider: activeSelectedTier.isFree ? "Free" : momoProvider,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        momoNumber: activeSelectedTier.isFree ? null : momoNumber.trim()
      };

      const response = await fetch("/api/tickets/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initialize booking.");
      }

      // FREE TICKET FLOW
      if (activeSelectedTier.isFree) {
        setIsCheckoutOpen(false);
        toast({
          title: "Booking Successful!",
          description: "Please wait while your ticket is being generated...",
          status: "success",
          duration: 4000,
          position: "top"
        });
        const targetOrderId = result.orderId;
        router.push(`/${locale}/tickets/${targetOrderId}`);
        return;
      }

      // PAID TICKET FLOW
      if (result.checkoutUrl) {
        toast({
          title: "Redirecting to Paystack...",
          description: "",
          status: "info",
          duration: 3000,
          position: "top"
        });
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("Payment link was not generated properly by the payment gateway.");
      }

    } catch (err: any) {
      console.error("Booking Error:", err);
      toast({
        title: "Booking Failed",
        description: err.message || "Please check your information and try again.",
        status: "error",
        position: "top",
        duration: 4000
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Box minH="100vh" bg="#0d0d0d" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" color="white" pb={{ base: "100px", md: "40px" }}>
      
      <Box maxW="1200px" mx="auto" pt={{ md: "24px" }} px={{ base: "0", md: "24px", lg: "40px" }}>
        
        {/* Desktop Top Nav */}
        <Flex display={{ base: "none", md: "flex" }} justify="space-between" align="center" mb="24px">
          <Button 
            leftIcon={<ArrowLeftIcon />} 
            variant="ghost" 
            color="white" 
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={() => window.location.href = '/en/feed'}
          >
            Back to Events
          </Button>
          <IconButton aria-label="Share" icon={<ShareIcon />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={handleShareEvent} />
        </Flex>

        {/* Hero Gallery Slider Frame */}
        <Box position="relative" h={{ base: "280px", md: "400px", lg: "480px" }} borderRadius={{ base: "0", md: "24px" }} overflow="hidden">
          {mediaGallery.map((imgUrl, idx) => (
            <Image 
              key={idx}
              src={imgUrl}
              alt={event.title || "Event Image Asset"}
              position="absolute" 
              inset="0"
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center center"
              filter="brightness(0.55)"
              opacity={idx === activeSlide ? 1 : 0}
              transition="opacity 0.6s ease-in-out"
              zIndex={idx === activeSlide ? 1 : 0}
            />
          ))}
          
          <Box position="absolute" bottom="0" left="0" right="0" h={{ base: "120px", md: "200px" }}
            bgGradient="linear(to-t, #0d0d0d, transparent)" zIndex={2}
          />
          
          {/* Mobile Overlay Interaction Bar */}
          <Flex display={{ base: "flex", md: "none" }} position="absolute" top="0" left="0" right="0" justify="space-between" align="center" px="16px" pt="14px" zIndex={10}>
            <IconButton aria-label="Go back" icon={<ArrowLeftIcon />} variant="ghost" color="white" size="sm" _hover={{ bg: 'whiteAlpha.200' }} minW="32px" h="32px" onClick={() => window.location.href = '/en/feed'} />
            <IconButton aria-label="Share" icon={<ShareIcon />} variant="ghost" color="white" size="sm" _hover={{ bg: 'whiteAlpha.200' }} minW="32px" h="32px" onClick={handleShareEvent} />
          </Flex>

          {/* Translucent Carousel Overlay Left/Right Chevron Signals */}
          {mediaGallery.length > 1 && (
            <Flex position="absolute" insetX={4} top="50%" transform="translateY(-50%)" justify="space-between" zIndex={5} pointerEvents="none">
              <IconButton aria-label="Previous slide" icon={<ChevronLeftIcon />} size="sm" variant="unstyled" display="flex" alignItems="center" justifyContent="center" bg="blackAlpha.400" borderRadius="full" pointerEvents="auto" w="36px" h="36px" _hover={{ bg: "blackAlpha.600" }} onClick={() => handleManualSlideNavigation('prev')} />
              <IconButton aria-label="Next slide" icon={<ChevronRightIcon />} size="sm" variant="unstyled" display="flex" alignItems="center" justifyContent="center" bg="blackAlpha.400" borderRadius="full" pointerEvents="auto" w="36px" h="36px" _hover={{ bg: "blackAlpha.600" }} onClick={() => handleManualSlideNavigation('next')} />
            </Flex>
          )}

          <Box position="absolute" bottom={{ base: "24px", md: "40px" }} left={{ base: "16px", md: "40px" }} right={{ base: "16px", md: "40px" }} zIndex={10}>
            {event.isHero && (
              <Badge bg="#7c3aed" color="white" fontSize={{ base: "10px", md: "12px" }} fontWeight="700" letterSpacing="0.08em" px="8px" py="3px" borderRadius="4px" textTransform="uppercase" mb="10px">
                PARTNERED EVENT
              </Badge>
            )}
            <Heading as="h1" fontSize={{ base: "26px", md: "42px", lg: "50px" }} fontWeight="800" color="white" lineHeight="1.1" letterSpacing="-0.5px">
              {event.title}
            </Heading>
          </Box>
        </Box>

        {/* Dynamic Capacity Warning Banner */}
        {isTierSoldOut && (
          <Box px={{ base: "16px", md: "0" }} mt="20px">
            <Alert status="error" bg="rgba(239, 68, 68, 0.15)" border="1.5px solid #ef4444" borderRadius="16px" color="white">
              <AlertIcon color="#ef4444" />
              <Box>
                <AlertTitle fontSize="15px" fontWeight="800">SOLD OUT!</AlertTitle>
                <AlertDescription fontSize="13px" color="gray.300">
                  This ticket tier has reached maximum venue capacity.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        )}

        {!isTierSoldOut && isRunningLow && (
          <Box px={{ base: "16px", md: "0" }} mt="20px">
            <Alert status="warning" bg="rgba(245, 158, 11, 0.15)" border="1.5px solid #f59e0b" borderRadius="16px" color="white">
              <AlertIcon color="#f59e0b" />
              <Box>
                <AlertTitle fontSize="15px" fontWeight="800">FEW TICKETS REMAINING!</AlertTitle>
                <AlertDescription fontSize="13px" color="gray.300">
                  Hurry! Only {remainingCapacity} slots left for {activeSelectedTier?.name}.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Content Split Layout for Desktop */}
        <Flex direction={{ base: "column", md: "row" }} mt={{ base: "0", md: "40px" }} gap={{ base: "0", md: "40px", lg: "64px" }}>
          
          {/* LEFT COLUMN: Data Matrix Blocks */}
          <Box flex="1" px={{ base: "16px", md: "0" }}>
            
            {/* Meta Parameters Info */}
            <Box mt={{ base: "18px", md: "0" }}>
              <Text fontSize={{ base: "13px", md: "15px" }} fontWeight="700" color="#22c55e" letterSpacing="0.06em" textTransform="uppercase" mb="12px">
                {event.category || "General Gathering"}
              </Text>
              <VStack align="start" spacing="10px" mb="16px">
                <HStack spacing="8px">
                  <CalendarIcon />
                  <Text fontSize={{ base: "13px", md: "15px" }} color="#d0d0d0" fontWeight="500">
                    {transformISOToDisplayDate(event.startDate)} {event.endDate ? `to ${transformISOToDisplayDate(event.endDate)}` : ''}
                  </Text>
                </HStack>
                <HStack spacing="8px">
                  <ClockIcon />
                  <Text fontSize={{ base: "13px", md: "15px" }} color="#d0d0d0" fontWeight="500">
                    {event.startTime} {event.endTime ? `– ${event.endTime}` : ''}
                  </Text>
                </HStack>
              </VStack>
              <Box display="inline-flex" alignItems="flex-start" gap="8px" bg="#1a1a1a" border="1px solid #2a2a2a" borderRadius="10px" px="14px" py="10px" mt="4px" maxW="100%">
                <Box mt="3px"><LocationIcon /></Box>
                <VStack align="start" spacing="1px">
                  <Text fontSize={{ base: "13px", md: "14px" }} color="white" fontWeight="600">{event.venueName}</Text>
                  <Text fontSize="12px" color="gray.400">{event.address}, {event.city}</Text>
                </VStack>
              </Box>
            </Box>

            <Divider borderColor="#1e1e1e" my="24px" />

            {/* About Narrative Text Block */}
            <Box>
              <Heading as="h2" fontSize={{ base: "18px", md: "22px" }} fontWeight="700" color="white" mb="12px">About this event</Heading>
              <Text fontSize={{ base: "14px", md: "16px" }} color="#a0a0a0" lineHeight="1.65" whiteSpace="pre-line">
                {event.description || "No description provided by host."}
              </Text>
            </Box>

            {/* Dynamic Lineup Tracking Area */}
            {event.lineup && event.lineup.length > 0 && (
              <>
                <Divider borderColor="#1e1e1e" my="24px" />
                <Box>
                  <Heading as="h2" fontSize={{ base: "18px", md: "22px" }} fontWeight="700" color="white" mb="16px">Event Lineup</Heading>
                  <VStack spacing="0" align="stretch">
                    {event.lineup.map((artist: any, index: number) => (
                      <Box key={artist.id || index}>
                        <Flex align="center" justify="space-between" py="13px">
                          <HStack spacing="16px">
                            {artist.imageUrl && (
                              <Box w="56px" h="56px" borderRadius="full" overflow="hidden" flexShrink={0} border="2px solid #2a2a2a">
                                <img src={artist.imageUrl} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </Box>
                            )}
                            <VStack align="start" spacing="2px">
                              <Text fontSize={{ base: "15px", md: "16px" }} fontWeight="600" color="white" lineHeight="1.2">{artist.name}</Text>
                              <Text fontSize={{ base: "12px", md: "14px" }} color="#888">{artist.role || "Performer"}</Text>
                            </VStack>
                          </HStack>
                        </Flex>
                        {index < event.lineup.length - 1 && <Divider borderColor="#1e1e1e" />}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

          </Box>

          {/* RIGHT COLUMN: Interactive Tier Options Card Selector */}
          <Box w={{ base: "100%", md: "380px", lg: "420px" }} px={{ base: "16px", md: "0" }} mt={{ base: "32px", md: "0" }}>
            <Box position={{ md: "sticky" }} top={{ md: "24px" }}>
              
              <Box bg={{ md: "#121212" }} border={{ md: "1px solid #1e1e1e" }} borderRadius={{ md: "20px" }} p={{ md: "24px" }}>
                <Heading as="h2" fontSize="18px" fontWeight="700" color="white" mb="16px">Ticket Options</Heading>
                
                {!event.tiers || event.tiers.length === 0 ? (
                  <Box bg="#1a1a1a" p={4} borderRadius="12px" textAlign="center">
                    <Text fontSize="13px" color="gray.500">No ticket option configured for checkout.</Text>
                  </Box>
                ) : (
                  <VStack spacing="12px" align="stretch" mb="24px">
                    {event.tiers.map((tier: any) => {
                      const isSelected = selectedTierId === tier.id;
                      const isSoldOut = tier.capacity !== null && (tier.sold || 0) >= tier.capacity;
                      return (
                        <Box 
                          key={tier.id}
                          bg="#1a1a1a" 
                          border={isSelected ? "2px solid #22c55e" : "1px solid #2a2a2a"} 
                          borderRadius="14px" 
                          px="16px" 
                          py="16px" 
                          cursor={isSoldOut ? "not-allowed" : "pointer"} 
                          opacity={isSoldOut ? 0.6 : 1}
                          onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
                          transition="all 0.15s"
                        >
                          <Flex justify="space-between" align="flex-start">
                            <Box pr="16px">
                              <HStack spacing="8px" mb="4px">
                                <Text fontSize="15px" fontWeight="700" color="white">{tier.name}</Text>
                                {isSoldOut && <Badge colorScheme="red" fontSize="10px">SOLD OUT</Badge>}
                              </HStack>
                              {tier.description && <Text fontSize="12px" color="#888" lineHeight="1.4">{tier.description}</Text>}
                            </Box>
                            <Box textAlign="right" flexShrink={0}>
                              <Text fontSize="16px" fontWeight="800" color="#22c55e" lineHeight="1">
                                {tier.isFree || Number(tier.price) === 0 ? "Free" : `${currency.symbol}${Number(tier.price)}`}
                              </Text>
                              <Text fontSize="11px" color="#666" mt="4px">per pass</Text>
                            </Box>
                          </Flex>
                        </Box>
                      )
                    })}
                  </VStack>
                )}

                {/* Desktop Ticket Purchase Footer */}
                {event.tiers && event.tiers.length > 0 && (
                  <Box display={{ base: "none", md: "block" }}>
                    <Flex justify="space-between" align="end" mb="16px">
                      <Box>
                        <Text fontSize="13px" color="#888" mb="4px">Total Amount</Text>
                        <Text fontSize="26px" fontWeight="800" color="white" lineHeight="1">{computedDisplayPrice}</Text>
                      </Box>
                    </Flex>
                    <Button 
                      w="100%" 
                      bg="#22c55e" 
                      color="black" 
                      _hover={{ bg: '#16a34a' }} 
                      borderRadius="12px" 
                      fontSize="16px" 
                      fontWeight="700" 
                      h="56px" 
                      isDisabled={isTierSoldOut}
                      onClick={() => setIsCheckoutOpen(true)}
                    >
                      {isTierSoldOut ? "Sold Out" : "Book Ticket"}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Verified Host Curation Block */}
              <Box mt="24px" bg={{ md: "#121212" }} border={{ md: "1px solid #1e1e1e" }} borderRadius={{ md: "20px" }} p={{ md: "24px" }}>
                <Text fontSize="13px" color="#888" fontWeight="500" mb="12px">Hosted By</Text>
                <HStack spacing="12px" mb="16px">
                  <Box w="48px" h="48px" borderRadius="full" flexShrink={0} bgGradient="linear(135deg, #16a34a, #22c55e)" display="flex" alignItems="center" justifyContent="center">
                    <Text fontWeight="800" color="black" fontSize="14px">VT</Text>
                  </Box>
                  <Box>
                    <Text fontSize="16px" fontWeight="600" color="white">{event.host || "Verified Partner"}</Text>
                    <Text fontSize="12px" color="gray.500">ID Reference: {event.providerId ? event.providerId.substring(0, 8).toUpperCase() : 'PLATFORM'}</Text>
                  </Box>
                </HStack>
                
                {event.customField1 && (
                  <HStack spacing="10px">
                    <Button flex="1" leftIcon={<PhoneIcon />} size="sm" bg="#1a1a1a" color="white" border="1px solid #2a2a2a" borderRadius="10px" fontSize="13px" fontWeight="500" h="40px" _hover={{ bg: '#252525' }}>
                      Contact Organizers
                    </Button>
                    <Button flex="1" size="sm" bg="#1a1a1a" color="white" border="1px solid #2a2a2a" borderRadius="10px" fontSize="13px" fontWeight="500" h="40px" _hover={{ bg: '#252525' }}>
                      {event.customField1}
                    </Button>
                  </HStack>
                )}
              </Box>

            </Box>
          </Box>
        </Flex>
      </Box>

      {/* Mobile Bottom Checkout Bar Element */}
      {event.tiers && event.tiers.length > 0 && (
        <Box display={{ base: "block", md: "none" }} position="fixed" bottom="0" left="0" right="0" w="100%" bg="#0d0d0d" borderTop="1px solid #1e1e1e" px="16px" py="16px" zIndex={100} pb="max(16px, env(safe-area-inset-bottom))">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="12px" color="#888" mb={1}>Total Amount</Text>
              <Text fontSize="20px" fontWeight="800" color="white" lineHeight="1">{computedDisplayPrice}</Text>
            </Box>
            <Button 
              bg="#22c55e" 
              color="black" 
              _hover={{ bg: '#16a34a' }} 
              borderRadius="12px" 
              fontSize="15px" 
              fontWeight="700" 
              h="48px" 
              px="32px" 
              isDisabled={isTierSoldOut}
              onClick={() => setIsCheckoutOpen(true)}
            >
              {isTierSoldOut ? "Sold Out" : "Book Ticket"}
            </Button>
          </Flex>
        </Box>
      )}

      {/* ─── 🛡️ DYNAMIC VIEWPORT FULL-HEIGHT CHECKOUT DRAWER ────────────────── */}
      <Drawer 
        isOpen={isCheckoutOpen} 
        placement="bottom" 
        onClose={() => setIsCheckoutOpen(false)} 
        size="full"
      >
        <DrawerOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
        <DrawerContent 
          bg="#121212" 
          color="white" 
          borderTop={{ base: "1px solid #222", md: "none" }}
          borderLeft={{ base: "none", md: "1px solid #222" }}
          maxW={{ md: "460px" }} 
          ml={{ md: "auto" }}
          display="flex" 
          flexDirection="column" 
          h={{ base: "100dvh", md: "100vh" }}
          maxH={{ base: "100dvh", md: "100vh" }}
        >
          <DrawerCloseButton color="gray.400" _hover={{ color: "white" }} top="18px" right="18px" />
          
          <DrawerHeader borderBottom="1px solid #222" py="16px" px="24px" flexShrink={0}>
            <Text fontSize="11px" fontWeight="700" color="#22c55e" letterSpacing="1px" textTransform="uppercase" mb="2px">Secure Checkout</Text>
            <Heading size="md" color="white" fontWeight="800">Review & Booking</Heading>
          </DrawerHeader>

          <DrawerBody 
            flex="1" 
            overflowY="auto" 
            px="24px" 
            py="20px" 
            css={{ 
              '&::-webkit-scrollbar': { width: '4px' }, 
              '&::-webkit-scrollbar-thumb': { background: '#222', borderRadius: '4px' } 
            }}
          >
            {activeSelectedTier ? (
              <VStack spacing="20px" align="stretch">
                
                {/* Stage 1: Selected Tier Summary */}
                <Box bg="#1a1a1a" border="1px solid #2a2a2a" borderRadius="16px" p="16px">
                  <Text fontSize="11px" fontWeight="700" color="gray.500" mb="8px" letterSpacing="0.5px">SELECTED ENTRY TICKET</Text>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="800" fontSize="16px" color="white" mb="2px">{activeSelectedTier.name}</Text>
                      {activeSelectedTier.description && (
                        <Text fontSize="11px" color="gray.400" pr="8px" noOfLines={1}>{activeSelectedTier.description}</Text>
                      )}
                    </Box>
                    <Badge bg="rgba(34,197,94,0.15)" color="#22c55e" fontSize="14px" fontWeight="800" px="10px" py="4px" borderRadius="8px">
                      {activeSelectedTier.isFree || Number(activeSelectedTier.price) === 0 ? "Free" : `${currency.symbol}${activeSelectedTier.price}`}
                    </Badge>
                  </Flex>
                </Box>

                {/* Stage 2: Ticket Quantity Selector (+ / - Buttons) */}
                <FormControl>
                  <FormLabel fontSize="12px" fontWeight="700" color="gray.400" mb="8px" letterSpacing="0.5px">SELECT TICKET QUANTITY</FormLabel>
                  <HStack maxW="160px" bg="#1a1a1a" border="1.5px solid #2a2a2a" borderRadius="12px" p="6px" justify="space-between">
                    <Button 
                      size="sm" 
                      w="36px" 
                      h="36px" 
                      bg="#262626" 
                      color="white" 
                      fontSize="18px"
                      fontWeight="700"
                      _hover={{ bg: "#333" }} 
                      _active={{ bg: "#1f1f1f" }}
                      onClick={() => setCheckoutQuantity(prev => Math.max(1, prev - 1))} 
                      isDisabled={checkoutQuantity <= 1}
                    >
                      -
                    </Button>
                    <Text fontWeight="800" fontSize="18px" color="white" userSelect="none">{checkoutQuantity}</Text>
                    <Button 
                      size="sm" 
                      w="36px" 
                      h="36px" 
                      bg="#262626" 
                      color="white" 
                      fontSize="18px"
                      fontWeight="700"
                      _hover={{ bg: "#333" }} 
                      _active={{ bg: "#1f1f1f" }}
                      onClick={() => setCheckoutQuantity(prev => Math.min(5, prev + 1))} 
                      isDisabled={checkoutQuantity >= 5}
                    >
                      +
                    </Button>
                  </HStack>
                  <Text fontSize="11px" color="gray.500" mt="6px">Maximum limit of 5 ticket slots per session booking rules.</Text>
                </FormControl>

                <Divider borderColor="#222" />

                {/* Stage 3: Guest Contact details */}
                <VStack spacing="14px" align="stretch">
                  <Text fontSize="12px" fontWeight="700" color="gray.400" letterSpacing="0.5px">CUSTOMER INFORMATION</Text>
                  
                  <FormControl isRequired>
                    <FormLabel fontSize="12px" color="gray.500" mb="4px">Full Name</FormLabel>
                    <Input placeholder="e.g. John Doe" h="46px" bg="#1a1a1a" border="1.5px solid #2a2a2a" borderRadius="10px" _focus={{ borderColor: "#22c55e", boxShadow: "none" }} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="12px" color="gray.500" mb="4px">Email Address</FormLabel>
                    <Input type="email" placeholder="e.g. john@example.com" h="46px" bg="#1a1a1a" border="1.5px solid #2a2a2a" borderRadius="10px" _focus={{ borderColor: "#22c55e", boxShadow: "none" }} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </FormControl>
                </VStack>

                {/* Stage 4: Mobile Money Pay-In Coordinates */}
                {!activeSelectedTier.isFree && (
                  <>
                    <Divider borderColor="#222" />
                    <VStack spacing="14px" align="stretch">
                      <Text fontSize="12px" fontWeight="700" color="gray.400" letterSpacing="0.5px">MOBILE MONEY ROUTING (MoMo)</Text>
                      
                      <FormControl>
                        <FormLabel fontSize="12px" color="gray.500" mb="4px">Network Provider</FormLabel>
                        <Select h="46px" bg="#1a1a1a" border="1.5px solid #2a2a2a" borderRadius="10px" _focus={{ borderColor: "#22c55e", boxShadow: "none" }} value={momoProvider} onChange={(e) => setMomoProvider(e.target.value)}>
                          <option value="MTN" style={{ background: '#1a1a1a' }}>MTN Mobile Money</option>
                          <option value="TELECEL" style={{ background: '#1a1a1a' }}>Telecel Cash</option>
                          <option value="AT" style={{ background: '#1a1a1a' }}>AT Money</option>
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="12px" color="gray.500" mb="4px">Wallet Number</FormLabel>
                        <Input type="tel" placeholder="e.g. 024XXXXXXX" h="46px" bg="#1a1a1a" border="1.5px solid #2a2a2a" borderRadius="10px" _focus={{ borderColor: "#22c55e", boxShadow: "none" }} value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} />
                      </FormControl>
                    </VStack>
                  </>
                )}

                <Divider borderColor="#222" />

                {/* Stage 5: Billing Summary */}
                <VStack spacing="10px" bg="#1a1a1a" p="16px" borderRadius="16px" border="1px solid #2a2a2a" fontSize="13px" align="stretch" mb="12px">
                  <Text fontSize="11px" fontWeight="700" color="gray.500" mb="4px" letterSpacing="0.5px">BILLING SUMMARY</Text>
                  
                  <Flex justify="space-between">
                    <Text color="gray.400">Ticket Price ({checkoutQuantity} pass):</Text>
                    <Text fontWeight="600">{currency.symbol}{grandTotal.toFixed(2)}</Text>
                  </Flex>
                  
                  <Flex justify="space-between">
                    <Text color="gray.400">Booking / Service Fees:</Text>
                    <Text fontWeight="600" color="#22c55e">FREE</Text>
                  </Flex>

                  <Divider borderColor="#2a2a2a" my="4px" />
                  
                  <Flex justify="space-between" align="center" fontSize="15px" fontWeight="800" color="white">
                    <Text>Total Payable Amount:</Text>
                    <Text color="#22c55e">{currency.code} {grandTotal.toFixed(2)}</Text>
                  </Flex>
                </VStack>

              </VStack>
            ) : (
              <Flex justify="center" align="center" minH="200px">
                <Spinner color="#22C55E" />
              </Flex>
            )}
          </DrawerBody>

          {/* 🚀 FIXED FOOTER PINNED TO VISIBLE VIEWPORT */}
          <DrawerFooter 
            borderTop="1px solid #222" 
            py="16px" 
            px="24px" 
            bg="#121212" 
            flexShrink={0}
            pb="max(16px, env(safe-area-inset-bottom))"
          >
            <Button variant="ghost" color="gray.400" _hover={{ bg: "whiteAlpha.100", color: "white" }} mr={3} onClick={() => setIsCheckoutOpen(false)} borderRadius="10px" h="50px" flex="1">
              Cancel
            </Button>
            <Button bg="#22c55e" color="black" _hover={{ bg: '#16a34a' }} h="50px" borderRadius="10px" fontWeight="800" fontSize="15px" flex="2" isLoading={isBooking} loadingText="Completing Order..." onClick={handleFinalizeBooking}>
              {activeSelectedTier?.isFree ? "Claim Free Ticket" : "Pay & Book Now"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

    </Box>
  )
}