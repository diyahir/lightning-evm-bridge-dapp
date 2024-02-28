"use client";

import { useState } from "react";
import { Button, Card, CardFooter, CardHeader, Container, Heading, Tooltip, useDisclosure } from "@chakra-ui/react";
// import { QrScanner } from "@yudiel/react-qr-scanner";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { HistoryTable } from "~~/components/HistoryTable";
import SendModal from "~~/components/SendModalPopup";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useAccountBalance, useNativeCurrencyPrice } from "~~/hooks/scaffold-eth";

// Import the CSS file with your animation

const Home: NextPage = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);
  const { isWebSocketConnected, price } = useLightningApp();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [balanceVisibility, setBalanceVisibility] = useState(0);

  function getBalanceWithVisibility() {
    if (balance === null) return "Loading Balance...";
    if (balanceVisibility === 0) {
      return Math.floor(balance * 100_000_000).toLocaleString() + " sats";
    }
    if (balanceVisibility === 1) {
      return "$" + (balance * price).toFixed(2) + " USD";
    }
    if (balanceVisibility === 2) {
      return "****** sats";
    }
  }

  return (
    <Container alignContent={"center"} h="95%" justifyContent={"center"}>
      <Card>
        <CardHeader bg="brand.bg">
          <Heading
            style={{ cursor: "pointer" }}
            onClick={() => setBalanceVisibility((balanceVisibility + 1) % 3)}
            fontFamily={"IBM Plex Mono"}
            mt="10%"
            textAlign={"center"}
            fontSize={"x-large"}
          >
            {" "}
            <span>{getBalanceWithVisibility()}</span>
          </Heading>
        </CardHeader>

        <HistoryTable />

        <CardFooter
          bg="brand.bg"
          justify="space-between"
          flexWrap="wrap"
          sx={{
            "& > button": {
              minW: "136px",
            },
          }}
        >
          <Tooltip label={!isWebSocketConnected ? "Lightning Service Provider offline, try refreshing the page." : ""}>
            <Button isDisabled={!isWebSocketConnected} onClick={onOpen} flex="1">
              Send over Lightning
            </Button>
          </Tooltip>
        </CardFooter>
      </Card>

      <SendModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default Home;
