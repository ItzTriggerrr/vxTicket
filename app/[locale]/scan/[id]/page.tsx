"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  Heading,
  Badge,
  useToast,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
} from "@chakra-ui/react";

export default function BouncerScannerPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "";

  const [eventTitle, setEventTitle] = useState<string>("Loading event...");
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [checkInCount, setCheckInCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const toast = useToast();

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const isProcessingScan = useRef(false);

  // 1. Fetch Event Title on Mount
  useEffect(() => {
    if (!eventId) return;

    async function fetchEventDetails() {
      try {
        const origin = window.location.origin;
        const res = await fetch(`${origin}/api/events/manage?id=${eventId}`);
        if (!res.ok) throw new Error("Event API unreachable");

        const data = await res.json();
        if (data.success && data.event) {
          setEventTitle(data.event.title);
        } else {
          setEventTitle("Event Gate Check-in");
        }
      } catch (err) {
        console.error("❌ Event title fetch error:", err);
        setEventTitle("Event Gate Check-in");
      } finally {
        setLoadingEvent(false);
      }
    }

    fetchEventDetails();
  }, [eventId]);

  // 2. Core Fast Check-in API Submission (No Abort Timeout)
  const handleCheckIn = useCallback(
    async (codeToSubmit: string) => {
      const code = codeToSubmit.trim();

      if (!code) {
        toast({
          title: "Validation code required",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsSubmitting(true);
      setLastResult(null);

      try {
        const origin = window.location.origin;
        const response = await fetch(`${origin}/api/scanner/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manualCode: code,
            checkInCount: Number(checkInCount),
            eventId,
          }),
        });

        const data = await response.json();

        if (response.ok && data.status === "SUCCESS") {
          setLastResult({ success: true, ...data });
          toast({
            title: "Check-in Successful!",
            description: `${data.details?.attendee || "Guest"} (${data.details?.checkedInNow || 1} checked in)`,
            status: "success",
            duration: 4000,
            isClosable: true,
          });
          setManualCode("");
        } else {
          setLastResult({ success: false, ...data });
          toast({
            title: "Check-in Failed",
            description: data.message || data.error || "Invalid or unverified ticket",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (err: any) {
        toast({
          title: "Network / Connection Error",
          description: err?.message || "Could not connect to check-in server.",
          status: "error",
          duration: 4000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [checkInCount, eventId, toast]
  );

  // 3. Graceful Camera Teardown on Mode Switch
  const stopCamera = async () => {
    if (html5QrcodeRef.current && isScanningRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        // Safe catch if camera was already stopped
      } finally {
        isScanningRef.current = false;
        html5QrcodeRef.current = null;
      }
    }
  };

  const switchToManualMode = async () => {
    await stopCamera();
    setIsManualMode(true);
  };

  const switchToCameraMode = () => {
    setIsManualMode(false);
  };

  // 4. Camera Engine Lifecycle
  useEffect(() => {
    if (isManualMode) return;

    let isMounted = true;

    const startCamera = async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = document.getElementById("reader");
      if (!element || !isMounted) return;

      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode("reader");
      }

      const qrCodeInstance = html5QrcodeRef.current;

      if (!isScanningRef.current) {
        try {
          isScanningRef.current = true;
          await qrCodeInstance.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              disableFlip: true,
              videoConstraints: {
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
            },
            async (decodedText) => {
              if (isProcessingScan.current) return;
              isProcessingScan.current = true;

              await handleCheckIn(decodedText);

              setTimeout(() => {
                isProcessingScan.current = false;
              }, 1500);
            },
            () => {}
          );
        } catch (err) {
          isScanningRef.current = false;
          console.error("Camera access error:", err);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isManualMode, handleCheckIn]);

  return (
    <Box bg="#0A0A0C" color="white" minH="100vh" p={4} fontFamily="'Inter', sans-serif">
      <Box maxW="440px" mx="auto" pt={4}>
        
        {/* HEADER SECTION */}
        <VStack spacing={1} align="center" mb={6} textAlign="center">
          <Badge bg="rgba(34, 197, 94, 0.15)" color="#22C55E" fontSize="11px" fontWeight="700" px={3} py={1} borderRadius="20px" letterSpacing="0.5px">
            BOUNCER SCANNER
          </Badge>
          
          {loadingEvent ? (
            <Spinner size="sm" color="#22C55E" mt={2} />
          ) : (
            <Heading fontSize="22px" fontWeight="800" color="white" mt={1} noOfLines={2}>
              {eventTitle}
            </Heading>
          )}
        </VStack>

        {/* SCAN / ENTRY CONTAINER */}
        <Box bg="#141418" p={5} borderRadius="24px" border="1px solid #22222A" boxShadow="0 20px 40px rgba(0,0,0,0.5)" mb={4}>
          <VStack spacing={4} align="stretch">
            
            {/* GUEST COUNT SELECTOR */}
            <Flex justify="space-between" align="center" bg="#0A0A0C" p={3} borderRadius="14px" border="1px solid #1E1E24">
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
                <NumberInputField bg="#141418" border="1px solid #333" h="38px" fontSize="15px" fontWeight="700" textAlign="center" />
                <NumberInputStepper>
                  <NumberIncrementStepper color="white" border="none" />
                  <NumberDecrementStepper color="white" border="none" />
                </NumberInputStepper>
              </NumberInput>
            </Flex>

            {/* CAMERA VS MANUAL TOGGLE MODE */}
            {!isManualMode ? (
              <VStack spacing={3} align="stretch">
                <Box
                  id="reader"
                  w="100%"
                  minH="260px"
                  bg="#050507"
                  borderRadius="18px"
                  border="1px solid #282832"
                  overflow="hidden"
                  sx={{
                    "& video": { borderRadius: "14px", width: "100% !important", objectFit: "cover" },
                  }}
                />

                <Button
                  variant="ghost"
                  color="#22C55E"
                  fontSize="13px"
                  fontWeight="700"
                  _hover={{ bg: "transparent", color: "#16A34A" }}
                  onClick={switchToManualMode}
                >
                  Use verification code 
                </Button>
              </VStack>
            ) : (
              /* MANUAL VERIFICATION MODE */
              <VStack spacing={3} align="stretch">
                <Box>
                  <Text fontSize="12px" fontWeight="600" color="gray.400" mb={1.5}>
                    Ticket (Token) Code
                  </Text>
                  <Input
                    placeholder="e.g. VX-88492"
                    bg="#0A0A0C"
                    border="1px solid #282832"
                    color="white"
                    h="48px"
                    fontSize="15px"
                    fontWeight="700"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    _focus={{ borderColor: "#22C55E", boxShadow: "none" }}
                    autoFocus
                  />
                </Box>

                <Button
                  bg="#22C55E"
                  color="black"
                  fontWeight="800"
                  h="48px"
                  fontSize="15px"
                  isLoading={isSubmitting}
                  onClick={() => handleCheckIn(manualCode)}
                  _hover={{ bg: "#16A34A" }}
                  borderRadius="12px"
                >
                  Verify Code
                </Button>

                <Button
                  variant="ghost"
                  color="gray.400"
                  fontSize="13px"
                  fontWeight="600"
                  onClick={switchToCameraMode}
                >
                  ← Switch to QR Camera Scanner
                </Button>
              </VStack>
            )}

          </VStack>
        </Box>

        {/* CHECK-IN RESULT FEEDBACK CARD */}
        {lastResult && (
          <Box
            p={4}
            borderRadius="16px"
            bg={lastResult.success ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            border={`1px solid ${lastResult.success ? "#22C55E" : "#EF4444"}`}
          >
            <Text fontWeight="800" fontSize="15px" color={lastResult.success ? "#22C55E" : "#EF4444"} mb={1}>
              {lastResult.success ? "✓ PASS - APPROVED ENTRY" : "✕ ENTRY DENIED"}
            </Text>
            <Text fontSize="13px" color="gray.200">
              {lastResult.message}
            </Text>

            {lastResult.details && (
              <VStack align="stretch" spacing={1} mt={3} pt={2} borderTop="1px solid rgba(255,255,255,0.1)" fontSize="12px">
                <Flex justify="space-between">
                  <Text color="gray.400">Attendee:</Text>
                  <Text fontWeight="700">{lastResult.details.attendee}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.400">Ticket Tier:</Text>
                  <Text fontWeight="700">{lastResult.details.tier || "Standard"}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.400">Check-in Status:</Text>
                  <Text fontWeight="700">
                    {lastResult.details.totalCheckedIn ?? 0} / {lastResult.details.totalQuantity ?? 1} Guests
                  </Text>
                </Flex>
              </VStack>
            )}
          </Box>
        )}

      </Box>
    </Box>
  );
}