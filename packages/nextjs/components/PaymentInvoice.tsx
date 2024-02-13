import React from "react";
import { Button, ButtonGroup, Container, Table, Tbody, Td, Tr } from "@chakra-ui/react";
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
  return (
    <Container>
      <Table width={"100%"} overflowX={"scroll"}>
        <Tbody>
          <Tr>
            <Td>Expiry Time</Td>
            <Td textAlign={"end"}>{invoice.timeExpireDate}</Td>
          </Tr>
          <Tr>
            <Td>Payment amount</Td>
            <Td textAlign={"end"}>{invoice.satoshis} sats</Td>
          </Tr>
        </Tbody>
      </Table>
      <ButtonGroup colorScheme="red" width={"100%"}>
        <Button width={"100%"} onClick={() => cancelPayment()}>
          Cancel Payment
        </Button>
        <Button colorScheme="green" width={"100%"} onClick={() => submitPayment()}>
          Confirm Payment
        </Button>
      </ButtonGroup>
    </Container>
  );
};
