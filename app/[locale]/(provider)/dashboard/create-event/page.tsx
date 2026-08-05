"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import {
  ChakraProvider, extendTheme, Box, Container, Flex, Text, Heading,
  Input, Select, Textarea, Button, Grid, GridItem, Icon,
  VStack, HStack, FormControl, FormLabel, InputGroup, InputLeftElement,
  Avatar, Image, IconButton, useToast
} from '@chakra-ui/react';
import {
  PhotoIcon, PencilIcon, CalendarIcon, ClockIcon, MapPinIcon,
  UserIcon, UsersIcon, TicketIcon, PlusIcon,
  RocketLaunchIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';

// --- SUPABASE CONFIGURATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- THEME CONFIGURATION ---
const theme = extendTheme({
  config: { initialColorMode: 'dark', useSystemColorMode: false },
  colors: {
    brand: { bg: '#0F1523', card: '#161E2E', border: '#2D3748', accent: '#818CF8', accentHover: '#6366F1', muted: '#9CA3AF' },
  },
  styles: { global: { body: { bg: 'brand.bg', color: 'white' } } },
  components: {
    Input: { variants: { outline: { field: { bg: 'brand.bg', borderColor: 'brand.border', color: 'white', _focus: { borderColor: 'brand.accent', boxShadow: 'none' } } } } },
    Select: { variants: { outline: { field: { bg: 'brand.bg', borderColor: 'brand.border', color: 'white', _focus: { borderColor: 'brand.accent', boxShadow: 'none' } } } } },
    Textarea: { variants: { outline: { bg: 'brand.bg', borderColor: 'brand.border', color: 'white', _focus: { borderColor: 'brand.accent', boxShadow: 'none' } } } }
  }
});

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Heading as="h3" size="sm" fontWeight="semibold" color="white" mb={3}>{children}</Heading>
);

const TopNavigation = () => (
  <Box borderBottom="1px solid" borderColor="brand.border" bg="brand.bg" px={6} py={3}>
    <Flex justify="space-between" align="center" maxW="container.md" mx="auto">
      <HStack spacing={8}>
        <HStack>
          <Flex bg="brand.card" p={1.5} borderRadius="md"><Icon as={BoltIcon} color="brand.accent" w={5} h={5} /></Flex>
          <Text fontWeight="bold" fontSize="md">QuickServe Provider</Text>
        </HStack>
      </HStack>
      <Avatar size="sm" name="Provider Account" bg="gray.600" color="white" />
    </Flex>
  </Box>
);

