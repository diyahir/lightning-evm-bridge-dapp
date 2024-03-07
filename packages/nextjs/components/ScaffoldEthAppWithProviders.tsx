"use client";

import { useEffect } from "react";
import { ChakraProvider, Flex } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { WagmiConfig } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { ProgressBar } from "~~/components/scaffold-eth/ProgressBar";
import theme from "~~/components/theme";
import { LightningProvider, useLightningApp } from "~~/hooks/LightningProvider";
import { useDarkMode } from "~~/hooks/scaffold-eth/useDarkMode";
import { useGlobalState } from "~~/services/store/store";
import { botanixTestnet } from "~~/services/web3/botanixTestnet";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { appChains } from "~~/services/web3/wagmiConnectors";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const { price } = useLightningApp();
  const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);

  useEffect(() => {
    if (price > 0) {
      setNativeCurrencyPrice(price);
    }
  }, [setNativeCurrencyPrice, price]);

  return (
    <>
      <Flex flexDir={"column"} minH={"100vh"} background={"brand.bg"}>
        <Header />
        <Flex dir="col" justifyContent={"center"} flex={1} className="relative flex flex-col flex-1">
          {children}
        </Flex>
        <Footer />
      </Flex>
      <Toaster />
    </>
  );
};

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useDarkMode();
  const emotionCache = createCache({
    key: "emotion-css-cache",
    prepend: true, // ensures styles are prepended to the <head>, instead of appended
  });

  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider theme={theme} cssVarsRoot="body">
        <WagmiConfig config={wagmiConfig}>
          <ProgressBar />
          <RainbowKitProvider
            chains={[...appChains.chains, botanixTestnet]}
            avatar={BlockieAvatar}
            theme={isDarkMode ? darkTheme() : lightTheme()}
          >
            <LightningProvider>
              <ScaffoldEthApp>{children}</ScaffoldEthApp>
            </LightningProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </ChakraProvider>
    </CacheProvider>
  );
};
