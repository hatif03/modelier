import { exportToPdf } from "@/lib/utils";

import { Button } from "../ui/button";

const Export = () => (
  <div className='flex flex-col gap-3 px-5 py-3'>
    <h3 className='text-[10px] uppercase tracking-widest text-muted-foreground'>Export</h3>
    <Button
      variant='outline'
      className='w-full border border-border bg-background text-foreground hover:border-accent hover:bg-background hover:text-accent'
      onClick={exportToPdf}
    >
      Export to PDF
    </Button>
  </div>
);

export default Export;
