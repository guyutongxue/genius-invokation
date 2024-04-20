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
  mutations: [],
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
