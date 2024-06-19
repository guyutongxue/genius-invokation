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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

export interface CreateRoomDialogProps {
  ref: HTMLDialogElement;
}

export function CreateRoomDialog(props: CreateRoomDialogProps) {
  let dialogEl: HTMLDialogElement;
  const closeDialog = () => {
    dialogEl.close();
  };

  return (
    <dialog ref={(el) => (dialogEl = el) && (props.ref as any)?.(el)} >
      create room
      <button class="btn btn-ghost-red" onClick={closeDialog}>
        取消
      </button>
    </dialog>
  );
}
