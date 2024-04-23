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

import { t, Static } from "elysia";
import { TypeCompiler } from '@sinclair/typebox/compiler'

const JSON_RPC_REQUEST_T = t.Object(
  {
    jsonrpc: t.Literal("2.0"),
    method: t.String(),
    params: t.Optional(t.Any()),
    id: t.Optional(t.Union([t.String(), t.Number()])),
  },
  { description: "JSON-RPC request" },
);
const JSON_RPC_RESPONSE_SUCCESS_T = t.Object(
  {
    jsonrpc: t.Literal("2.0"),
    result: t.Any(),
    id: t.Union([t.String(), t.Number()]),
  },
  { description: "JSON-RPC response success" },
);
const JSON_RPC_RESPONSE_ERROR_T = t.Object(
  {
    jsonrpc: t.Literal("2.0"),
    error: t.Object({
      code: t.Number(),
      message: t.String(),
      data: t.Optional(t.Any()),
    }),
    id: t.Union([t.String(), t.Number()]),
  },
  { description: "JSON-RPC response error" },
);
export const CLIENT_MESSAGE_T = t.Union([
  JSON_RPC_REQUEST_T,
  JSON_RPC_RESPONSE_SUCCESS_T,
  JSON_RPC_RESPONSE_ERROR_T,
]);

export type JsonRpcRequest = Static<typeof JSON_RPC_REQUEST_T>;
export type JsonRpcResponseSuccess = Static<typeof JSON_RPC_RESPONSE_SUCCESS_T>;
export type JsonRpcResponseError = Static<typeof JSON_RPC_RESPONSE_ERROR_T>;
export type ClientMessage = Static<typeof CLIENT_MESSAGE_T>;

const READY_PARAM_T = t.Object({
  $who: t.Union([t.Literal(0), t.Literal(1)]),
  cards: t.Array(t.Number()),
  characters: t.Array(t.Number()),
  noShuffle: t.Optional(t.Boolean()),
  alwaysOmni: t.Optional(t.Boolean()),
  $useAgent: t.Optional(t.Any()),
});
type ReadyParam = Static<typeof READY_PARAM_T>;

export const validateReadyParam = TypeCompiler.Compile(READY_PARAM_T);

const GIVE_UP_PARAM_T = t.Object({
  $who: t.Union([t.Literal(0), t.Literal(1)]),
});
type GiveUpParam = Static<typeof GIVE_UP_PARAM_T>
export const validateGiveUpParam = TypeCompiler.Compile(GIVE_UP_PARAM_T);
