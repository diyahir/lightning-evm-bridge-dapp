import { extendTheme } from "@chakra-ui/react";

// 2. Add your color mode config
const theme = extendTheme({
  colors: {
    brand: {
      bg: "#1f1f1f",
      // ...
      900: "#1a202c",
    },
  },
});

// 3. extend the theme

export default theme;
