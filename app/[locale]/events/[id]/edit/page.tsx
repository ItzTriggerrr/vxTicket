'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Flex,
  Text,
  Heading,
  VStack,
  HStack,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Spinner,
  Badge,
  Switch,
  useToast,
  Divider,
  Grid,
  GridItem,
} from '@chakra-ui/react'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()

  const locale = (params?.locale as string) || 'en'
  const eventId = params?.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providerId, setProviderId] = useState('')

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Events')
  const [description, setDescription] = useState('')
  const [venueName, setVenueName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [status, setStatus] = useState('PUBLISHED')

  // Ticket Tiers State
  const [tiers, setTiers] = useState<any[]>([])

  useEffect(() => {
    // Resolve user ID from local storage profile
    if (typeof window !== 'undefined') {
      const cachedProfile = localStorage.getItem('qs_user_profile')
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile)
          if (profile.id) setProviderId(profile.id)
        } catch (e) {
          console.error('Error parsing session profile:', e)
        }
      }
    }

    async function fetchEventDetails() {
      if (!eventId) return
      try {
        const res = await fetch(`/api/events/manage?id=${eventId}`)
        if (!res.ok) throw new Error('Event listing not discovered.')
        const data = await res.json()

        if (data.success && data.event) {
          const evt = data.event
          setTitle(evt.title || '')
          setCategory(evt.category || 'Events')
          setDescription(evt.description || '')
          setVenueName(evt.venueName || '')
          setAddress(evt.address || '')
          setCity(evt.city || '')
          
          if (evt.startDate) setStartDate(new Date(evt.startDate).toISOString().split('T')[0])
          if (evt.endDate) setEndDate(new Date(evt.endDate).toISOString().split('T')[0])
          
          setStartTime(evt.startTime || '')
          setEndTime(evt.endTime || '')
          setCoverImage(evt.coverImage || '')
          setStatus(evt.status || 'PUBLISHED')
          setTiers(evt.tiers || evt.ticketTiers || [])
        }
      } catch (err: any) {
        toast({
          title: 'Error loading event',
          description: err.message || 'Could not retrieve event details.',
          status: 'error',
          duration: 4000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventDetails()
  }, [eventId, toast])

  // Handle adding a new ticket tier
  const handleAddTier = () => {
    setTiers([
      ...tiers,
      {
        name: '',
        price: 0,
        capacity: 100,
        isFree: false,
        isHidden: false,
        description: '',
      },
    ])
  }

  // Handle updates to tier fields
  const handleTierChange = (index: number, field: string, value: any) => {
    const updated = [...tiers]
    updated[index][field] = value
    setTiers(updated)
  }

  // 🚀 FIXED: Handle Save Submission with Session Fallback & Debugging Logs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Dynamic session fallback check if state isn't populated
    let activeProviderId = providerId
    if (!activeProviderId && typeof window !== 'undefined') {
      const cachedProfile = localStorage.getItem('qs_user_profile')
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile)
          activeProviderId = parsed.id || ''
        } catch (err) {
          console.error('Failed to parse local profile:', err)
        }
      }
    }

    if (!activeProviderId) {
      toast({
        title: 'Authentication Missing',
        description: 'Your user session is missing. Please log in again.',
        status: 'warning',
        duration: 4000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        id: eventId,
        providerId: activeProviderId,
        title,
        description,
        category,
        startDate,
        endDate,
        startTime,
        endTime,
        venueName,
        address,
        city,
        coverImage,
        status,
        tiers,
      }

      console.log('🚀 Sending POST to /api/events/manage with payload:', payload)

      const res = await fetch('/api/events/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('📥 Received API response:', data)

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update event.')
      }

      toast({
        title: 'Event Updated Successfully',
        description: 'Changes and audit logs have been recorded.',
        status: 'success',
        duration: 3000,
      })

      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      console.error('❌ Submission error:', err)
      toast({
        title: 'Update Failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Flex minH="100vh" bg="#0d0d0d" align="center" justify="center">
        <Spinner size="xl" color="#22c55e" thickness="4px" />
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="#0d0d0d" color="white" py="40px" px={{ base: '16px', md: '40px' }}>
      <Box maxW="800px" mx="auto">
        <Flex justify="space-between" align="center" mb="32px">
          <Box>
            <Heading size="lg" fontWeight="800">Edit Event Listing</Heading>
            <Text fontSize="14px" color="gray.500" mt="4px">
              Update details, manage dates, or adjust promotional ticket tiers.
            </Text>
          </Box>
          <Button
            variant="ghost"
            color="gray.400"
            _hover={{ bg: '#1c1c1c', color: 'white' }}
            onClick={() => router.push(`/${locale}/dashboard`)}
          >
            Cancel
          </Button>
        </Flex>

        <form onSubmit={handleSubmit}>
          <VStack spacing="24px" align="stretch">
            {/* GENERAL EVENT DETAILS */}
            <Box bg="#161616" p="24px" borderRadius="16px" border="1px solid #2a2a2a">
              <Heading size="md" mb="20px" color="#22c55e">1. Event Information</Heading>
              
              <VStack spacing="16px">
                <FormControl isRequired>
                  <FormLabel fontSize="13px" color="gray.400">Event Title</FormLabel>
                  <Input
                    bg="#0d0d0d"
                    borderColor="#333"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    _focus={{ borderColor: '#22c55e' }}
                  />
                </FormControl>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="16px" w="100%">
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel fontSize="13px" color="gray.400">Category</FormLabel>
                      <Select
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Events" style={{ background: '#161616' }}>Events</option>
                        <option value="Hospitality" style={{ background: '#161616' }}>Hospitality</option>
                        <option value="Dining" style={{ background: '#161616' }}>Dining</option>
                        <option value="Beauty" style={{ background: '#161616' }}>Beauty</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="13px" color="gray.400">Status</FormLabel>
                      <Select
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="PUBLISHED" style={{ background: '#161616' }}>Published</option>
                        <option value="DRAFT" style={{ background: '#161616' }}>Draft</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl isRequired>
                  <FormLabel fontSize="13px" color="gray.400">Description</FormLabel>
                  <Textarea
                    bg="#0d0d0d"
                    borderColor="#333"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FormControl>
              </VStack>
            </Box>

            {/* LOCATION & SCHEDULE */}
            <Box bg="#161616" p="24px" borderRadius="16px" border="1px solid #2a2a2a">
              <Heading size="md" mb="20px" color="#22c55e">2. Location & Schedule</Heading>
              
              <VStack spacing="16px">
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="16px" w="100%">
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel fontSize="13px" color="gray.400">Venue Name</FormLabel>
                      <Input
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel fontSize="13px" color="gray.400">City</FormLabel>
                      <Input
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl isRequired>
                  <FormLabel fontSize="13px" color="gray.400">Full Address</FormLabel>
                  <Input
                    bg="#0d0d0d"
                    borderColor="#333"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </FormControl>

                <Grid templateColumns={{ base: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap="16px" w="100%">
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel fontSize="12px" color="gray.400">Start Date</FormLabel>
                      <Input
                        type="date"
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="12px" color="gray.400">End Date</FormLabel>
                      <Input
                        type="date"
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel fontSize="12px" color="gray.400">Start Time</FormLabel>
                      <Input
                        placeholder="e.g. 7:00 PM"
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="12px" color="gray.400">End Time</FormLabel>
                      <Input
                        placeholder="e.g. 11:00 PM"
                        bg="#0d0d0d"
                        borderColor="#333"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </VStack>
            </Box>

            {/* TICKET TIERS MANAGEMENT */}
            <Box bg="#161616" p="24px" borderRadius="16px" border="1px solid #2a2a2a">
              <Flex justify="space-between" align="center" mb="20px">
                <Box>
                  <Heading size="md" color="#22c55e">3. Ticket Tiers</Heading>
                  <Text fontSize="12px" color="gray.500" mt="2px">
                    Hide expired promotional tiers (e.g. Early Bird) or create new ones.
                  </Text>
                </Box>
                <Button size="sm" bg="#22c55e" color="black" fontWeight="800" onClick={handleAddTier}>
                  + Add Tier
                </Button>
              </Flex>

              <VStack spacing="16px" align="stretch">
                {tiers.map((tier, idx) => (
                  <Box key={tier.id || idx} p="16px" bg="#0d0d0d" border="1px solid #2a2a2a" borderRadius="12px">
                    <Flex justify="space-between" align="center" mb="12px">
                      <HStack spacing="8px">
                        <Badge colorScheme={tier.id ? 'purple' : 'green'} fontSize="10px">
                          {tier.id ? 'Existing Tier' : 'New Tier'}
                        </Badge>
                        {(tier.sold || 0) > 0 && (
                          <Badge colorScheme="orange" fontSize="10px">
                            {tier.sold} Sold (Price Locked)
                          </Badge>
                        )}
                      </HStack>

                      {/* HIDE TIER SWITCH */}
                      <FormControl display="flex" alignItems="center" w="auto">
                        <FormLabel htmlFor={`hide-${idx}`} mb="0" fontSize="12px" color="gray.400" mr="8px">
                          Hide Tier
                        </FormLabel>
                        <Switch
                          id={`hide-${idx}`}
                          colorScheme="red"
                          isChecked={tier.isHidden || false}
                          onChange={(e) => handleTierChange(idx, 'isHidden', e.target.checked)}
                        />
                      </FormControl>
                    </Flex>

                    <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap="12px">
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel fontSize="11px" color="gray.500">Tier Name</FormLabel>
                          <Input
                            size="sm"
                            bg="#161616"
                            borderColor="#333"
                            isDisabled={!!tier.id && (tier.sold || 0) > 0}
                            value={tier.name}
                            onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel fontSize="11px" color="gray.500">Price (GHS)</FormLabel>
                          <Input
                            size="sm"
                            type="number"
                            bg="#161616"
                            borderColor="#333"
                            isDisabled={!!tier.id && (tier.sold || 0) > 0}
                            value={tier.price}
                            onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel fontSize="11px" color="gray.500">Capacity</FormLabel>
                          <Input
                            size="sm"
                            type="number"
                            bg="#161616"
                            borderColor="#333"
                            value={tier.capacity}
                            onChange={(e) => handleTierChange(idx, 'capacity', e.target.value)}
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              h="54px"
              bg="#22c55e"
              color="black"
              fontWeight="800"
              fontSize="16px"
              borderRadius="14px"
              _hover={{ bg: '#16a34a' }}
              isLoading={isSubmitting}
              loadingText="Saving Changes..."
            >
              Save Event Changes
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}