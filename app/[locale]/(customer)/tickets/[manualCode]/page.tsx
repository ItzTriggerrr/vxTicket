"use client";

import React, { useRef, useState } from "react";
import { notFound } from "next/navigation";
import { toPng } from "html-to-image";
import {
  Box, Flex, Text, Heading, VStack, HStack, Divider, Button, Badge, Spinner
} from "@chakra-ui/react";

interface TicketPageProps {
  params: {
    locale: string;
    manualCode: string;
  };
}

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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${order.manualCode}&color=22c55e&bgcolor=121212`;

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

  return (
    <Flex minH="100vh" bg="#0d0d0d" color="white" align="center" justify="center" px="16px" py="40px" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
      <Box maxW="450px" w="100%" textAlign="center">
        
        <Box mb="20px">
          <Badge bg="rgba(34,197,94,0.15)" color="#22c55e" px="12px" py="6px" borderRadius="10px" fontSize="11px" fontWeight="800" mb="12px" letterSpacing="1px" textTransform="uppercase">
            ORDER SECURED
          </Badge>
          <Heading as="h1" size="lg" fontWeight="800" color="white">Your Ticket</Heading>
          <Text fontSize="14px" color="gray.500" mt="6px">SAVE TICKET TO YOUR DEVICE!!!.</Text>
        </Box>

        <Box 
          ref={ticketRef}
          bg="#121212" 
          border="1px solid #222" 
          borderRadius="24px" 
          p="28px" 
          position="relative" 
          overflow="hidden"
          boxShadow="0px 10px 30px rgba(0,0,0,0.5)"
        >
          <Flex justify="space-between" align="center" mb="20px">
            <Text fontSize="10px" fontWeight="800" color="gray.600" letterSpacing="1.5px">vxTICKET</Text>
            <Badge colorScheme="green" fontSize="10px" borderRadius="6px">Verified Entry Pass</Badge>
          </Flex>

          <Box bg="#1a1a1a" border="1px solid #2a2a2a" borderRadius="20px" p="20px" position="relative">
            <VStack spacing="12px" align="start">
              <Box textAlign="left">
                <Text fontSize="10px" color="gray.500" fontWeight="700">EVENT NAME</Text>
                <Text fontSize="17px" color="white" fontWeight="800" lineHeight="1.2" noOfLines={2}>
                  {order.event?.title || "Special Event Pass"}
                </Text>
              </Box>

              <HStack w="100%" justify="space-between">
                <Box textAlign="left">
                  <Text fontSize="10px" color="gray.500" fontWeight="700">DATE</Text>
                  <Text fontSize="12px" color="white" fontWeight="600">
                    {order.event?.date ? new Date(order.event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                  </Text>
                </Box>
                <Box textAlign="right">
                  <Text fontSize="10px" color="gray.500" fontWeight="700">TIME</Text>
                  <Text fontSize="12px" color="white" fontWeight="600">{order.event?.startTime || "N/A"}</Text>
                </Box>
              </HStack>

              <Box textAlign="left" w="100%">
                <Text fontSize="10px" color="gray.500" fontWeight="700">VENUE</Text>
                <Text fontSize="12px" color="white" fontWeight="600" noOfLines={1}>{order.event?.venue || "See Description"}</Text>
                <Text fontSize="10px" color="gray.400">{order.event?.address}</Text>
              </Box>
            </VStack>

            <Divider borderColor="#2a2a2a" my="16px" />

            <Flex direction="column" align="center" justify="center">
              <Box bg="#121212" p="12px" borderRadius="16px" border="2px solid #22c55e" mb="12px" w="160px" h="160px">
                <img src={qrCodeUrl} alt="Gate Scanning QR Token" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
              </Box>
              <Text fontSize="10px" color="gray.500" fontWeight="600">VALIDATION TOKEN</Text>
              <Text fontSize="18px" color="#22c55e" fontWeight="950" letterSpacing="1px" mt="2px">
                {order.manualCode}
              </Text>
            </Flex>

            <Divider borderColor="#2a2a2a" my="16px" />

            <VStack spacing="6px" align="stretch" fontSize="12px">
              <Flex justify="space-between">
                <Text color="gray.500">Attendee:</Text>
                <Text color="white" fontWeight="700">{order.customer?.name || "Guest Attendee"}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color="gray.500">Ticket Quantity:</Text>
                <Text color="white" fontWeight="700">x{order.quantity || 1}</Text>
              </Flex>
              <Flex justify="space-between" fontSize="13px" fontWeight="800">
                <Text color="gray.500">Amount Paid:</Text>
                <Text color="#22c55e">{order.currency} {order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}</Text>
              </Flex>
            </VStack>
          </Box>

          <Text fontSize="9px" color="gray.600" mt="16px" fontWeight="700" letterSpacing="0.5px">
            POWERED BY vxTICKET
          </Text>
        </Box>

        <VStack spacing="12px" w="100%" mt="24px">
          <Button 
            w="100%" 
            bg="#22c55e" 
            color="black" 
            fontWeight="800" 
            h="48px" 
            borderRadius="12px" 
            _hover={{ bg: "#16a34a" }} 
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