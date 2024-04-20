import { DetailLogEntry, DetailLogType } from "@gi-tcg/core";
import { For, Show, createResource, createSignal, onMount } from "solid-js";

export interface DetailLogViewerProps {
  log: DetailLogEntry;
}

export function DetailLogViewer(props: DetailLogViewerProps) {
  const [open, setOpen] = createSignal(false);
  const toggleOpen = () => setOpen(!open());
  const color = () => {
    switch (props.log.type) {
      case DetailLogType.Event:
        return "darkgreen";
      case DetailLogType.Skill:
        return "darkred";
      case DetailLogType.Primitive:
        return "black";
      case DetailLogType.Mutation:
        return "lightblue";
      case DetailLogType.Phase:
        return "brown";
      default:
        return "gray";
    }
  };
  const [names] = createResource(
    () => import("./names.json") as Promise<{ default: Record<number, string> }>,
  );
  const text = () => {
    if (names.loading) {
      return props.log.value;
    } else {
      const reg = /\[(\w+?):([\d.]+?)\]/g;
      return props.log.value.replaceAll(
        reg,
        (origStr, type, idStr): string => {
          const id = Number(idStr);
          switch (type) {
            case "dice":
              return (
                [
                  "无色",
                  "冰",
                  "水",
                  "火",
                  "雷",
                  "风",
                  "岩",
                  "草",
                  "万能",
                  "充能",
                ][id] ?? origStr
              );
            case "aura":
              if (id > 16) return "冰草";
              else
                return (
                  ["空", "冰", "水", "火", "雷", "风", "岩", "草"][id] ??
                  origStr
                );
            case "damage":
              return (
                [
                  "物理",
                  "冰",
                  "水",
                  "火",
                  "雷",
                  "风",
                  "岩",
                  "草",
                  "治疗",
                  "复活治疗",
                ][id] ?? origStr
              );
            default: {
              const rid = Math.floor(id);
              console.log(names(), rid);
              let result = names()!.default[rid];
              if (result) {
                if (rid !== id) {
                  result += "的响应技能";
                }
                return result;
              } else {
                return origStr;
              }
            }
          }
        },
      );
    }
  };
  return (
    <div class="detail-log">
      <div class="detail-log__parent">
        <Show when={props.log.children?.length}>
          <button class="detail-log__toggle-button" onClick={toggleOpen}>
            {open() ? "-" : "+"}
          </button>
        </Show>
        <span class="detail-log__text" style={{ color: color() }}>
          {text()}
        </span>
      </div>
      <div class="detail-log__children">
        <Show when={open()}>
          <For each={props.log.children}>
            {(child) => <DetailLogViewer log={child} />}
          </For>
        </Show>
      </div>
    </div>
  );
}
