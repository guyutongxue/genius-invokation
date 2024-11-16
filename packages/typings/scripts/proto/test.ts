import protobuf from "protobufjs";

const root = protobuf.loadSync(`${import.meta.dirname}/../../proto/rpc.proto`);

const ActionRequest = root.lookupType("ActionRequest");