const EventCreationApp = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // REAL PROVIDER ID INSTEAD OF DUMMY
  const [providerId, setProviderId] = useState<string | null>(null);

  // --- THE BOUNCER: Kicks unauthenticated users to login ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/en/auth'; // Kick them out!
      } else {
        setProviderId(session.user.id);    // Secure the real ID
        setIsAuthChecking(false);          // Let them in
      }
    };
    checkAuth();
  }, []);

  const [formData, setFormData] = useState({
    title: "", category: "Music", customCategory: "", startDate: "", startTime: "", endTime: "", 
    venueName: "", address: "", city: "Accra", description: "", host: ""
  });

  const [ticketTiers, setTicketTiers] = useState([{ name: "", price: "", capacity: "", description: "" }]);
  const [lineup, setLineup] = useState([{ name: "", role: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e: any) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const availableSlots = 4 - files.length;
      const newFiles = selectedFiles.slice(0, availableSlots); 
      const newUrls = newFiles.map(f => URL.createObjectURL(f));
      setFiles([...files, ...newFiles]);
      setPreviewUrls([...previewUrls, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const addTicketTier = () => setTicketTiers([...ticketTiers, { name: "", price: "", capacity: "", description: "" }]);
  const removeTicketTier = (index: number) => setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  const handleTicketChange = (index: number, field: string, value: string) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTicketTiers(newTiers);
  };

  const addArtist = () => setLineup([...lineup, { name: "", role: "" }]);
  const removeArtist = (index: number) => setLineup(lineup.filter((_, i) => i !== index));
  const handleLineupChange = (index: number, field: string, value: string) => {
    const newLineup = [...lineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setLineup(newLineup);
  };

  const handleSubmit = async () => {
    if (!providerId) return; 

    setIsSubmitting(true);
    try {
      let finalImageUrls: string[] = [];
      if (files.length > 0) {
        finalImageUrls = await Promise.all(
          files.map(async (file) => {
            const filePath = `${providerId}/${Math.random()}.${file.name.split('.').pop()}`;
            await supabase.storage.from('event-flyers').upload(filePath, file);
            const { data } = supabase.storage.from('event-flyers').getPublicUrl(filePath);
            return data.publicUrl;
          })
        );
      }

      const imageStringForDatabase = finalImageUrls.join(',');
      const totalCapacity = ticketTiers.reduce((sum, tier) => sum + (parseInt(tier.capacity) || 0), 0);
      const finalCategory = formData.category === "Custom" ? formData.customCategory : formData.category;

      const payload = {
        ...formData,
        category: finalCategory, 
        providerId: providerId, // USING REAL ID
        totalCapacity: totalCapacity.toString(),
        coverImage: imageStringForDatabase,
        ticketTiers,
        lineup
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({ title: "Event Published!", description: "Your event is live.", status: "success", duration: 5000, isClosable: true });
        setFormData({ title: "", category: "Music", customCategory: "", startDate: "", startTime: "", endTime: "", venueName: "", address: "", city: "Accra", description: "", host: "" });
        setTicketTiers([{ name: "", price: "", capacity: "", description: "" }]);
        setLineup([{ name: "", role: "" }]);
        setFiles([]); 
        setPreviewUrls([]);
      } else {
        toast({ title: "Error", description: result.error, status: "error", duration: 5000, isClosable: true });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: "Something went wrong.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent UI from flashing before auth is checked
  if (isAuthChecking) {
    return (
      <Box bg="brand.bg" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="brand.muted">Loading secure dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box bg="brand.bg" minH="100vh" pb="100px">
      <TopNavigation />
      <Container maxW="container.md" pt={8}>
        
        <Box mb={8}>
          <Heading as="h1" size="lg" mb={1}>Event Creation</Heading>
          <Text color="brand.muted" fontSize="sm">Setup your next big event listing</Text>
        </Box>

        <VStack spacing={8} align="stretch">
          
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <SectionTitle>Event Flyer & Gallery</SectionTitle>
              <Text fontSize="xs" color={files.length === 4 ? "green.400" : "brand.muted"}>{files.length} / 4 Uploaded</Text>
            </Flex>
            <Grid templateColumns="repeat(4, 1fr)" gap={4}>
              {previewUrls.map((url, idx) => (
                <GridItem key={idx} position="relative" h="120px" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="brand.border">
                  <Image src={url} w="100%" h="100%" objectFit="cover" alt={`Upload ${idx+1}`} />
                  <IconButton aria-label="Remove image" icon={<Icon as={TrashIcon} w={4} h={4}/>} size="sm" position="absolute" top={1} right={1} colorScheme="red" onClick={() => removeImage(idx)} />
                </GridItem>
              ))}
              {files.length < 4 && (
                <GridItem position="relative" h="120px" bg="brand.bg" border="1px dashed" borderColor="brand.border" borderRadius="xl" overflow="hidden" _hover={{ borderColor: 'brand.accent', bg: 'whiteAlpha.50' }} transition="all 0.2s">
                  <Input type="file" multiple accept="image/*" onChange={handleFileChange} position="absolute" top="0" left="0" w="100%" h="100%" opacity="0" cursor="pointer" zIndex="2" />
                  <Flex direction="column" align="center" justify="center" h="100%">
                    <Icon as={PhotoIcon} w={6} h={6} color="brand.accent" mb={2} />
                    <Text fontSize="xs" color="brand.muted" textAlign="center">Add Image</Text>
                  </Flex>
                </GridItem>
              )}
            </Grid>
          </Box>

          <Box>
            <SectionTitle>Event Details</SectionTitle>
            <VStack spacing={5} align="stretch" bg="brand.card" p={6} borderRadius="xl" border="1px solid" borderColor="brand.border">
              
              <FormControl>
                <FormLabel fontSize="sm" color="brand.muted">Event Name</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none"><Icon as={PencilIcon} color="brand.muted" w={4} h={4} /></InputLeftElement>
                  <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Summer Music Festival" />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="brand.muted">Host / Organizer Name</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none"><Icon as={UserIcon} color="brand.muted" w={4} h={4} /></InputLeftElement>
                  <Input name="host" value={formData.host} onChange={handleInputChange} placeholder="e.g. QuickServe Events" />
                </InputGroup>
              </FormControl>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
                <FormControl>
                  <FormLabel fontSize="sm" color="brand.muted">Event Type</FormLabel>
                  <Select name="category" value={formData.category} onChange={handleInputChange} mb={formData.category === "Custom" ? 2 : 0}>
                    <option value="Music" style={{background: '#161E2E'}}>Music</option>
                    <option value="Conference" style={{background: '#161E2E'}}>Conference</option>
                    <option value="Festival" style={{background: '#161E2E'}}>Festival</option>
                    <option value="Outdoor" style={{background: '#161E2E'}}>Outdoor</option>
                    <option value="Custom" style={{background: '#161E2E'}}>Type my own...</option>
                  </Select>
                  {formData.category === "Custom" && (
                    <Input name="customCategory" value={formData.customCategory} onChange={handleInputChange} placeholder="Type your custom category" autoFocus />
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="brand.muted">Date</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={CalendarIcon} color="brand.muted" w={4} h={4} /></InputLeftElement>
                    <Input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="brand.muted">Start Time</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={ClockIcon} color="brand.muted" w={4} h={4} /></InputLeftElement>
                    <Input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="brand.muted">End Time</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={ClockIcon} color="brand.muted" w={4} h={4} /></InputLeftElement>
                    <Input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} />
                  </InputGroup>
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel fontSize="sm" color="brand.muted">Venue Name</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none"><Icon as={MapPinIcon} color="brand.muted" w={4} h={4} /></InputLeftElement>
                  <Input name="venueName" value={formData.venueName} onChange={handleInputChange} placeholder="e.g. Central Park Arena" />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="brand.muted">Street Address</FormLabel>
                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Event St." />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="brand.muted">About Event</FormLabel>
                <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your event, rules, and what to expect..." rows={4} />
              </FormControl>
            </VStack>
          </Box>

          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <SectionTitle>Artist Lineup</SectionTitle>
            </Flex>
            <VStack spacing={3} align="stretch">
              {lineup.map((artist, idx) => (
                <Flex key={idx} bg="brand.card" border="1px solid" borderColor="brand.border" borderRadius="xl" p={4} align="center" gap={4}>
                  <Icon as={UsersIcon} w={5} h={5} color="brand.muted" />
                  <Input placeholder="Artist Name" value={artist.name} onChange={(e) => handleLineupChange(idx, 'name', e.target.value)} size="sm" />
                  <Input placeholder="Role (e.g. DJ)" value={artist.role} onChange={(e) => handleLineupChange(idx, 'role', e.target.value)} size="sm" />
                  <IconButton aria-label="Remove" icon={<Icon as={TrashIcon} w={4} h={4} />} onClick={() => removeArtist(idx)} colorScheme="red" variant="ghost" size="sm" />
                </Flex>
              ))}
              <Button onClick={addArtist} variant="ghost" color="brand.accent" size="sm" leftIcon={<Icon as={PlusIcon} w={4} h={4}/>} _hover={{ bg: 'whiteAlpha.100' }}>
                Add Artist
              </Button>
            </VStack>
          </Box>

          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <SectionTitle>Ticket Price Tiers</SectionTitle>
            </Flex>
            <VStack spacing={3} align="stretch">
              {ticketTiers.map((tier, idx) => (
                <Flex key={idx} bg="brand.card" border="1px solid" borderColor="brand.border" borderRadius="xl" p={4} align="center" gap={4} direction={{ base: 'column', md: 'row' }}>
                  <Icon as={TicketIcon} w={5} h={5} color="brand.muted" display={{ base: 'none', md: 'block' }} />
                  <VStack flex={1} w="full" spacing={2}>
                    <Input placeholder="Tier Name (e.g. VIP)" value={tier.name} onChange={(e) => handleTicketChange(idx, 'name', e.target.value)} size="sm" />
                    <Input placeholder="Description" value={tier.description} onChange={(e) => handleTicketChange(idx, 'description', e.target.value)} size="sm" />
                  </VStack>
                  <VStack flex={1} w="full" spacing={2}>
                    <Input placeholder="Price (GH₵)" type="number" value={tier.price} onChange={(e) => handleTicketChange(idx, 'price', e.target.value)} size="sm" />
                    <Input placeholder="Total Tickets Available" type="number" value={tier.capacity} onChange={(e) => handleTicketChange(idx, 'capacity', e.target.value)} size="sm" />
                  </VStack>
                  <IconButton aria-label="Remove" icon={<Icon as={TrashIcon} w={4} h={4} />} onClick={() => removeTicketTier(idx)} colorScheme="red" variant="ghost" size="sm" alignSelf={{ base: 'flex-end', md: 'center' }} />
                </Flex>
              ))}
              <Button onClick={addTicketTier} variant="ghost" color="brand.accent" size="sm" leftIcon={<Icon as={PlusIcon} w={4} h={4}/>} _hover={{ bg: 'whiteAlpha.100' }}>
                Add Price Tier
              </Button>
            </VStack>
          </Box>

        </VStack>
      </Container>

      <Box position="fixed" bottom={0} left={0} w="100%" bg="brand.card" borderTop="1px solid" borderColor="brand.border" p={4} zIndex={10}>
        <Container maxW="container.md">
          <Flex direction={{ base: 'column-reverse', md: 'row' }} justify="space-between" align="center" gap={4}>
             <Text fontSize="xs" color="brand.muted" textAlign={{ base: 'center', md: 'left' }}>
               Entries saved will reflect on customer view.
             </Text>
             <HStack spacing={4} w={{ base: '100%', md: 'auto' }}>
               <Button flex={{ base: 1, md: 'auto' }} variant="outline" borderColor="brand.border" color="white" _hover={{ bg: 'whiteAlpha.100' }}>
                 Save Draft
               </Button>
               <Button onClick={handleSubmit} isLoading={isSubmitting} flex={{ base: 1, md: 'auto' }} bg="brand.accent" color="white" leftIcon={<Icon as={RocketLaunchIcon} w={4} h={4}/>} _hover={{ bg: 'brand.accentHover' }}>
                 Publish Event
               </Button>
             </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <EventCreationApp />
    </ChakraProvider>
  );
}