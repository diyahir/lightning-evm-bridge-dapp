"use client";

import { useEffect, useRef, useState } from "react";
import {
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  useSteps,
} from "@chakra-ui/react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { PaymentRequestObject, decode } from "bolt11";
import { useWalletClient } from "wagmi";
import { PaymentInvoice, steps } from "~~/components/PaymentInvoice";
import { useScaffoldContract, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import { useWebSocket } from "~~/hooks/useWebSocket";
import { LnPaymentInvoice } from "~~/types/utils";

type SendModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
function SendModal({ isOpen, onClose }: SendModalProps) {
  const [invoice, setInvoice] = useState<string>("");
  const lnInvoiceRef = useRef<LnPaymentInvoice | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { sendMessage, data } = useWebSocket("ws://localhost:3003");

  function cleanAndClose() {
    lnInvoiceRef.current = null;
    setInvoice("");
    setContractId(null);
    setTxHash(null);
    setActiveStep(1);
    onClose();
  }

  useEffect(() => {
    if (data?.status === "success") {
      setActiveStep(4);
      console.log("data", data);
    }
  }, [data]);

  const { data: walletClient } = useWalletClient();
  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: steps.length,
  });

  useScaffoldEventSubscriber({
    contractName: "HashedTimelock",
    eventName: "LogHTLCNew",
    listener: event => {
      const tmpContractId = event[0].args.contractId;
      if (event[0].transactionHash === txHash) return;
      if (!tmpContractId) return;
      if (lnInvoiceRef.current?.lnInvoice === undefined) return;
      setContractId(tmpContractId ? tmpContractId.toString() : null);
      sendMessage({ contractId: tmpContractId, lnInvoice: lnInvoiceRef.current?.lnInvoice });
      setActiveStep(3);
    },
  });

  function handleScan(data: any) {
    console.log("Scanning", data);
    handleInvoiceChange(data.text);
  }
  function handleError(err: any) {
    console.error(err);
  }

  function getPaymentHash(requestObject: PaymentRequestObject): `0x${string}` | undefined {
    // go through the tags and find the 'payment_hash' tagName and return the 'data'
    const paymentHash = requestObject.tags.find(tag => tag.tagName === "payment_hash");
    if (!paymentHash) {
      return undefined;
    }
    return ("0x" + paymentHash.data.toString()) as `0x${string}`;
  }

  function submitPayment() {
    if (!yourContract) return;
    if (!lnInvoiceRef.current) return;
    yourContract.write
      .newContract(
        [
          "0xf89335a26933d8Dd6193fD91cAB4e1466e5198Bf",
          lnInvoiceRef.current.paymentHash,
          BigInt(lnInvoiceRef.current.timeExpireDate),
        ],
        {
          value: BigInt(lnInvoiceRef.current.satoshis),
        },
      )
      .then(tx => {
        console.log("txHash", tx);
        setActiveStep(2);
        setTxHash(tx);
      })
      .catch(e => {
        console.error(e);
      });
  }

  function handleInvoiceChange(invoice: string) {
    try {
      setInvoice(invoice);
      const tempdecoded = decode(invoice);
      const paymentHash = getPaymentHash(tempdecoded);

      if (!tempdecoded.satoshis) return;
      if (!paymentHash) return;
      if (!tempdecoded.timeExpireDate) return;

      console;

      lnInvoiceRef.current = {
        satoshis: tempdecoded.satoshis,
        timeExpireDate: tempdecoded.timeExpireDate,
        paymentHash,
        lnInvoice: invoice,
      };
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={cleanAndClose}>
        <ModalOverlay />
        <ModalContent bg="brand.bg" h={"100%"} m="0">
          <ModalHeader textAlign={"center"}>{lnInvoiceRef.current == null ? "Scan QR Code" : "Review"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody h="100%" alignContent={"space-between"}>
            {/* Wallet Section */}
            {!lnInvoiceRef.current && (
              <VStack h="100%" alignContent={"space-between"} gap="20">
                <QrScanner
                  scanDelay={1}
                  onError={handleError}
                  onResult={result => handleScan(result)}
                  onDecode={result => handleScan(result)}
                />
                <InputGroup>
                  <InputLeftAddon
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        handleInvoiceChange(text);
                      });
                    }}
                  >
                    Paste
                  </InputLeftAddon>
                  <Input
                    type="text"
                    placeholder="ln1232...."
                    value={invoice}
                    onChange={e => handleInvoiceChange(e.target.value)}
                  />
                </InputGroup>
              </VStack>
            )}

            {lnInvoiceRef.current && (
              <PaymentInvoice
                invoice={lnInvoiceRef.current}
                submitPayment={submitPayment}
                contractId={contractId}
                step={activeStep}
                cancelPayment={() => {
                  lnInvoiceRef.current = null;
                  setInvoice("");
                  setContractId(null);
                }}
              ></PaymentInvoice>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default SendModal;
