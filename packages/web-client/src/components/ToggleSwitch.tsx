import { type JSX } from "solid-js";

export function ToggleSwitch(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label class="relative inline-block h-6 aspect-ratio-[2/1]">
      <input type="checkbox" class="w-0 h-0 opacity-0 peer" {...props} />
      <span class="absolute cursor-pointer top-0 left-0 w-full h-full rounded-full bg-gray-500 b-2 b-gray-500 transition-colors transition-duration-400 peer-checked:bg-primary peer-checked:b-primary outline-primary outline-offset-2 peer-focus-visible-outline-solid flex flex-row items-center justify-start before:content-[''] before:h-full before:aspect-ratio-square before:bg-white before:transition-all before:transition-duration-400 before:rounded-full peer-checked:before:translate-x-[calc(100%+2px)]" />
    </label>
  );
}
