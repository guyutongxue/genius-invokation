import notifySchema from "./api/notification.json";
import rpcSchema from "./api/rpc.json";
import type { NotificationMessage } from "./api/notification";
import type { RpcMethod, RpcRequest } from "./api/request";
import type { Handler, RpcResponse } from "./api/response";
import Ajv from "ajv";

const ajv = new Ajv();

export function verifyNotificationMessage(
  message: unknown
): asserts message is NotificationMessage {
  const validate = ajv.compile(notifySchema);
  if (!validate(message)) {
    throw new Error("Notification: " + ajv.errorsText(validate.errors));
  }
}

export function verifyRpcRequest<M extends RpcMethod>(
  method: M,
  params: unknown
): asserts params is RpcRequest[M] {
  const validate = ajv.compile(rpcSchema[method].request);
  if (!validate(params)) {
    throw new Error(
      `Rpc Request ${method}: ${ajv.errorsText(validate.errors)}`
    );
  }
}

export function verifyRpcResponse<M extends RpcMethod>(
  method: M,
  response: unknown
): asserts response is RpcResponse[M] {
  const validate = ajv.compile(rpcSchema[method].response);
  if (!validate(response)) {
    throw new Error(
      `Rpc Response ${method}: ${ajv.errorsText(validate.errors)}`
    );
  }
}

export * from "./enums";
