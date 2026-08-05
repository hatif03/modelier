const GenerationStatus = ({ message }: { message: string }) => (
  <div className="mx-5 rounded-sm border-l-2 border-accent bg-accent/5 p-3 text-sm text-foreground">{message}</div>
);

export default GenerationStatus;
