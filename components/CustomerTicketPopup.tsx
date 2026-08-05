"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  Text,
  Heading,
  Flex,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  venueName: string;
  ticketCode: string; // The unique manualCode string from your TicketOrder table
}

export default function CustomerTicketPopup({
  isOpen,
  onClose,
  eventTitle,
  venueName,
  ticketCode,
}: TicketModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(0,0,0,0.85)" backdropFilter="blur(4px)" />
      <ModalContent bg="#161616" border="1.5px solid #2A2A2A" borderRadius="24px" color="white" mx="16px">
        <ModalHeader borderBottom="1px solid #222" pb="14px" fontSize="16px" fontWeight="700">
          Your Digital Entry Pass
        </ModalHeader>
        <ModalCloseButton color="rgba(255,255,255,0.4)" _hover={{ color: "white" }} />
        
        <ModalBody py="24px">
          <VStack spacing="24px" align="stretch">
            
            {/* Ticket Branding Header */}
            <Box textAlign="center">
              <Heading size="md" color="white" mb="4px" noOfLines={1}>
                {eventTitle}
              </Heading>
              <Text fontSize="13px" color="#9ca3af" noOfLines={1}>
                {venueName}
              </Text>
            </Box>

            {/* Rendered Live QR Code using your new package */}
            <Flex bg="white" p="20px" borderRadius="16px" justify="center" align="center" mx="auto" w="220px" h="220px">
              <QRCodeSVG 
                value={ticketCode} // Encodes your secure database reference token string
                size={180}
                bgColor={"#FFFFFF"}
                fgColor={"#000000"}
                level={"M"}
              />
            </Flex>

            {/* Displaying the literal verification code below it */}
            <Text textAlign="center" fontSize="12px" color="#6b7280" fontFamily="monospace" letterSpacing="1px">
              TICKET REF: {ticketCode}
            </Text>

            {/* High-Visibility Backup Warning Notice Banner */}
            <Alert 
              status="warning" 
              bg="rgba(239, 68, 68, 0.1)" 
              border="1px solid #ef4444" 
              borderRadius="14px" 
              color="white"
              alignItems="flex-start"
            >
              <AlertIcon color="#ef4444" mt="2px" />
              <Box>
                <Text fontWeight="700" fontSize="13px" color="#ef4444" mb="2px">
                  ACTION REQUIRED
                </Text>
                <Text fontSize="12px" color="rgba(255,255,255,0.8)" lineHeight="1.4">
                  Please take a screenshot of this QR code or save it to your camera roll now.
                </Text>
              </Box>
            </Alert>

          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}