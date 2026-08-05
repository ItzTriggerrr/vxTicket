// components/ui/ResponsiveViewportShell.tsx
"use client";

import { Box, Container, Flex } from "@chakra-ui/react";
import React from "react";

interface ShellProps {
  children: React.ReactNode;
}

export default function ResponsiveViewportShell({ children }: ShellProps) {
  return (
    <Box minH="100vh" bg="#090D16" w="full" transition="background-color 0.2s">
      <Container
        maxW={{
          base: "100%",      // Mobile Viewport: Consumes entire screen bounds flat
          sm: "540px",      // Phablet Devices
          md: "720px",      // iPad & Tablet Interfaces
          lg: "960px",      // Standard Laptops
          xl: "1200px",     // Desktop Presentation Monitors
          "2xl": "1440px"   // Wide Ultrawide Workspace Displays
        }}
        px={{ base: "16px", md: "24px", lg: "32px" }} // Smooth padding transitions
        py={{ base: "20px", md: "40px" }}
        mx="auto"
      >
        <Flex
          direction="column"
          w="full"
          align="center"
          justify="center"
          position="relative"
        >
          {children}
        </Flex>
      </Container>
    </Box>
  );
}
