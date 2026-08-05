"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { 
  Box, Flex, Text, VStack, Heading, Badge, Button, useToast, Input, HStack 
} from "@chakra-ui/react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function GateScannerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const toast = useToast();

  const eventId = params?.eventId as string;
  const gateKey = searchParams?.get("key");

  const [lastScan, setLastScan] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [manualInputCode, setManualInputCode] = useState("");
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current && document.getElementById("gate-reader")) {
      scannerRef.current = new Html5QrcodeScanner(
        "gate-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        async (decodedText) => {
          if (processing) return;
          handleTicketVerify(decodedText);
        },
        () => {}
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error("Scanner clear error:", err));
        scannerRef.current = null;
      }
    };
  }, [processing]);

  const handleTicketVerify = async (code: string) => {
    if (!code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    setProcessing(true);

    // ─── ⚡ HIGH-VOLUME FEATURE: LOCAL IN-MEMORY DOUBLE-SCAN GUARD ───
    const localSessionKey = `scans:${eventId}`;
    const localScanHistory = JSON.parse(localStorage.getItem(localSessionKey) || "[]");

    if (localScanHistory.includes(cleanCode)) {
      setLastScan({ 
        status: "DENIED", 
        error: "Double-Scan Intercepted", 
        details: { holder: "Fraud Attempt", tier: "Unknown", count: "Local Memory Block" } 
      });
      toast({
        title: "FRAUD WARNING",
        description: "This validation code was already checked-in at this terminal.",
        status: "error",
        duration: 4,
        position: "top",
      });
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualCode: cleanCode }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Commit code to local cache array to prevent re-scanning on cellular dropouts
        localScanHistory.push(cleanCode);
        localStorage.setItem(localSessionKey, JSON.stringify(localScanHistory));

        setLastScan({ status: "GRANTED", ...result.data });
        setManualInputCode("");
        toast({
          title: "Access Granted",
          description: `${result.data.holder} (${result.data.scannedCount}/${result.data.totalQuantity})`,
          status: "success",
          duration: 3,
          position: "top",
        });
      } else {
        setLastScan({ 
          status: "DENIED", 
          error: result.error, 
          details: result.details 
        });
        toast({
          title: "ACCESS DENIED",
          description: result.error || "Invalid Ticket Reference",
          status: "error",
          duration: 5,
          position: "top",
        });
      }
    } catch (err) {
      console.error("Network synchronization issue:", err);
      // Fallback state if network signals crash entirely inside a crowded stadium environment
      setLastScan({
        status: "DENIED",
        error: "Sync Terminal Timeout",
        details: { holder: "Check Network Link", tier: "Connection Dropped", count: "Offline" }
      });
      toast({
        title: "NETWORK BOUNDS ERROR",
        description: "Unable to verify. Check cellular signal.",
        status: "warning",
        duration: 5,
        position: "top",
      });
    } finally {
      setTimeout(() => setProcessing(false), 1500);
    }
  };

  return (
    <Flex minH="100vh" bg="#0d0d0d" color="white" direction="column" align="center" justify="start" px="16px" py="30px" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
      <VStack spacing="20px" w="100%" maxW="450px" textAlign="center">
        
        <Box>
          <Badge bg="rgba(34,197,94,0.15)" color="#22c55e" px="10px" py="4px" borderRadius="6px" fontSize="10px" fontWeight="800" textTransform="uppercase">
            LIVE GATE ACCESS PORTAL {gateKey ? "• ASSIGNED BOUNCER" : "• OWNER ACCESS"}
          </Badge>
          <Heading size="md" mt="8px" fontWeight="800">vxTicket Gate Control</Heading>
        </Box>

        {/* Camera Frame Viewport */}
        <Box w="100%" bg="#121212" borderRadius="24px" p="16px" border="1px solid #222" overflow="hidden">
          <div id="gate-reader" style={{ width: "100%", borderRadius: "16px" }}></div>
        </Box>

        {/* Manual Keyboard Entry Layer */}
        <Box w="100%" bg="#121212" border="1px solid #222" borderRadius="20px" p="16px" textAlign="left">
          <Text fontSize="11px" fontWeight="700" color="gray.500" mb="8px" letterSpacing="0.5px">
            CANNOT SCAN? ENTER CODE MANUALLY
          </Text>
          <HStack spacing="10px">
            <Input
              placeholder="e.g. VT-A19E2FBC"
              bg="#1a1a1a"
              border="1px solid #333"
              color="white"
              _focus={{ borderColor: "#22c55e", boxShadow: "none" }}
              textTransform="uppercase"
              value={manualInputCode}
              onChange={(e) => setManualInputCode(e.target.value)}
              isDisabled={processing}
            />
            <Button
              bg="#22c55e"
              color="black"
              fontWeight="800"
              px="24px"
              _hover={{ bg: "#16a34a" }}
              isLoading={processing}
              onClick={() => handleTicketVerify(manualInputCode)}
            >
              Verify
            </Button>
          </HStack>
        </Box>

        {/* Real-Time Scan Diagnostic Interface */}
        {lastScan && (
          <Box 
            w="100%" 
            bg="#121212" 
            border="2px solid" 
            borderColor={lastScan.status === "GRANTED" ? "#22c55e" : "#ef4444"} 
            borderRadius="20px" 
            p="20px" 
            textAlign="left"
          >
            {lastScan.status === "GRANTED" ? (
              <VStack align="start" spacing="4px">
                <Text fontSize="11px" fontWeight="800" color="#22c55e">VALID ENTRY</Text>
                <Text fontSize="18px" fontWeight="900" noOfLines={1}>{lastScan.title}</Text>
                <Text fontSize="14px" color="gray.300">Attendee: <b>{lastScan.holder}</b></Text>
                <Text fontSize="13px" color="gray.400">Tier: {lastScan.tier}</Text>
                <Badge colorScheme="green" mt="6px" fontSize="12px" px="8px">
                  Group Counter: {lastScan.scannedCount} / {lastScan.totalQuantity} Checked In
                </Badge>
              </VStack>
            ) : (
              <VStack align="start" spacing="4px">
                <Text fontSize="11px" fontWeight="800" color="#ef4444">INVALID / FRAUD DETECTED</Text>
                <Text fontSize="16px" fontWeight="800" color="white">{lastScan.error}</Text>
                {lastScan.details && (
                  <Text fontSize="12px" color="gray.400">
                    {lastScan.error === "Sync Terminal Timeout" 
                      ? "The scanner cannot verify the code details because cell signals are offline."
                      : `This ticket for ${lastScan.details.holder} (${lastScan.details.tier}) was already checked in completely (${lastScan.details.count || lastScan.details.scannedCount}).`}
                  </Text>
                )}
              </VStack>
            )}
          </Box>
        )}

      </VStack>
    </Flex>
  );
}