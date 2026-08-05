// app/layout.tsx
import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../shared/context/AuthContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* We wrap the entire app in AuthProvider so state survives page navigations */}
        <AuthProvider>
          <ChakraProvider>
            {children}
          </ChakraProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

