import Image from "next/image";

import { getShapeInfo } from "@/lib/utils";

const LayersPanel = ({ allShapes }: { allShapes: Array<any> }) => (
  <div className="flex flex-col">
    {allShapes?.map((shape: any) => {
      const info = getShapeInfo(shape[1]?.type);

      return (
        <div
          key={shape[1]?.objectId}
          className="group my-1 flex items-center gap-2 border-l-2 border-l-transparent px-5 py-2.5 hover:cursor-pointer hover:border-l-accent hover:bg-accent/10"
        >
          <Image src={info?.icon} alt="Layer" width={16} height={16} className="invert" />
          <h3 className="text-sm font-semibold capitalize text-foreground">{info.name}</h3>
        </div>
      );
    })}
  </div>
);

export default LayersPanel;
