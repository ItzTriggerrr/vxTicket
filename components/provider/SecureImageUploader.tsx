// components/provider/SecureImageUploader.tsx
"use client";

import React, { useState, ChangeEvent } from "react";
import { Box, VStack, Text, Spinner, Center, Image, useToast } from "@chakra-ui/react";

interface UploaderProps {
  label: string;
  onUploadSuccess: (url: string) => void;
}

export default function SecureImageUploader({ label, onUploadSuccess }: UploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileSelection = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 🔒 CLIENT SIDE VALIDATION GUARD LINE (Instant Mobile Feedback Interface)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({ title: "File too massive", description: "Image file capacity cannot bypass structural 5MB limits.", status: "error", duration: 4000 });
      return;
    }

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(selectedFile)); // Fast client layout feedback loop simulation

    const uploadPayload = new FormData();
    uploadPayload.append("asset_file", selectedFile);

    try {
      const networkResponse = await fetch("/api/storage/upload", {
        method: "POST",
        body: uploadPayload
      });

      const responseData = await networkResponse.json();

      if (responseData.success && responseData.cdnUrl) {
        onUploadSuccess(responseData.cdnUrl);
        toast({ title: "Upload Success", description: "Listing visual asset successfully mapped onto cloud node nodes.", status: "success", duration: 3000 });
      } else {
        throw new Error(responseData.error || "Uplink validation parsing failure");
      }
    } catch (err: any) {
      setPreviewUrl(null);
      toast({ title: "Upload Failed", description: err.message || "Network link drop during storage delivery.", status: "error", duration: 5000 });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <VStack align="stretch" spacing="6px" w="full">
      <Text color="#94A3B8" fontSize="13px" fontWeight="600" fontFamily="Plus Jakarta Sans">{label}</Text>
      <Box
        as="label"
        position="relative"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        border="2px dashed"
        borderColor={isUploading ? "#6366F1" : "#334155"}
        borderRadius="16px"
        h="140px"
        cursor={isUploading ? "not-allowed" : "pointer"}
        bg="rgba(30, 41, 59, 0.3)"
        overflow="hidden"
        _hover={{ borderColor: isUploading ? "#6366F1" : "#64748B" }}
        transition="all 0.2s ease-in-out"
      >
        {previewUrl ? (
          <Image src={previewUrl} alt="Live Asset Stream Preview" w="full" h="full" objectFit="cover" opacity={isUploading ? 0.4 : 1} />
        ) : (
          <VStack spacing="4px" pointerEvents="none">
            <Text fontSize="12px" fontWeight="700" color="#64748B">Click or drag image file here</Text>
            <Text fontSize="10px" color="#475569">Permitted extensions: JPEG, PNG, WEBP (Max 5MB)</Text>
          </VStack>
        )}

        {isUploading && (
          <Center position="absolute" inset="0" bg="black/40" zIndex="2">
            <Spinner size="md" color="#6366F1" thickness="3px" />
          </Center>
        )}

        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelection} disabled={isUploading} style={{ display: 'none' }} />
      </Box>
    </VStack>
  );
}
