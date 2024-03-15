# PvP 中转 worker

利用 CloudFlare D1 数据库保存连接状态，实现 PvP 对局。

## 原理图

```mermaid
sequenceDiagram
  actor Host
  box CloudFlare Worker
    participant wsHost as WebSocket
    participant DB as CloudFlare D1
    participant wsGuest as WebSocket
  end
  actor Guest

  Host->>wsHost: initialize
  wsHost-->>DB: activate free room id
  wsHost->>Host: reply:initialize, roomId
  Guest->>wsGuest: initialize, roomId
  wsGuest->>Guest: reply:initialize
  Host->>wsHost: notify / rpc
  wsHost-->>DB: insert new messages
  loop every 500ms
    wsGuest-->>DB: has new message?
  end
  DB-->>wsGuest: new messages
  wsGuest->>Guest: notify / rpc
  wsGuest-->>DB: delete consumed messages
  Guest->>wsGuest: reply:rpc / giveUp
  wsGuest-->>DB: insert new messages
  loop every 500ms
    wsHost-->>DB: has new message?
  end
  DB-->>wsHost: new messages
  wsHost->>Host: reply:rpc / giveUp
  wsHost-->>DB: delete consumed messages
  Guest->>wsGuest: close
  wsGuest-->>DB: delete and free data
  Host->>wsHost: close
  wsHost-->>DB: delete and free data
```

## API

### 创建房间

```
ws://HOST/ws/request-room
```

发送 `{ "method": "initialize" }`，等待 `{ "method": "reply:initialize", "roomId": xxx }` 响应获取房间号。

### 加入房间

```
ws://HOST/ws/room/:id
```

发送 `{ "method": "initialize" }`，等待 `{ "method": "reply:initialize" }` 响应。

### 传输数据

- Host 端发送任意 `method` 为 `rpc` 或 `notify` 的消息；
- Guest 端发送任意 `method` 为 `reply:pc` 或 `giveUp` 的消息；
- 对方会在 500ms 左右后收到。

