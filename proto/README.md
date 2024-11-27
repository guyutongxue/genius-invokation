# IO 格式 Protobuf Schema 源码

本文件夹定义参与 IO 的数据类型的 Protobuf 格式。

- `notification` 使用定义于 [`notification.proto`](./notification.proto) 的 `Notification` 消息类型；
- `rpc` 使用定义于 [`rpc.proto`](./rpc.proto) 的 `Request` 和 `Response` 消息类型。

## 关于构建

这些文件将使用 [Buf](https://buf.build) 以及 [`ts-proto`](https://github.com/stephenh/ts-proto) 插件生成 TypeScript 源码，包括具体消息的 TS 类型定义和编解码代码。

## 关于枚举

[`enums.proto`](./enums.proto) 定义了两种骰子类型 `DiceRequirementType` 和 `DiceType`，前者用于定义费用，后者用于定义真实骰子。由于两者的取值范围有别，故分开设计。出于历史原因和便捷起见，项目会混用两者；使用定义于 `src/common_enums.ts` 中的 `DiceType` 来同时提供两种骰子类型的常量值。
