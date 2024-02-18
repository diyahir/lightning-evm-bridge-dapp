import { CardBody, Heading, Table, Td, Th, Thead, Tr } from "@chakra-ui/react";

export const HistoryTable = () => {
  //   const { transactions } = useLightningApp();

  const transactions = [
    {
      status: "Paid",
      date: "2021-10-10",
      amount: "1000 sats",
    },
    {
      status: "Paid",
      date: "2021-10-10",
      amount: "1000 sats",
    },
    {
      status: "Paid",
      date: "2021-10-10",
      amount: "1000 sats",
    },
    {
      status: "Paid",
      date: "2021-10-10",
      amount: "1000 sats",
    },
    {
      status: "Paid",
      date: "2021-10-10",
      amount: "1000 sats",
    },
  ];
  return (
    <CardBody bg="brand.bg">
      <Heading fontFamily={"IBM Plex Mono"} textAlign={"center"} size={"md"} mb="5">
        History
      </Heading>
      <Table size={"sm"}>
        {transactions.length !== 0 && (
          <>
            <Thead>
              <Tr>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
              </Tr>
            </Thead>
            {transactions.map((transaction, index) => {
              if (index < 5)
                return (
                  <Tr key={index}>
                    <Td>{transaction.status}</Td>
                    <Td>{transaction.date}</Td>
                    <Td isNumeric>{transaction.amount}</Td>
                  </Tr>
                );
            })}
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
