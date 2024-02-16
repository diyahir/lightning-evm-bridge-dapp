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
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { LnPaymentInvoice } from "~~/types/utils";

type SendModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
function SendModal({ isOpen, onClose }: SendModalProps) {
  const [invoice, setInvoice] = useState<string>("");
  const [lnInvoice, setLnInvoice] = useState<LnPaymentInvoice | null>(null);

  const { data: walletClient } = useWalletClient();

  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
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
    yourContract.write.newContract(
      ["0x0f82D24134bDE2e536B801B26F120B8F60f54a9f", lnInvoice.paymentHash, BigInt(lnInvoice.timeExpireDate)],
      {
        value: BigInt(lnInvoice.satoshis),
      },
    );
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
                cancelPayment={() => {
                  setLnInvoice(null);
                  setInvoice("");
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
