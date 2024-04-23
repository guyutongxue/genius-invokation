#!/usr/bin/env python
# -*- coding: utf-8 -*-

# 本示例演示如何使用 Python 与 @gi-tcg/raw-server 进行通信
# 依赖项：websocket-client (pip install websocket-client)
# 启动服务器后，运行本脚本即可自动进行对局
# 本脚本在行动前设置了 1s 的暂停以观察输出
#（前往 http://localhost:3000 观看对局状态）

import websocket
import json
import random
import time
from typing import Any

_id = 0


def get_id():
    global _id
    _id += 1
    return _id


MY_DECK = {
    "characters": [1401, 2201, 2301],
    "cards": [
        312002,
        312008,
        312016,
        312201,
        312202,
        322001,
        322001,
        322005,
        322005,
        322008,
        322008,
        322016,
        322016,
        322020,
        330005,
        332004,
        332005,
        332005,
        332006,
        332008,
        332008,
        332013,
        332024,
        333002,
        333002,
        333003,
        333003,
        333006,
        333006,
        333007,
    ],
}
OPP_DECK = {
    "characters": [1104, 1107, 1407],
    "cards": [
        312004,
        312004,
        321011,
        322001,
        322007,
        322008,
        322008,
        322012,
        330002,
        331101,
        331101,
        331102,
        331102,
        331802,
        332001,
        332001,
        332002,
        332004,
        332004,
        332005,
        332005,
        332006,
        332008,
        332013,
        332018,
        333002,
        333003,
        333003,
        333006,
        333006,
    ],
}

state: Any = None


def on_message(ws, message):
    global state
    try:
        message = json.loads(message)
    except json.JSONDecodeError:
        return
    if "method" not in message:
        return
    if message["method"] == "notify":
        # 更新对局状态
        state = message["params"]["newState"]
        pass
    elif message["method"] == "rerollDice":
        # 重投所有不是万能的骰子
        reroll_indexes = [
            i for i, dice in enumerate(state["players"][0]["dice"]) if dice != 8
        ]
        send_rpc_result(ws, {"rerollIndexes": reroll_indexes}, message["id"])
        return
    elif message["method"] == "switchHands":
        # 总是不换手牌
        send_rpc_result(ws, {"removedHands": []}, message["id"])
        return
    elif message["method"] == "chooseActive":
        # 随机选择一个角色
        characters = message["params"]["candidates"]
        active = random.choice(characters)
        send_rpc_result(ws, {"active": active}, message["id"])
        return
    elif message["method"] == "action":
        time.sleep(1)
        # 随机选择一个零费行动（结束回合，或者零费行动牌）
        actions = message["params"]["candidates"]
        zero_cost_actions = [
            i
            for i, action in enumerate(actions)
            if action["type"] == "declareEnd"
            or (action["type"] == "playCard" and len(action["cost"]) == 0)
        ]
        index = random.choice(zero_cost_actions)
        print(actions[index])
        send_rpc_result(ws, {"chosenIndex": index, "cost": []}, message["id"])


def send_rpc_result(ws, result, id):
    ws.send(
        json.dumps(
            {
                "jsonrpc": "2.0",
                "result": result,
                "id": id,
            }
        )
    )


def on_error(ws, error):
    print(error)


def on_close(ws, close_status_code, close_msg):
    print("### closed ###")


def on_open(ws):
    print("Opened connection")
    # 连接建立后，使用 "ready" 消息初始化
    ws.send(
        json.dumps(
            {
                "jsonrpc": "2.0",
                "method": "ready",
                "params": {
                    "$who": 0,
                    "characters": MY_DECK["characters"],
                    "cards": MY_DECK["cards"],
                },
                "id": get_id(),
            }
        )
    )
    ws.send(
        json.dumps(
            {
                "jsonrpc": "2.0",
                "method": "ready",
                "params": {
                    "$who": 1,
                    "$useAgent": "dumb",  # 使用服务器内置 "dumb" 策略
                    "characters": OPP_DECK["characters"],
                    "cards": OPP_DECK["cards"],
                },
                "id": get_id(),
            }
        )
    )


if __name__ == "__main__":
    # websocket.enableTrace(True)
    ws = websocket.WebSocketApp(
        "ws://localhost:3000/play",
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
    )
    ws.run_forever()
