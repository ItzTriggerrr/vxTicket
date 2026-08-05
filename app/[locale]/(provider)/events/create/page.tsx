"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  useToast,
  IconButton,
  Progress,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

// ─── SVG ICONS ──────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface TicketTier {
  name: string;
  price: string;
  capacity: string;
  isFree: boolean; 
  description: string; 
}

interface ArtistLineup {
  name: string;
  role: string; 
}

// ─── 🛡️ CLIENT-SIDE COMPRESSION SHIELD ──────────────────────────────────────
const compressImageOnClient = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas render context failed."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// ─── 🛡️ EXTRA SAFETY: DEEP-SWEEP COMPRESSION FOR EXISTING BASE64 STRINGS ───
const compressBase64IfNeeded = (base64Str: string | null, maxWidth = 1000, quality = 0.6): Promise<string | null> => {
  if (!base64Str) return Promise.resolve(null);
  if (base64Str.length < 200000) return Promise.resolve(base64Str);

  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function CreateEventWizard() {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  
  // Compliance tracking status state variable
  const [isKycVerified, setIsKycVerified] = useState<boolean>(true);

  // ─── FORM STATES ──────────────────────────────────────────────────────────
  const [providerId, setProviderId] = useState<string>(""); 
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [category, setCategory] = useState("EVENTS");
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostContact, setHostContact] = useState(""); 
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { name: "Standard", price: "", capacity: "", isFree: false, description: "" },
  ]);
  const [lineup, setLineup] = useState<ArtistLineup[]>([]);
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);

  const PREDEFINED_CATEGORIES = ["Faith", "Music & Party", "Sports", "Arts & Comedy", "Conference", "Workshop"];

  // ─── 🚀 DYNAMIC SUPABASE DATA REHYDRATION ENGINE ────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedProfile = localStorage.getItem("qs_user_profile");
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          if (profile.id) {
            setProviderId(profile.id);
            // Verify verification parameter fields live against database records
            checkComplianceState(profile.id);
          }
        } catch (err) {
          console.error("Failed to parse local session credentials:", err);
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const eventIdFromUrl = urlParams.get("id");

      if (eventIdFromUrl) {
        setEditingId(eventIdFromUrl);
        rehydrateDraftFromDatabase(eventIdFromUrl);
      }
    }

    async function checkComplianceState(userId: string) {
      try {
        const res = await fetch(`/api/provider/profile?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.isVerified !== "undefined") {
            setIsKycVerified(data.isVerified);
          }
        }
      } catch (err) {
        console.error("Compliance matrix verification read fault:", err);
      }
    }

    async function rehydrateDraftFromDatabase(targetId: string) {
      setIsPageLoading(true);
      try {
        const response = await fetch(`/api/events/manage?id=${targetId}`);
        if (!response.ok) throw new Error("Could not pull existing row context.");
        
        const data = await response.json();
        const event = data.event;

        if (event) {
          if (event.title) setTitle(event.title);
          if (event.category) setCategory(event.category);
          if (event.host) setHostName(event.host);
          if (event.customField1) setHostContact(event.customField1);
          if (event.description) setDescription(event.description);
          if (event.startDate) setStartDate(event.startDate.split("T")[0]);
          if (event.endDate) setEndDate(event.endDate.split("T")[0]);
          if (event.startTime) setStartTime(event.startTime);
          if (event.endTime) setEndTime(event.endTime);
          if (event.venueName) setVenueName(event.venueName);
          if (event.address) setAddress(event.address);
          if (event.city) setCity(event.city);
          
          if (event.coverImage) {
            const loadedImages = [event.coverImage, null, null];
            if (event.gallery && Array.isArray(event.gallery)) {
              if (event.gallery[0]) loadedImages[1] = event.gallery[0];
              if (event.gallery[1]) loadedImages[2] = event.gallery[1];
            }
            setImages(loadedImages);
          }

          if (event.tiers && Array.isArray(event.tiers) && event.tiers.length > 0) {
            setTicketTiers(event.tiers.map((t: any) => ({
              name: t.name,
              price: String(t.price),
              capacity: String(t.capacity),
              isFree: t.isFree || false,
              description: t.description || ""
            })));
          }

          if (event.lineup && Array.isArray(event.lineup)) {
            setLineup(event.lineup.map((a: any) => ({
              name: a.name,
              role: a.role || ""
            })));
          }
        }
      } catch (err) {
        console.error("Compilation fault:", err);
        toast({
          title: "Synchronization Failed",
          description: "Could not access the raw database context for this item.",
          status: "error",
          duration: 4000,
          position: "top"
        });
      } finally {
        setIsPageLoading(false);
      }
    }
  }, [toast]);

  // ─── UTILITY HANDLERS ─────────────────────────────────────────────────────
  const handleAddTier = () => {
    setTicketTiers([...ticketTiers, { name: "", price: "", capacity: "", isFree: false, description: "" }]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length === 1) return;
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof TicketTier, value: any) => {
    const updated = [...ticketTiers];
    (updated[index] as any)[field] = value;
    setTicketTiers(updated);
  };

  const handleAddArtist = () => {
    setLineup([...lineup, { name: "", role: "" }]);
  };

  const handleRemoveArtist = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index));
  };

  const handleArtistChange = (index: number, field: keyof ArtistLineup, value: string) => {
    const updated = [...lineup];
    updated[index][field] = value;
    setLineup(updated);
  };

  const handleImageUploadChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast({
          title: "Optimizing Flyer...",
          description: "Rescaling flyer boundaries and metadata in your browser.",
          status: "info",
          duration: 1500,
          position: "top",
        });

        const compressedBase64 = await compressImageOnClient(file, 1200, 0.7);
        const updatedImages = [...images];
        updatedImages[index] = compressedBase64;
        setImages(updatedImages);
      } catch (err) {
        console.error("Client-side image processing error:", err);
        toast({
          title: "Optimization Failed",
          description: "We couldn't process this image. Please try a different photo.",
          status: "error",
          duration: 4000,
          position: "top",
        });
      }
    }
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedImages = [...images];
    updatedImages[index] = null;
    setImages(updatedImages);
  };

  const validateStepOne = () => {
    return (
      category.trim() && title.trim() && description.trim() && startDate && startTime && endTime && venueName.trim() && address.trim() && city.trim() && hostName.trim() && hostContact.trim()
    );
  };

  const handleNext = () => {
    if (!isKycVerified) return; // Safeguard operational boundary execution
    if (!validateStepOne()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields on this screen, including host profile parameters, before moving forward.",
        status: "error",
        duration: 3000,
        position: "top",
        isClosable: true,
      });
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── 🚀 SERVER DISPATCH TRANSMISSION HUB ──────────────────────────────────
  const submitListing = async () => {
    if (!isKycVerified) return; // Safeguard API network dispatch calls entirely
    if (!providerId) {
      toast({ title: "Authentication Missing", status: "error", position: "top" });
      return;
    }

    if (!validateStepOne()) {
      toast({ title: "Incomplete Listing Parameters", description: "All logistical fields in Step 1 must be filled completely before publishing live.", status: "error", position: "top" });
      return;
    }
    if (!images[0]) {
      toast({ title: "Cover Image Required", description: "Please upload a primary cover flyer in the media matrix before going live.", status: "error", position: "top" });
      return;
    }
    for (let i = 0; i < ticketTiers.length; i++) {
      const tier = ticketTiers[i];
      if (!tier.name.trim() || !tier.capacity.trim() || (!tier.isFree && !tier.price.trim())) {
        toast({ title: "Incomplete Ticket Configurations", description: `Please verify ticket tier #${i + 1}. Name, capacity limits, and price markers cannot be empty.`, status: "error", position: "top" });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const optimizedImages = await Promise.all(
        images.map(img => compressBase64IfNeeded(img, 1000, 0.6))
      );

      const primaryCover = optimizedImages[0] || null;
      const gallerySupportArray = optimizedImages.slice(1).filter((img) => img !== null) as string[];

      const response = await fetch("/api/events/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          providerId: providerId,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          startTime: startTime || null,
          endTime: endTime || null,
          venueName: venueName.trim(),
          address: address.trim(),
          city: city.trim(),
          coverImage: primaryCover,
          gallery: gallerySupportArray,
          status: "PUBLISHED",
          tiers: ticketTiers,
          lineup: lineup, 
          host: hostName.trim(),
          customField1: hostContact.trim() 
        }),
      });

      if (!response.ok) {
        const serverError = await response.json();
        throw new Error(serverError.error || "Failed to finalize database operations.");
      }

      toast({
        title: "Listing Published Successfully!",
        status: "success",
        duration: 3500,
        position: "top",
      });

      window.location.href = "/en/events/my-listings";
    } catch (err: any) {
      console.error("Creation processing fault:", err);
      toast({ 
        title: "Database Sync Refused", 
        description: err?.message || "Unknown execution pipe fault encountered.", 
        status: "error", 
        position: "top" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return <Flex minH="100vh" bg="#0D0D0D" align="center" justify="center"><Spinner color="#22C55E" size="xl" /></Flex>;
  }

  return (
    <Box minH="100vh" bg="#0D0D0D" color="white" px={{ base: "16px", md: "40px" }} py={{ base: "32px", md: "56px" }} display="flex" flexDirection="column" alignItems="center">
      <Box w="100%" maxW={{ base: "100%", md: "container.md", lg: "760px" }}>
        
        {/* Navigation Branding Header */}
        <Flex align="center" gap="16px" mb="28px">
          <IconButton aria-label="Exit wizard" icon={<ArrowLeftIcon />} variant="ghost" color="white" _hover={{ bg: "#1A1A1A" }} onClick={() => window.location.href = "/en/events/my-listings"} />
          <Box>
            <Heading size="lg" fontWeight="800" letterSpacing="-0.5px">
              {editingId ? "Modify Listing" : "Create New Listing"}
            </Heading>
            <Text fontSize="14px" color="#9CA3AF" mt="2px">Configure custom logistics and categories</Text>
          </Box>
        </Flex>

        {/* 🛑 COMPLIANCE STATE BANNER MATRIX GATING */}
        {!isKycVerified && (
          <Alert status="warning" bg="rgba(245, 158, 11, 0.08)" border="1px solid #f59e0b" borderRadius="16px" color="white" mb="32px" p="20px">
            <AlertIcon color="#f59e0b" />
            <Box flex="1">
              <AlertTitle fontSize="15px" fontWeight="700" mb="4px">KYC Verification Missing</AlertTitle>
              <AlertDescription fontSize="13px" color="#D1D5DB" lineHeight="1.5">
                You must fully complete your legal identity validation and configure your settlement payout details before you are permitted to create or publish events.
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
              onClick={() => window.location.href = "/en/profile"}
            >
              Complete Setup
            </Button>
          </Alert>
        )}

        {/* Dynamic Step Tracker */}
        <Box bg="#161616" borderRadius="16px" p="16px" mb="32px" border="1px solid #2A2A2A">
          <Flex justify="space-between" align="center" mb="10px" px="4px">
            <Text fontSize="13px" fontWeight="700" color="#22C55E">STEP {currentStep} OF 2</Text>
            <Text fontSize="13px" fontWeight="600" color="#9CA3AF">
              {currentStep === 1 ? "Essentials, Logistics & Coordinates" : "Pricing, Performers & Media Matrix"}
            </Text>
          </Flex>
          <Progress value={(currentStep / 2) * 100} size="xs" colorScheme="green" bg="#2A2A2A" borderRadius="4px" />
        </Box>

        {/* Form Container */}
        <Box bg="#161616" borderRadius="24px" border="1px solid #2A2A2A" p={{ base: "20px", md: "36px" }} mb="24px">
          
          {currentStep === 1 && (
            <VStack spacing="28px" align="stretch">
              <Box borderBottom="1px solid #2A2A2A" pb="8px">
                <Text fontSize="12px" fontWeight="700" color="#22C55E" letterSpacing="1px">SECTION 01: Event Details</Text>
              </Box>

              <FormControl isDisabled={!isKycVerified}>
                <FormLabel fontSize="14px" fontWeight="600" mb="8px">Event Category</FormLabel>
                <Input placeholder="Type a description..." h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={category} onChange={(e) => setCategory(e.target.value)} />
                <HStack mt="10px" spacing="8px" flexWrap="wrap" gap="6px">
                  {PREDEFINED_CATEGORIES.map((cat) => {
                    const isSelected = category.toLowerCase() === cat.toLowerCase();
                    return (
                      <Button key={cat} isDisabled={!isKycVerified} size="xs" h="30px" px="12px" borderRadius="20px" bg={isSelected ? "rgba(34, 197, 94, 0.15)" : "#1A1A1A"} color={isSelected ? "#22C55E" : "#9CA3AF"} border="1px solid" borderColor={isSelected ? "#22C55E" : "#2A2A2A"} _hover={{ bg: isSelected ? "rgba(34, 197, 94, 0.2)" : "#222" }} onClick={() => setCategory(cat)}>
                        {cat}
                      </Button>
                    );
                  })}
                </HStack>
              </FormControl>

              <FormControl isDisabled={!isKycVerified}>
                <FormLabel fontSize="14px" fontWeight="600" mb="8px">Name of Event</FormLabel>
                <Input placeholder="e.g. vxTicket Summit 2026" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormControl>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="20px">
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">Name Of Host / Provider</FormLabel>
                    <Input placeholder="e.g. vxTicket Studio" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={hostName} onChange={(e) => setHostName(e.target.value)} />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">Host Contact Info (Phone number)</FormLabel>
                    <Input placeholder="e.g. +233 59 845 8741" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={hostContact} onChange={(e) => setHostContact(e.target.value)} />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl isDisabled={!isKycVerified}>
                <FormLabel fontSize="14px" fontWeight="600" mb="8px">Event Description</FormLabel>
                <Textarea placeholder="Describe the experiences, rules, and unique benefits of your event..." minH="110px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormControl>

              <Box borderBottom="1px solid #2A2A2A" pb="8px" pt="8px">
                <Text fontSize="12px" fontWeight="700" color="#22C55E" letterSpacing="1px">SECTION 02: DATE AND TIME</Text>
              </Box>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="20px">
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">Start Date</FormLabel>
                    <Input type="date" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} css={{ "::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">End Date (Optional)</FormLabel>
                    <Input type="date" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} css={{ "::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </FormControl>
                </GridItem>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="20px">
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">Opening Time</FormLabel>
                    <Input type="time" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} css={{ "::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">Closing Time</FormLabel>
                    <Input type="time" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} css={{ "::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </FormControl>
                </GridItem>
              </Grid>

              <Box borderBottom="1px solid #2A2A2A" pb="8px" pt="8px">
                <Text fontSize="12px" fontWeight="700" color="#22C55E" letterSpacing="1px">SECTION 03: LOCATION</Text>
              </Box>

              <FormControl isDisabled={!isKycVerified}>
                <FormLabel fontSize="14px" fontWeight="600" mb="8px">Venue</FormLabel>
                <Input placeholder="e.g. Grand Arena, Conference Centre" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={venueName} onChange={(e) => setVenueName(e.target.value)} />
              </FormControl>

              <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="20px">
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">Street Address</FormLabel>
                    <Input placeholder="e.g. 14 Castle Road, Osu" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isDisabled={!isKycVerified}>
                    <FormLabel fontSize="14px" fontWeight="600" mb="8px">City or Region</FormLabel>
                    <Input placeholder="e.g. Accra" h="52px" bg="#1A1A1A" border="1.5px solid #2A2A2A" borderRadius="12px" _focus={{ borderColor: "#22C55E", boxShadow: "none" }} value={city} onChange={(e) => setCity(e.target.value)} />
                  </FormControl>
                </GridItem>
              </Grid>
            </VStack>
          )}

          {currentStep === 2 && (
            <VStack spacing="32px" align="stretch">
              {/* SECTION 04: PRICE CATEGORIES WITH EXPANDED DETAILS */}
              <Box>
                <Flex justify="space-between" align="center" mb="14px" borderBottom="1px solid #2A2A2A" pb="8px">
                  <Text fontSize="12px" fontWeight="700" color="#22C55E" letterSpacing="1px">SECTION 04: PRICE CATEGORY</Text>
                  <Button isDisabled={!isKycVerified} leftIcon={<PlusIcon />} size="xs" bg="#1A1A1A" border="1px solid #2A2A2A" color="white" _hover={{ bg: "#252525" }} onClick={handleAddTier}>Add Tier</Button>
                </Flex>
                <VStack spacing="16px" align="stretch">
                  {ticketTiers.map((tier, idx) => (
                    <Box key={idx} bg="#1A1A1A" p="16px" borderRadius="14px" border="1px solid #2A2A2A">
                      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1.2fr 1.2fr 0.4fr" }} gap="12px" alignItems="center" mb="12px">
                        <GridItem>
                          <FormControl isDisabled={!isKycVerified}>
                            <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Tier Name</FormLabel>
                            <Input placeholder="e.g. VIP Pass" h="44px" bg="#0D0D0D" border="1px solid #2A2A2A" value={tier.name} onChange={(e) => handleTierChange(idx, "name", e.target.value)} />
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl isDisabled={!isKycVerified}>
                            <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Paid or Free</FormLabel>
                            <Button isDisabled={!isKycVerified} size="sm" h="44px" w="100%" bg={tier.isFree ? "rgba(34, 197, 94, 0.15)" : "#0D0D0D"} border="1px solid" borderColor={tier.isFree ? "#22C55E" : "#2A2A2A"} color={tier.isFree ? "#22C55E" : "#9CA3AF"} onClick={() => { const nextState = !tier.isFree; handleTierChange(idx, "isFree", nextState); handleTierChange(idx, "price", nextState ? "0" : ""); }}>
                              {tier.isFree ? "Free Pass" : "Paid Entry"}
                            </Button>
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl isDisabled={!isKycVerified || tier.isFree}>
                            <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Price Tag</FormLabel>
                            <Input placeholder="150" type="number" h="44px" bg="#0D0D0D" border="1px solid #2A2A2A" value={tier.isFree ? "" : tier.price} isDisabled={tier.isFree || !isKycVerified} onChange={(e) => handleTierChange(idx, "price", e.target.value)} />
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl isDisabled={!isKycVerified}>
                            <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Capacity Limit</FormLabel>
                            <Input placeholder="200" type="number" h="44px" bg="#0D0D0D" border="1px solid #2A2A2A" value={tier.capacity} onChange={(e) => handleTierChange(idx, "capacity", e.target.value)} />
                          </FormControl>                  
                        </GridItem>
                        <GridItem display="flex" justifyContent="center" pt="16px">
                          <IconButton aria-label="Delete tier" icon={<TrashIcon />} size="sm" bg="transparent" color="#EF4444" onClick={() => handleRemoveTier(idx)} isDisabled={ticketTiers.length === 1 || !isKycVerified} />
                        </GridItem>
                      </Grid>
                      <FormControl isDisabled={!isKycVerified}>
                        <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Tier Description / Included Perks</FormLabel>
                        <Input placeholder="e.g. Complimentary drinks, Front row seating access, Commemorative lanyard..." h="40px" bg="#0D0D0D" border="1px solid #2A2A2A" _focus={{ borderColor: "#22C55E" }} value={tier.description} onChange={(e) => handleTierChange(idx, "description", e.target.value)} />
                      </FormControl>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* SECTION 04.5: EVENT LINEUP & ARTISTS */}
              <Box>
                <Flex justify="space-between" align="center" mb="14px" borderBottom="1px solid #2A2A2A" pb="8px">
                  <Text fontSize="12px" fontWeight="700" color="#22C55E" letterSpacing="1px">SECTION 05: EVENT LINEUP / PERFORMERS</Text>
                  <Button isDisabled={!isKycVerified} leftIcon={<PlusIcon />} size="xs" bg="#1A1A1A" border="1px solid #2A2A2A" color="white" _hover={{ bg: "#252525" }} onClick={handleAddArtist}>Add Performer</Button>
                </Flex>
                <VStack spacing="12px" align="stretch">
                  {lineup.length === 0 ? (
                    <Box py="12px" px="4px">
                      <Text fontSize="13px" color="gray.500" fontStyle="italic">No specific guest artists or performers configured yet.</Text>
                    </Box>
                  ) : (
                    lineup.map((artist, idx) => (
                      <Grid key={idx} templateColumns={{ base: "1fr", md: "2fr 3fr 0.4fr" }} gap="12px" bg="#1A1A1A" p="16px" borderRadius="14px" border="1px solid #2A2A2A" alignItems="center">
                        <GridItem>
                          <FormControl isDisabled={!isKycVerified}>
                            <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Artist / Performer Name</FormLabel>
                            <Input placeholder="e.g. Guest Speaker / Artist" h="44px" bg="#0D0D0D" border="1px solid #2A2A2A" value={artist.name} onChange={(e) => handleArtistChange(idx, "name", e.target.value)} />
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl isDisabled={!isKycVerified}>
                            <FormLabel fontSize="11px" fontWeight="600" color="#9CA3AF" mb="4px">Brief Description of Artist</FormLabel>
                            <Input placeholder="e.g. Opening Keynote / Multi-award winning headliner..." h="44px" bg="#0D0D0D" border="1px solid #2A2A2A" value={artist.role} onChange={(e) => handleArtistChange(idx, "role", e.target.value)} />
                          </FormControl>
                        </GridItem>
                        <GridItem display="flex" justifyContent="center" pt="16px">
                          <IconButton aria-label="Delete performer" icon={<TrashIcon />} size="sm" bg="transparent" color="#EF4444" onClick={() => handleRemoveArtist(idx)} isDisabled={!isKycVerified} />
                        </GridItem>
                      </Grid>
                    ))
                  )}
                </VStack>
              </Box>

              {/* SECTION 05: MEDIA UPLOAD GALLERY */}
              <Box>
                <Box borderBottom="1px solid #2A2A2A" pb="8px" mb="14px">
                  <Text fontSize="12px" fontWeight="700" color="#22C55E" letterSpacing="1px">SECTION 06: MEDIA UPLOAD GALLERY (MAX 3)</Text>
                </Box>
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="14px">
                  {images.map((imgSrc, idx) => (
                    <GridItem key={idx}>
                      <Box position="relative" h="140px" bg="#1A1A1A" border={imgSrc ? "1.5px solid #2A2A2A" : "2px dashed #2A2A2A"} borderRadius="14px" display="flex" alignItems="center" justifyContent="center" cursor={isKycVerified ? "pointer" : "not-allowed"} overflow="hidden" onClick={() => isKycVerified && document.getElementById(`file-upload-${idx}`)?.click()}>
                        {imgSrc ? (
                          <>
                            <Box w="100%" h="100%" style={{ backgroundImage: `url('${imgSrc}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
                            {isKycVerified && <Box position="absolute" top="8px" right="8px" bg="rgba(0,0,0,0.75)" p="6px" borderRadius="full" onClick={(e) => handleRemoveImage(idx, e)}><TrashIcon /></Box>}
                          </>
                        ) : (
                          <VStack spacing="6px" color="rgba(255,255,255,0.35)">
                            <UploadIcon />
                            <Text fontSize="10px" fontWeight="700">{idx === 0 ? "PRIMARY COVER FLYER" : `COMPLIMENTARY PHOTO 0${idx + 1}`}</Text>
                          </VStack>
                        )}
                        <input id={`file-upload-${idx}`} type="file" accept="image/*" style={{ display: "none" }} disabled={!isKycVerified} onChange={(e) => handleImageUploadChange(idx, e)} />
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
              </Box>

              {/* EVENT RECAP PREVIEW SUMMARY */}
              <Box borderTop="1px solid #2A2A2A" pt="24px">
                <Text fontSize="13px" fontWeight="700" color="#9CA3AF" mb="12px">EVENT SUMMARY</Text>
                <Grid templateColumns="1fr 1fr" gap="10px" bg="#1A1A1A" p="20px" borderRadius="16px" border="1px solid #2A2A2A" fontSize="13px">
                  <GridItem><Text color="rgba(255,255,255,0.45)">Event Category:</Text></GridItem>
                  <GridItem><Text fontWeight="600" textAlign="right">{category || "Unspecified"}</Text></GridItem>
                  <GridItem><Text color="rgba(255,255,255,0.45)">Event Name:</Text></GridItem>
                  <GridItem><Text fontWeight="600" textAlign="right">{title || "Incomplete"}</Text></GridItem>
                  <GridItem><Text color="rgba(255,255,255,0.45)">Host Profile & Contact:</Text></GridItem>
                  <GridItem><Text fontWeight="600" textAlign="right" noOfLines={1}>{hostName || "Unset"} ({hostContact || "No Phone"})</Text></GridItem>
                  <GridItem><Text color="rgba(255,255,255,0.45)">Logistical Schedule:</Text></GridItem>
                  <GridItem><Text fontWeight="600" textAlign="right">{startDate || "Unset"} @ {startTime || "Unset"}</Text></GridItem>
                  <GridItem><Text color="rgba(255,255,255,0.45)">Total Target Lineup:</Text></GridItem>
                  <GridItem><Text fontWeight="600" textAlign="right">{lineup.length} listed performers</Text></GridItem>
                  <GridItem><Text color="rgba(255,255,255,0.45)">Event Location:</Text></GridItem>
                  <GridItem><Text fontWeight="600" textAlign="right" noOfLines={1}>{venueName || "Unset"}, {city}</Text></GridItem>
                </Grid>
              </Box>
            </VStack>
          )}

        </Box>

        {/* Floating Navigation Controls */}
        <Flex justify="flex-end" align="center" gap="12px" direction={{ base: "column-reverse", md: "row" }}>
          <HStack spacing="12px" w={{ base: "100%", md: "auto" }}>
            {currentStep === 2 && <Button h="54px" px="28px" bg="#1A1A1A" border="1px solid #2A2A2A" color="white" borderRadius="50px" onClick={handleBack} isDisabled={isSubmitting}>Back</Button>}
            {currentStep === 1 ? (
              <Button isDisabled={!isKycVerified} w={{ base: "100%", md: "auto" }} h="54px" px="40px" bg="#22C55E" color="white" _hover={{ bg: "#16a34a" }} borderRadius="50px" fontWeight="700" onClick={handleNext}>Continue to Pricing</Button>
            ) : (
              <Button isDisabled={!isKycVerified} w={{ base: "100%", md: "auto" }} h="54px" px="40px" bg="#22C55E" color="white" _hover={{ bg: "#16a34a" }} borderRadius="50px" fontWeight="800" isLoading={isSubmitting} loadingText="Publishing Event..." onClick={submitListing}>Publish Listing</Button>
            )}
          </HStack>
        </Flex>

      </Box>
    </Box>
  );
}