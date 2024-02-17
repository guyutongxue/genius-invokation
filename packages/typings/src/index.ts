// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import notifySchema from "./api/notification.json";
import rpcSchema from "./api/rpc.json";
import type { NotificationMessage } from "./api/notification";
import type { RpcMethod, RpcRequest } from "./api/request";
import type { RpcResponse } from "./api/response";
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
export * from "./api/notification";
export * from "./api/request";
export * from "./api/response";
export * from "./api/user";
export * from "./api/mutation";
