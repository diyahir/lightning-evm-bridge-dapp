import React from "react";
import { CopyIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Table,
  Tbody,
  Td,
  Tr,
} from "@chakra-ui/react";
import { DotLoader } from "react-spinners";
import { LnPaymentInvoice } from "~~/types/utils";

/**
 * Site footer
 */
type PaymentInvoiceProps = {
  invoice: LnPaymentInvoice;
  contractId: string | null;
  submitPayment: () => void;
  cancelPayment: () => void;
  step: number;
};

export const steps = [
  { title: "Verify Invoice", description: "Verify the invoice is correct" },
  { title: "Pay deposit", description: "On-chain invoice locked in smart contract" },
  {
    title: "Waiting to be included in a block",
    description: "The invoice id is sent and verified by the lightning provider",
  },
  { title: "Paid", description: "The lightning provider pays lightning invoice. The reciever must be online." },
];

export const PaymentInvoice = ({ invoice, contractId, submitPayment, cancelPayment, step }: PaymentInvoiceProps) => {
  const expiryDate = new Date(invoice.timeExpireDate * 1000);

  return (
    <Flex h="100%" flexDir={"column"} justifyContent={"space-evenly"} alignContent={"space-evenly"}>
      <Table size={"xs"}>
        <Tbody>
          <Tr>
            <Td border="transparent">Expiry Time</Td>
            <Td border="transparent" textAlign={"end"}>
              {expiryDate.toLocaleTimeString()}
            </Td>
          </Tr>
          <Tr>
            <Td border="transparent">Amount</Td>
            <Td border="transparent" textAlign={"end"}>
              {invoice.satoshis} sats
            </Td>
          </Tr>
          {/* <Tr>
            <Td border="transparent">USD</Td>
            <Td border="transparent" textAlign={"end"}>
              ${invoice.satoshis}
            </Td>
          </Tr> */}
          <Tr>
            <Td border="transparent">Contract Id</Td>
            <Td border="transparent" textAlign={"end"}>
              {contractId ? contractId.substring(0, 10) + "... " : "Pending"}
              {contractId && (
                <Button
                  colorScheme="blue"
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(contractId || "");
                  }}
                >
                  <Icon as={CopyIcon} />
                </Button>
              )}
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <Stepper index={step} orientation="vertical" height="" gap="0">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<DotLoader color="#90cdf4" size="42px" />}
              />
            </StepIndicator>

            <Box>
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      {step < 2 && (
        <ButtonGroup colorScheme="red" width={"100%"} isDisabled={step !== 1}>
          <Button width={"100%"} onClick={() => cancelPayment()} isLoading={step == 2 || step == 3}>
            Cancel
          </Button>
          <Button colorScheme="green" width={"100%"} onClick={() => submitPayment()} isLoading={step == 2 || step == 3}>
            Pay
          </Button>
        </ButtonGroup>
      )}
      {step >= 2 && (
        <Button width={"100%"} onClick={() => cancelPayment()} isDisabled={step == 2 || step == 3}>
          Close
        </Button>
      )}
    </Flex>
  );
};
