import { extendTheme } from "@chakra-ui/react";

// 2. Add your color mode config
const theme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: false,
  colors: {
    brand: {
      bg: "#1f1f1f",
      // ...
      900: "#1a202c",
    },
  },
  styles: {
    global: () => ({
      body: {
        bg: "",
      },
    }),
  },
});

// 3. extend the theme

export default theme;
