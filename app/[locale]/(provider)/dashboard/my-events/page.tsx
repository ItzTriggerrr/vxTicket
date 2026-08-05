"use client";

import { useState, useEffect } from "react";
import { 
  Box, VStack, Text, SimpleGrid, Badge, Flex, Spinner, Button, HStack,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Input, Select, Textarea
} from "@chakra-ui/react";

// Expanded to include all fields so the edit form can pull them in
interface Event {
  id: string;
  title: string;
  category: string;
  startDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  city: string;
  totalCapacity: number;
  description: string;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🚨 IMPORTANT: Paste your exact dummy User ID here! 🚨
  const DUMMY_PROVIDER_ID = "f3e44662-2bff-4645-8ad3-2c63848d4a03";

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const response = await fetch(`/api/events?providerId=${DUMMY_PROVIDER_ID}`);
        const data = await response.json();
        if (data.success) setEvents(data.events);
      } catch (error) {
        console.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/events?id=${eventId}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setEvents(events.filter(event => event.id !== eventId));
      }
    } catch (error) {
      console.error("Error deleting event");
    }
  };

  // --- NEW: EDIT FUNCTIONS ---
  const handleEditClick = (event: Event) => {
    // Format the date properly for the HTML input field (YYYY-MM-DD)
    const formattedDate = new Date(event.startDate).toISOString().split('T')[0];
    setEditingEvent({ ...event, startDate: formattedDate });
    onOpen();
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editingEvent) {
      setEditingEvent({ ...editingEvent, [e.target.name]: e.target.value });
    }
  };

  const handleUpdateSubmit = async () => {
    if (!editingEvent) return;
    setIsUpdating(true);

    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEvent),
      });
      
      const data = await response.json();

      if (data.success) {
        // Update the specific event in our local state instantly
        setEvents(events.map(ev => ev.id === editingEvent.id ? data.event : ev));
        onClose(); // Close the modal
      } else {
        alert("Failed to update event.");
      }
    } catch (error) {
      console.error("Error updating event", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box p="32px" bg="#0B1120" minH="100vh">
      <Box maxW="1200px" mx="auto">
        <Box mb="32px">
          <Text fontSize="32px" fontWeight="800" color="white" fontFamily="Plus Jakarta Sans">My Listings</Text>
          <Text fontSize="15px" color="#94A3B8" mt="8px" fontFamily="Inter">Manage your active events and monitor your global marketplace presence.</Text>
        </Box>

        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner color="#6366F1" size="xl" />
          </Flex>
        ) : events.length === 0 ? (
          <Box bg="#111827" p="40px" borderRadius="24px" border="1px dashed #334155" textAlign="center">
            <Text color="#94A3B8" fontSize="16px">No events found. You haven't published anything yet!</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="24px">
            {events.map((event) => (
              <Box key={event.id} bg="#111827" p="24px" borderRadius="20px" border="1px solid #1F2937" shadow="xl" _hover={{ borderColor: "#6366F1", transform: "translateY(-2px)", transition: "all 0.2s" }}>
                <Flex justify="space-between" align="center" mb="16px">
                  <Badge bg="rgba(99, 102, 241, 0.1)" color="#818CF8" px="12px" py="4px" borderRadius="full" fontSize="12px" fontWeight="700">
                    {event.category}
                  </Badge>
                  <Text color="#64748B" fontSize="13px" fontWeight="600">Capacity: {event.totalCapacity}</Text>
                </Flex>
                
                <Text fontSize="20px" fontWeight="700" color="white" mb="8px" noOfLines={2}>
                  {event.title}
                </Text>
                
                <VStack align="stretch" spacing="8px" mt="16px">
                  <Flex align="center">
                    <Text color="#94A3B8" fontSize="14px" fontWeight="500">📅 {new Date(event.startDate).toLocaleDateString()}</Text>
                  </Flex>
                  <Flex align="center">
                    <Text color="#94A3B8" fontSize="14px" fontWeight="500">📍 {event.venueName}</Text>
                  </Flex>
                </VStack>

                <HStack mt="24px" pt="16px" borderTop="1px solid #1F2937" justify="flex-end">
                  <Button size="sm" variant="ghost" color="#94A3B8" _hover={{ color: "white", bg: "#334155" }} onClick={() => handleEditClick(event)}>
                    Edit
                  </Button>
                  <Button size="sm" bg="rgba(239, 68, 68, 0.1)" color="#F87171" _hover={{ bg: "rgba(239, 68, 68, 0.2)" }} onClick={() => handleDelete(event.id)}>
                    Delete
                  </Button>
                </HStack>

              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* --- NEW: THE EDIT MODAL --- */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="#111827" border="1px solid #1F2937" color="white" borderRadius="24px">
          <ModalHeader fontFamily="Plus Jakarta Sans">Edit Event</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {editingEvent && (
              <VStack spacing="16px">
                <FormControl isRequired>
                  <FormLabel fontSize="13px" color="#94A3B8">Event Title</FormLabel>
                  <Input name="title" value={editingEvent.title} onChange={handleEditChange} bg="#1E293B" border="none" _focus={{ ring: "2px", ringColor: "#6366F1" }} />
                </FormControl>
                
                <SimpleGrid columns={2} spacing="16px" w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="13px" color="#94A3B8">Category</FormLabel>
                    <Select name="category" value={editingEvent.category} onChange={handleEditChange} bg="#1E293B" border="none" _focus={{ ring: "2px", ringColor: "#6366F1" }}>
                      <option value="Concert" style={{ background: "#1E293B" }}>Concert</option>
                      <option value="Festival" style={{ background: "#1E293B" }}>Festival</option>
                      <option value="Nightlife" style={{ background: "#1E293B" }}>Nightlife</option>
                      <option value="Arts" style={{ background: "#1E293B" }}>Arts & Exhibition</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="13px" color="#94A3B8">Date</FormLabel>
                    <Input type="date" name="startDate" value={editingEvent.startDate} onChange={handleEditChange} bg="#1E293B" border="none" />
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel fontSize="13px" color="#94A3B8">Venue Name</FormLabel>
                  <Input name="venueName" value={editingEvent.venueName} onChange={handleEditChange} bg="#1E293B" border="none" />
                </FormControl>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter borderTop="1px solid #1F2937" mt="24px">
            <Button variant="ghost" mr={3} onClick={onClose} color="#94A3B8" _hover={{ bg: "#1E293B", color: "white" }}>
              Cancel
            </Button>
            <Button bg="#6366F1" color="white" _hover={{ bg: "#4F46E5" }} onClick={handleUpdateSubmit} isLoading={isUpdating}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}