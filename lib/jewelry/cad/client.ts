"use client";

import { v4 as uuidv4 } from "uuid";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import type { CadRequest, CadResponse, TessellatedAssembly } from "./protocol";

const REQUEST_TIMEOUT_MS = 30_000;

class CadClient {
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (event: MessageEvent<CadResponse>) => {
        const pending = this.pending.get(event.data.id);
        if (!pending) return;
        this.pending.delete(event.data.id);
        if (event.data.success) pending.resolve(event.data.payload);
        else pending.reject(new Error(event.data.error));
      };
    }
    return this.worker;
  }

  private send<T>(req: CadRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(req.id);
        reject(new Error(`CAD worker timed out on "${req.type}"`));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(req.id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v as T);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.getWorker().postMessage(req);
    });
  }

  rebuild(category: JewelryCategory, tree: unknown): Promise<TessellatedAssembly> {
    return this.send({ id: uuidv4(), type: "rebuild", payload: { category, tree } });
  }

  async exportSTL(category: JewelryCategory, tree: unknown): Promise<Blob> {
    const { buffer } = await this.send<{ buffer: ArrayBuffer }>({
      id: uuidv4(),
      type: "exportSTL",
      payload: { category, tree },
    });
    return new Blob([buffer], { type: "model/stl" });
  }

  async exportSTEP(category: JewelryCategory, tree: unknown): Promise<Blob> {
    const { buffer } = await this.send<{ buffer: ArrayBuffer }>({
      id: uuidv4(),
      type: "exportSTEP",
      payload: { category, tree },
    });
    return new Blob([buffer], { type: "application/step" });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}

export const cadClient = new CadClient();
