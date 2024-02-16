"use client";

import { useState } from "react";
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
} from "@chakra-ui/react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { PaymentRequestObject, decode } from "bolt11";
import { useWalletClient } from "wagmi";
import { PaymentInvoice } from "~~/components/PaymentInvoice";
import { useScaffoldContract, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import { LnPaymentInvoice } from "~~/types/utils";

type SendModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
function SendModal({ isOpen, onClose }: SendModalProps) {
  const [invoice, setInvoice] = useState<string>("");
  const [lnInvoice, setLnInvoice] = useState<LnPaymentInvoice | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();

  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  useScaffoldEventSubscriber({
    contractName: "HashedTimelock",
    eventName: "LogHTLCNew",
    listener: event => {
      const tmpContractId = event[0].args.contractId;
      if (event[0].transactionHash === txHash) return;
      setContractId(tmpContractId ? tmpContractId.toString() : null);
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
    if (!lnInvoice) return;
    yourContract.write
      .newContract(
        ["0xf89335a26933d8Dd6193fD91cAB4e1466e5198Bf", lnInvoice.paymentHash, BigInt(lnInvoice.timeExpireDate)],
        {
          value: BigInt(lnInvoice.satoshis),
        },
      )
      .then(tx => {
        console.log("txHash", tx);
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
      console.log(tempdecoded);
      const paymentHash = getPaymentHash(tempdecoded);

      if (!tempdecoded.satoshis) return;
      if (!paymentHash) return;
      if (!tempdecoded.timeExpireDate) return;

      setLnInvoice({
        satoshis: tempdecoded.satoshis,
        timeExpireDate: tempdecoded.timeExpireDate,
        paymentHash,
        lnInvoice: invoice,
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent h={"100%"} m="0">
          <ModalHeader textAlign={"center"}>{lnInvoice == null ? "Scan QR Code" : "Review"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Wallet Section */}
            {!lnInvoice && (
              <VStack>
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

            {lnInvoice && (
              <PaymentInvoice
                invoice={lnInvoice}
                submitPayment={submitPayment}
                contractId={contractId}
                cancelPayment={() => {
                  setLnInvoice(null);
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
