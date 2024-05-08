export function Step3({ txHash }: { txHash: string }) {
  return (
    <div className="flex flex-col text-start w-full gap-2">
      <a
        href={`https://3xpl.com/botanix/transaction/${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-secondary rounded-none w-full"
      >
        View Transaction
      </a>
    </div>
  );
}
