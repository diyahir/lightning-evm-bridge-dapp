"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Heading,
  Table,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
// import { QrScanner } from "@yudiel/react-qr-scanner";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import SendModal from "~~/components/SendModalPopup";
import { useAccountBalance } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <Container alignContent={"center"} h="95%">
      <Card>
        <CardHeader bg="brand.bg">
          <Heading fontFamily={"IBM Plex Mono"} mt="10%" textAlign={"center"} fontSize={"x-large"}>
            {" "}
            <span>{balance ? `${(balance * 100_000_000).toLocaleString()}` : "Loading Balance..."}</span> sats
          </Heading>
        </CardHeader>

        <CardBody bg="brand.bg">
          <Heading fontFamily={"IBM Plex Mono"} textAlign={"center"} size={"md"}>
            History
          </Heading>
          <Table size={"sm"}>
            <Thead>
              <Tr>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Amount</Th>
              </Tr>
            </Thead>

            <Tr>
              <Td>Completed</Td>
              <Td>12/12/2024</Td>
              <Td>1232</Td>
            </Tr>
            <Tr>
              <Td>Completed</Td>
              <Td>12/12/2024</Td>
              <Td>1232</Td>
            </Tr>
            <Tr>
              <Td>Completed</Td>
              <Td>12/12/2024</Td>
              <Td>1232</Td>
            </Tr>
          </Table>
        </CardBody>

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
            Send
          </Button>
          <Button flex="1">Recieve</Button>
        </CardFooter>
      </Card>

      <SendModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default Home;
