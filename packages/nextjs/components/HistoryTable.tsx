import React, { Fragment, useState } from "react";
import { CopyIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  CardBody,
  Heading,
  Icon,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useWalletClient } from "wagmi";
import { HistoricalTransaction, useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

export const HistoryTable = () => {
  const { transactions, addTransaction } = useLightningApp();
  const toast = useToast();
  const [expandedRow, setExpandedRow] = useState<number | null>(null); // State to manage expanded row index
  const { data: walletClient } = useWalletClient();
  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });
  const toggleRow = (index: number | null) => {
    setExpandedRow(expandedRow === index ? null : index); // Toggle between null and the current index
    if (index === null) return;

    if (transactions[index].status === "failed") {
      refund(transactions[index]);
    }
  };

  const toastAndCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      position: "top",
      title: message,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  function getTooltipText(transaction: HistoricalTransaction) {
    switch (transaction.status) {
      case "pending":
        return "Waiting for the transaction to be included in a block";
      case "completed":
        return "Expand for more details";
      case "failed":
        return `Transaction failed: Redeemable at ${new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}`;
      case "refunded":
        return "Transaction refunded";
      default:
        return "";
    }
  }

  function refund(transaction: HistoricalTransaction) {
    if (transaction.contractId === "") return;
    if (transaction.hashLockTimestamp > Date.now() / 1000) {
      return;
    }
    if (!yourContract) return;
    yourContract.write
      .refund([transaction.contractId as `0x${string}`], {})
      .then(tx => {
        console.log(tx);
        toast({
          position: "top",
          title: "Refund Success",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        addTransaction({
          status: "refunded",
          date: new Date().toLocaleString(),
          amount: transaction.amount,
          txHash: tx,
          contractId: transaction.contractId,
          hashLockTimestamp: transaction.hashLockTimestamp,
          lnInvoice: transaction.lnInvoice,
        });
      })
      .catch(e => {
        console.error(e);
        toast({
          position: "top",
          title: "Refund Failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  }

  return (
    <CardBody color={"white"} bg="brand.bg">
      <Heading fontFamily={"IBM Plex Mono"} textAlign={"center"} size={"md"} mb="5">
        History
      </Heading>
      <Table size={"sm"}>
        {transactions.length > 0 && (
          <>
            <Thead>
              <Tr>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((transaction, index) => (
                <React.Fragment key={index}>
                  <Tooltip label={getTooltipText(transaction)}>
                    <Tr
                      onClick={() => toggleRow(index)}
                      cursor={"pointer"}
                      bg={transaction.status === "failed" ? "red.400" : ""}
                      css={{
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      <Td>{transaction.status}</Td>

                      <Td>{transaction.date}</Td>
                      <Td isNumeric>{transaction.amount} sats</Td>
                      {/* <Td>
                      <Icon as={expandedRow === index ? <ChevronUpIcon /> : <ChevronDownIcon />} />
                    </Td> */}
                    </Tr>
                  </Tooltip>
                  {/* Expandable row for details */}
                  {expandedRow === index && (
                    <Tr>
                      <Td colSpan={3}>
                        <Box>
                          TimeLock exiry: {new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}
                          <br />
                          <br />
                          <Button
                            colorScheme="blue"
                            size="xs"
                            onClick={() => {
                              toastAndCopy(transaction.txHash, "Transaction hash copied to clipboard");
                            }}
                          >
                            <Icon as={CopyIcon} />
                          </Button>
                          &nbsp; txHash: {transaction.txHash.substring(0, 20)}...
                          <br />
                          <br />
                          <Button
                            colorScheme="blue"
                            size="xs"
                            onClick={() => {
                              toastAndCopy(transaction.contractId, "Contract ID copied to clipboard");
                            }}
                          >
                            <Icon as={CopyIcon} />
                          </Button>
                          &nbsp; contractId: {transaction.contractId.substring(0, 16)}...
                        </Box>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              ))}
            </Tbody>
          </>
        )}
        {transactions.length === 0 && (
          <Tr>
            <Td border={"#787878"} borderStyle={"dashed"} textAlign={"center"}>
              Send your first lightning transaction!
            </Td>
          </Tr>
        )}
      </Table>
    </CardBody>
  );
};
