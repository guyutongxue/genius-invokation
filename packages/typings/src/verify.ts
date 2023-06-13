import { MethodNames, RequestType, ResponseType, API } from "./api";
import Ajv from "ajv";

const ajv = new Ajv();

function doVerify(schemaMap: object, data: unknown) {
  const schema = {
    type: "object",
    required: Object.keys(schemaMap),
    properties: schemaMap,
  };
  return ajv.validate(schema, data);
}

export function verifyRequest<K extends MethodNames>(
  method: K,
  request: unknown
): asserts request is RequestType<K> {
  const { params } = API[method];
  if (!doVerify(params, request)) {
    throw new Error(ajv.errorsText());
  }
}

export function verifyResponse<K extends MethodNames>(
  method: K,
  response: unknown
): asserts response is ResponseType<K> {
  const { result } = API[method];
  if (!doVerify(result, response)) {
    throw new Error(ajv.errorsText());
  }
}
