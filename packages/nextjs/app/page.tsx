"use client";

import { Button, Card, CardFooter, CardHeader, Container, Heading, useDisclosure } from "@chakra-ui/react";
// import { QrScanner } from "@yudiel/react-qr-scanner";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { HistoryTable } from "~~/components/HistoryTable";
import SendModal from "~~/components/SendModalPopup";
import { useAccountBalance } from "~~/hooks/scaffold-eth";

// Import the CSS file with your animation

const Home: NextPage = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <Container alignContent={"center"} h="95%" justifyContent={"center"}>
      <Card>
        <CardHeader bg="brand.bg">
          <Heading fontFamily={"IBM Plex Mono"} mt="10%" textAlign={"center"} fontSize={"x-large"}>
            {" "}
            <span>{balance ? `${(balance * 100_000_000).toLocaleString()}` : "Loading Balance..."}</span> sats
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
          <Button onClick={onOpen} flex="1">
            Send over Lightning
          </Button>
        </CardFooter>
      </Card>

      <SendModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default Home;
