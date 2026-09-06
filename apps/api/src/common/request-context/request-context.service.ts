import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T) {
    return this.storage.run(context, callback);
  }

  get() {
    return this.storage.getStore();
  }

  requestId() {
    return this.get()?.requestId ?? null;
  }
}
