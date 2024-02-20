import { type JSX } from "solid-js";
import { render } from "solid-js/web";
import {
  EMPTY_STATE_DATA,
  PlayerIOWithCancellation,
  StandaloneChessboard,
  StandaloneChessboardProps,
  WebUiOption,
  createPlayer as createPlayerSolid,
} from "@gi-tcg/webui-core";
import css from "@gi-tcg/webui-core/style.css?inline";
import { customElement } from "solid-element";

export function createPlayer(
  element: HTMLElement,
  who: 0 | 1,
  opt?: WebUiOption,
) {
  const shadow = element.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);
  let io: PlayerIOWithCancellation;
  render(() => {
    let Chessboard: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
    [io, Chessboard] = createPlayerSolid(who, opt);
    return <Chessboard style={{ width: "100%", height: "100%" }} />;
  }, shadow);
  return io!;
}

const defaultProps: StandaloneChessboardProps = {
  stateData: EMPTY_STATE_DATA,
  who: 0,
  events: [],
  assetApiEndpoint: void 0,
};

customElement(
  "gi-tcg-standalone-chessboard",
  defaultProps,
  (props, { element }) => {
    return (
      <>
        <style>{css}</style>
        <StandaloneChessboard {...props} />
      </>
    );
  },
);
