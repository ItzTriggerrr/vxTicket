"use client";

import React, { useRef, useState } from "react";
import { notFound } from "next/navigation";
import { toPng } from "html-to-image";
import {
  Box, Flex, Text, Heading, VStack, HStack, Button, Badge, Spinner
} from "@chakra-ui/react";

interface TicketPageProps {
  params: {
    locale: string;
    manualCode: string;
  };
}

// 🎨 3-COLOR THEME CONFIGURATION (Green, Royal Blue, Amber/Orange)
const TICKET_THEMES = [
  { name: "green", primary: "#22c55e", bgSoft: "rgba(34,197,94,0.1)", text: "#16a34a" },
  { name: "blue", primary: "#2563eb", bgSoft: "rgba(37,99,235,0.1)", text: "#1d4ed8" },
  { name: "orange", primary: "#d97706", bgSoft: "rgba(217,119,6,0.1)", text: "#b45309" },
];

export default function TicketReceiptPage({ params }: TicketPageProps) {
  const { manualCode, locale } = params;
  
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchOrder() {
      if (!manualCode) return;
      try {
        const res = await fetch(`/api/tickets/${manualCode.toLowerCase().trim()}`);
        if (!res.ok) throw new Error("Ticket not found");
        const json = await res.json();
        
        if (json.success && json.data) {
          setOrder(json.data);
        } else {
          throw new Error("Invalid data structure received");
        }
      } catch (err) {
        console.error("Failed fetching entry ticket pass:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [manualCode]);

  if (loading) {
    return (
      <Flex minH="100vh" bg="#0d0d0d" align="center" justify="center">
        <Spinner color="#22c55e" size="xl" thickness="4px" />
      </Flex>
    );
  }

  if (!order) {
    return notFound();
  }

  // 🔄 Deterministically cycle through the 3 color themes based on code string
  const themeIndex = Math.abs(
    (order.manualCode || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  ) % 3;
  const currentTheme = TICKET_THEMES[themeIndex];

  // Render high-contrast black QR on white background matching ticket theme
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${order.manualCode}&color=000000&bgcolor=ffffff`;

  const handleSaveToDevice = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);

    try {
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        style: {
          transform: "scale(1)",
        }
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `Ticket_${order.manualCode}_${(order.event?.title || "Pass").replace(/[^a-z0-9]/gi, "_")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error saving image layer:", error);
    } finally {
      setDownloading(false);
    }
  };

  const formattedDateString = order.event?.startDate 
    ? new Date(order.event.startDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "2-digit" })
    : (order.event?.date ? new Date(order.event.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "2-digit" }) : "TBD");

  return (
    <Flex minH="100vh" bg="#0d0d0d" color="white" align="center" justify="center" px="16px" py="40px" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
      <Box maxW="400px" w="100%" textAlign="center">
        
        <Box mb="20px">
          <Badge bg={currentTheme.bgSoft} color={currentTheme.primary} px="12px" py="6px" borderRadius="10px" fontSize="11px" fontWeight="800" mb="8px" letterSpacing="1px" textTransform="uppercase">
            ORDER SECURED
          </Badge>
          <Heading as="h1" size="md" fontWeight="800" color="white">Your Ticket Pass</Heading>
          <Text fontSize="13px" color="gray.500" mt="4px">Save ticket to your device for entrance check-in.</Text>
        </Box>

        {/* 🎟️ WHITE STUB TICKET CONTAINER */}
        <Box 
          ref={ticketRef}
          bg="#FFFFFF" 
          color="#111827"
          borderRadius="24px" 
          p="24px" 
          position="relative" 
          overflow="hidden"
          boxShadow="0px 12px 35px rgba(0,0,0,0.6)"
          textAlign="left"
        >
          {/* HEADER EVENT TITLE */}
          <Text fontSize="12px" fontWeight="800" color={currentTheme.primary} letterSpacing="1px" textAlign="center" textTransform="uppercase" mb="16px">
            {order.event?.title || "BARCAMP ACCRA 2024"}
          </Text>

          {/* LOGO & QR SECTION */}
          <Flex justify="space-between" align="center" mb="20px">
            <VStack align="start" spacing="0">
              <HStack spacing="6px" align="center">
                <Box w="22px" h="22px" bg={currentTheme.primary} borderRadius="6px" display="flex" alignItems="center" justifyContent="center">
                  <Text color="white" fontWeight="900" fontSize="13px">✓</Text>
                </Box>
                <Text fontSize="20px" fontWeight="900" color="#111827" letterSpacing="-0.5px">vxTicket</Text>
              </HStack>
              <Text fontSize="11px" color="#6B7280" fontWeight="600" ml="28px">by QuickServe</Text>
            </VStack>

            <Box w="85px" h="85px" flexShrink={0}>
              <img src={qrCodeUrl} alt="QR Code Pass" style={{ width: "100%", height: "100%", borderRadius: "4px" }} />
            </Box>
          </Flex>

          {/* DASHED SEPARATOR LINE 1 */}
          <Box borderTop="2px dashed" borderColor={currentTheme.primary} opacity={0.5} my="16px" />

          {/* MIDDLE METADATA GRID */}
          <VStack spacing="14px" align="stretch">
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="11px" color="#6B7280" fontWeight="600">Price</Text>
                <Text fontSize="14px" fontWeight="800" color={currentTheme.text}>
                  {order.totalAmount === 0 || order.paymentProvider === "Free" ? "Free" : `${order.currency || 'GHS'} ${order.totalAmount}`}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="11px" color="#6B7280" fontWeight="600">Reference</Text>
                <Text fontSize="13px" fontWeight="800" color="#111827">
                  {order.transactionId || "N/A"}
                </Text>
              </Box>
            </Flex>

            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="11px" color="#6B7280" fontWeight="600">Venue Name</Text>
                <Text fontSize="14px" fontWeight="800" color="#111827" maxW="180px" noOfLines={1}>
                  {order.event?.venue || order.event?.venueName || "Accra"}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="11px" color="#6B7280" fontWeight="600">Ticket Code</Text>
                <Text fontSize="15px" fontWeight="900" color="#111827" letterSpacing="0.5px">
                  {order.manualCode}
                </Text>
              </Box>
            </Flex>

            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="11px" color="#6B7280" fontWeight="600">Date & Time</Text>
                <Text fontSize="12px" fontWeight="800" color="#111827">
                  {formattedDateString}{order.event?.startTime ? `, ${order.event.startTime}` : ''}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="11px" color="#6B7280" fontWeight="600">Status</Text>
                <Text fontSize="13px" fontWeight="900" color={currentTheme.text} letterSpacing="0.5px">
                  ACTIVE
                </Text>
              </Box>
            </Flex>
          </VStack>

          {/* TICKET NOTCH SIDE CUTOUTS + DASHED SEPARATOR LINE 2 */}
          <Box position="relative" my="20px">
            <Box position="absolute" left="-36px" top="-10px" w="24px" h="24px" bg="#0d0d0d" borderRadius="full" />
            <Box position="absolute" right="-36px" top="-10px" w="24px" h="24px" bg="#0d0d0d" borderRadius="full" />
            <Box borderTop="2px dashed" borderColor={currentTheme.primary} opacity={0.5} pt="4px" />
          </Box>

          {/* BOTTOM ATTENDEE FOOTER */}
          <Flex justify="space-between" align="center" pt="4px">
            <Box>
              <Text fontSize="11px" color="#6B7280" fontWeight="600">Full Name</Text>
              <Text fontSize="13px" fontWeight="800" color="#111827" textTransform="uppercase">
                {order.customer?.name || "Guest Attendee"}
              </Text>
            </Box>
            <Box textAlign="right">
              <Text fontSize="11px" color="#6B7280" fontWeight="600">Mobile #</Text>
              <Text fontSize="13px" fontWeight="800" color="#111827">
                {order.momoNumber || order.customer?.phone || "N/A"}
              </Text>
            </Box>
          </Flex>

        </Box>

        {/* Save & Nav Actions */}
        <VStack spacing="12px" w="100%" mt="24px">
          <Button 
            w="100%" 
            bg={currentTheme.primary} 
            color="white" 
            fontWeight="800" 
            h="50px" 
            borderRadius="14px" 
            _hover={{ opacity: 0.9 }} 
            isLoading={downloading}
            loadingText="Downloading..."
            onClick={handleSaveToDevice}
          >
            Save to Device
          </Button>
          <Button 
            w="100%" 
            variant="ghost" 
            color="gray.400" 
            _hover={{ bg: "whiteAlpha.100", color: "white" }} 
            onClick={() => window.location.href = `/${locale}/feed`}
          >
            Back to Feed
          </Button>
        </VStack>

      </Box>
    </Flex>
  );
}