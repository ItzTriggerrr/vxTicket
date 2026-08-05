"use client";

import { useState } from "react";
import { Box, VStack, Text, Input, Button, Select, FormControl, FormLabel, Flex, useToast, Center } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function SecureRegistrationNode() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [isDeploying, setIsDeploying] = useState(false);
  
  const toast = useToast();
  const router = useRouter();

  const handleRegistration = async () => {
    if (!name || !email || !password) {
      toast({ title: "Validation Error", description: "All fields are required.", status: "warning", duration: 3000 });
      return;
    }

    setIsDeploying(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "Identity Node Deployed", description: "Registration successful. Please log in.", status: "success", duration: 4000 });
        router.push("/en/login"); 
      } else {
        throw new Error(data.error || "Failed to deploy identity");
      }
    } catch (error: any) {
      toast({ title: "Registration Fault", description: error.message, status: "error", duration: 5000 });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Center minH="100vh" bg="#090D16" py="40px">
      <Box p="32px" bg="#111827" borderRadius="24px" border="1px solid #1F2937" w="full" maxW="450px" boxShadow="2xl">
        <VStack spacing="24px" align="stretch">
          <Box>
            <Text fontSize="22px" fontWeight="800" color="white" fontFamily="Plus Jakarta Sans">Identity Generation</Text>
            <Text fontSize="13px" color="#94A3B8" mt="4px" fontFamily="Inter">Establish a secure vxTICKET access profile.</Text>
          </Box>

          <FormControl>
            <Flex justify="space-between" mb="4px">
              <FormLabel fontSize="13px" fontWeight="600" color="#94A3B8" mb="0">Full Name / Business Entity</FormLabel>
            </Flex>
            <Input 
              bg="#1E293B" color="white" borderColor="#334155" 
              value={name} onChange={(e) => setName(e.target.value)} 
              placeholder="e.g.  Azure Spa" 
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="13px" fontWeight="600" color="#94A3B8" mb="4px">Secure Email Matrix</FormLabel>
            <Input 
              type="email" bg="#1E293B" color="white" borderColor="#334155" 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              placeholder="hello@quickserve.com" 
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="13px" fontWeight="600" color="#94A3B8" mb="4px">Cryptographic Passkey</FormLabel>
            <Input 
              type="password" bg="#1E293B" color="white" borderColor="#334155" 
              value={password} onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="13px" fontWeight="600" color="#94A3B8" mb="4px">Network Access Clearance</FormLabel>
            <Select 
              bg="#1E293B" color="white" borderColor="#334155" 
              value={role} onChange={(e) => setRole(e.target.value)}
            >
              <option value="CUSTOMER">Customer (Book Services)</option>
              <option value="PROVIDER">Provider (Manage Assets)</option>
            </Select>
          </FormControl>

          <Button 
            w="full" h="52px" bg="#6366F1" color="white" _hover={{ bg: "#4F46E5" }} 
            fontSize="14px" fontWeight="700" mt="8px"
            onClick={handleRegistration}
            isLoading={isDeploying}
            loadingText="Deploying Identity..."
          >
            Initialize Account
          </Button>

          <Center mt="4px">
            <Text fontSize="12px" color="#64748B">
              Already have clearance? <Text as="span" color="#6366F1" cursor="pointer" fontWeight="700" onClick={() => router.push("/en/login")}>Log In</Text>
            </Text>
          </Center>
        </VStack>
      </Box>
    </Center>
  );
}