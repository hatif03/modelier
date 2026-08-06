import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

type Props = {
  opacity: string;
  handleInputChange: (property: string, value: string) => void;
};

const Opacity = ({ opacity, handleInputChange }: Props) => {
  const value = opacity === "" ? 100 : Number(opacity);

  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Opacity</h3>
        <Label className="text-xs text-foreground">{value}%</Label>
      </div>
      <Slider min={0} max={100} step={1} value={[value]} onValueChange={([next]) => handleInputChange("opacity", String(next))} />
    </div>
  );
};

export default Opacity;
