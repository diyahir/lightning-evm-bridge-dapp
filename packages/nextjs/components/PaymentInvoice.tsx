import React from "react";
import { Button, ButtonGroup, Flex, Table, Tbody, Td, Tr } from "@chakra-ui/react";
import { LnPaymentInvoice } from "~~/types/utils";

/**
 * Site footer
 */
type PaymentInvoiceProps = {
  invoice: LnPaymentInvoice;
  submitPayment: () => void;
  cancelPayment: () => void;
};
export const PaymentInvoice = ({ invoice, submitPayment, cancelPayment }: PaymentInvoiceProps) => {
  const expiryDate = new Date(invoice.timeExpireDate * 1000);
  return (
    <Flex h="100%" flexDir={"column"} justifyContent={"center"} alignContent={"center"}>
      <Table>
        <Tbody>
          <Tr>
            <Td>Expiry Time</Td>
            <Td textAlign={"end"}>{expiryDate.toLocaleTimeString()}</Td>
          </Tr>
          <Tr>
            <Td>Amount</Td>
            <Td textAlign={"end"}>{invoice.satoshis} sats</Td>
          </Tr>
          <Tr>
            <Td>USD</Td>
            <Td textAlign={"end"}>${invoice.satoshis}</Td>
          </Tr>
        </Tbody>
      </Table>
      <ButtonGroup my="20%" colorScheme="red" width={"100%"}>
        <Button width={"100%"} onClick={() => cancelPayment()}>
          Cancel
        </Button>
        <Button colorScheme="green" width={"100%"} onClick={() => submitPayment()}>
          Pay
        </Button>
      </ButtonGroup>
    </Flex>
  );
};
