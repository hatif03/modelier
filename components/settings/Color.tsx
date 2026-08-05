import { Label } from "../ui/label";

type Props = {
  inputRef: any;
  attribute: string;
  placeholder: string;
  attributeType: string;
  handleInputChange: (property: string, value: string) => void;
};

const Color = ({
  inputRef,
  attribute,
  placeholder,
  attributeType,
  handleInputChange,
}: Props) => (
  <div className='flex flex-col gap-3 border-b border-border p-5'>
    <h3 className='text-[10px] uppercase tracking-widest text-muted-foreground'>{placeholder}</h3>
    <div
      className='flex items-center gap-2 rounded-sm border border-border'
      onClick={() => inputRef.current.click()}
    >
      <input
        type='color'
        value={attribute}
        ref={inputRef}
        onChange={(e) => handleInputChange(attributeType, e.target.value)}
      />
      <Label className='flex-1 text-foreground'>{attribute}</Label>
      <Label className='flex h-6 w-8 items-center justify-center bg-muted text-[10px] leading-3 text-muted-foreground'>
        90%
      </Label>
    </div>
  </div>
);

export default Color;
