"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Flex,
  Button,
  Divider,
  Badge,
} from "@chakra-ui/react";

interface LegalDoc {
  title: string;
  content: string;
  version: string;
  updatedAt: string;
}

export default function DynamicLegalPage() {
  const { slug } = useParams();
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      try {
        setLoading(true);
        const response = await fetch(`/api/legal/${slug}`);
        if (!response.ok) throw new Error("Not found");
        
        const data = await response.json();
        setDoc(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchDocument();
  }, [slug]);

  if (loading) {
    return (
      <Flex minH="100vh" bg="#0D0D0D" align="center" justify="center">
        <Spinner color="#22C55E" size="xl" thickness="4px" />
      </Flex>
    );
  }

  if (error || !doc) {
    return (
      <Flex minH="100vh" bg="#0D0D0D" direction="column" align="center" justify="center" px="20px">
        <Text color="#EF4444" fontSize="16px" fontWeight="600" mb="16px">Legal Document Load Error</Text>
        <Button bg="#161616" color="white" border="1px solid #2A2A2A" onClick={() => window.location.href = "/"}>
          Return Home
        </Button>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="#0D0D0D" color="white" py={{ base: "40px", md: "72px" }}>
      <Container maxW="container.md">
        
        {/* Branding Header Area */}
        <Flex justify="space-between" align="baseline" wrap="wrap" gap="12px" mb="24px">
          <Box>
            <Heading as="h1" size="xl" fontWeight="800" letterSpacing="-0.5px" color="white">
              {doc.title}
            </Heading>
            <Text fontSize="14px" color="#9CA3AF" mt="6px">
              Platform Governance Registry • QuickServe Network
            </Text>
          </Box>
          <Badge bg="rgba(34, 197, 94, 0.1)" color="#22C55E" px="10px" py="4px" borderRadius="6px">
            Version {doc.version}
          </Badge>
        </Flex>

        <Divider borderColor="#2A2A2A" mb="40px" />

        {/* Legal Text Body Module */}
        <Box 
          className="legal-content-wrapper" 
          fontSize="15px" 
          lineHeight="1.8" 
          color="#E5E7EB"
          whiteSpace="pre-wrap" // 🚀 Crucial: Preserves paragraph line breaks typed directly into Supabase cell
        >
          {doc.content}
        </Box>

        <Divider borderColor="#2A2A2A" my="40px" />

        {/* Footer Meta Tracking */}
        <Text fontSize="12px" color="#6B7280" textAlign="center">
          Last Updated: {new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. 
          All registered marketplace providers and consumers are strictly bound to this runtime policy revision.
        </Text>

      </Container>
    </Box>
  );
}