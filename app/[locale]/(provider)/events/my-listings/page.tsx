"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Image,
  Badge,
  Icon,
  Avatar,
  Spinner,
  IconButton,
  Heading,
  Button,
  useToast,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";

const fallbackImg =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=120&h=80&fit=crop";

// Inline Back Arrow SVG Icon Component
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ─── RESPONSIVE COMPONENT CARD ──────────────────────────────────────────────
function EventCard({ event }: { event: any }) {
  const handleCardClick = () => {
    // 🚀 Directly cache active selection and route to operational dashboard
    localStorage.setItem("qs_active_event_id", event.id);
    window.location.href = "/en/dashboard";
  };

  // Helper to determine status tag dynamically without strictly labeling everything "LIVE"
  const getDynamicStatusBadge = () => {
    const now = new Date();
    const eventEndDate = event.endDate ? new Date(event.endDate) : null;
    const eventStartDate = event.startDate ? new Date(event.startDate) : null;

    if (eventEndDate && eventEndDate < now) {
      return { label: "ENDED", bg: "rgba(156, 163, 175, 0.12)", color: "#9CA3AF", border: "rgba(156, 163, 175, 0.25)" };
    }
    if (eventStartDate && eventStartDate > now) {
      return { label: "UPCOMING", bg: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", border: "rgba(59, 130, 246, 0.25)" };
    }
    return { label: event.status?.toUpperCase() || "ACTIVE", bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E", border: "rgba(34, 197, 94, 0.25)" };
  };

  const statusBadge = getDynamicStatusBadge();

  return (
    <Flex
      bg="#161616"
      border="1px solid #2A2A2A"
      borderRadius="16px"
      p={{ base: "12px", md: "16px" }}
      align="center"
      gap={{ base: "12px", md: "16px" }}
      w="100%"
      cursor="pointer"
      transition="all 0.15s ease-in-out"
      onClick={handleCardClick}
      _hover={{ bg: "#1A1A1A", borderColor: "#22C55E" }}
    >
      <Image
        src={event.coverImage || fallbackImg}
        alt={event.title || "Event Image"}
        borderRadius="10px"
        w={{ base: "72px", md: "88px" }}
        h={{ base: "52px", md: "64px" }}
        objectFit="cover"
        flexShrink={0}
      />
      <Box flex={1} minW={0}>
        <Flex align="center" gap="10px" wrap="wrap">
          <Text
            color="white"
            fontWeight="700"
            fontSize={{ base: "15px", md: "17px" }}
            lineHeight="1.3"
            noOfLines={1}
          >
            {event.title || "Untitled Event"}
          </Text>
          <Badge
            bg={statusBadge.bg}
            color={statusBadge.color}
            border={`1px solid ${statusBadge.border}`}
            fontSize="10px"
            fontWeight="700"
            borderRadius="6px"
            px="8px"
            py="2px"
            letterSpacing="0.04em"
            textTransform="uppercase"
          >
            {statusBadge.label}
          </Badge>
        </Flex>
        <Text color="#9CA3AF" fontSize={{ base: "13px", md: "14px" }} mt="4px">
          {event.venue || event.venueName || "TBD Location"}
        </Text>
      </Box>
      <Icon as={ChevronRightIcon} color="#4B5563" boxSize={{ base: 5, md: 6 }} flexShrink={0} />
    </Flex>
  );
}

// ─── MAIN RESPONSIVE CORE VIEW PAGE MODULE ───────────────────────────────────
export default function QuickServeEventsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [hostInitials, setHostInitials] = useState("VX");

  useEffect(() => {
    async function fetchProviderListings() {
      let resolvedProviderId = "";

      if (typeof window !== "undefined") {
        const cachedProfile = localStorage.getItem("qs_user_profile");
        if (cachedProfile) {
          try {
            const profile = JSON.parse(cachedProfile);
            if (profile.id) resolvedProviderId = profile.id;
            if (profile.first_name || profile.legal_name) {
              const nameTarget = profile.first_name || profile.legal_name;
              const initials = nameTarget.split(" ").map((n: string) => n[0]).join("").toUpperCase();
              setHostInitials(initials.slice(0, 2));
            }
          } catch (e) {
            console.error("Local context extraction anomaly:", e);
          }
        }
      }

      if (!resolvedProviderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/provider/dashboard?providerId=${resolvedProviderId}`, {
          cache: "no-store"
        });
        if (!response.ok) throw new Error("Could not fetch database records.");
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error("Database connection failure:", err);
        toast({
          title: "Connection Error",
          description: "Could not sync events listing with database.",
          status: "error",
          duration: 4000,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProviderListings();
  }, [toast]);

  return (
    <Box 
      minH="100vh" bg="#0D0D0D" color="white" 
      px={{ base: "16px", md: "40px" }} py={{ base: "32px", md: "56px" }} 
      display="flex" flexDirection="column" alignItems="center"
    >
      <Box w="100%" maxW={{ base: "100%", md: "container.md", lg: "760px" }}>
        
        {/* Navigation Branding Header Row */}
        <Flex align="center" justify="space-between" mb="36px" gap="16px">
          <Flex align="center" gap="16px">
            <IconButton
              aria-label="Return back to dashboard overview"
              icon={<ArrowLeftIcon />}
              variant="ghost"
              color="white"
              borderRadius="full"
              _hover={{ bg: "#161616" }}
              onClick={() => window.location.href = "/en/dashboard"}
            />
            <Box>
              <Heading size="lg" fontWeight="800" letterSpacing="-0.5px">EVENTS LISTED</Heading>
            </Box>
          </Flex>
          <Avatar 
            bg="#22C55E" color="white" name={hostInitials} size="md" 
            fontWeight="800" fontSize="14px" display={{ base: "none", sm: "flex" }} 
          />
        </Flex>

        {/* Dynamic Display Content Viewport */}
        {loading ? (
          <Flex justify="center" align="center" pt="60px">
            <Spinner color="#22C55E" size="lg" thickness="3px" />
          </Flex>
        ) : (
          <VStack spacing="14px" align="stretch">
            {events.length === 0 ? (
              <Box bg="#161616" borderRadius="16px" border="1px solid #2A2A2A" py="56px" px="24px" textAlign="center">
                <Text color="#6B7280" fontSize="14px" fontWeight="600">
                  No listings found.
                </Text>
              </Box>
            ) : (
              events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </VStack>
        )}

        {/* Integrated Clean Navigation Footer Row */}
        <Box mt="56px" borderTop="1px solid #2A2A2A" pt="24px">
          <Flex justify="center" gap="24px" align="center">
            <Button
              variant="link" color="#9CA3AF" fontSize="13px" fontWeight="700"
              _hover={{ color: "#22C55E", textDecoration: "none" }}
              onClick={() => window.location.href = "/en/dashboard"}
            >
              TO DASHBOARD
            </Button>
            <Text color="#2A2A2A" fontWeight="800">|</Text>
            <Button
              variant="link" color="#9CA3AF" fontSize="13px" fontWeight="700"
              _hover={{ color: "#22C55E", textDecoration: "none" }}
              onClick={() => window.location.href = '/en/profile'}
            >
              TO PROFILE
            </Button>
          </Flex>
        </Box>

      </Box>
    </Box>
  );
}