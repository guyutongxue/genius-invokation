import { DeckBuilderProps, DeckBuilder } from "@gi-tcg/deck-builder";
import "@gi-tcg/deck-builder/style.css";
import { createSignal, onCleanup, onMount } from "solid-js";

export function SizedDeckBuilder(props: DeckBuilderProps) {
  const [componentWidth, setComponentWidth] = createSignal<number>();
  const [componentHeight, setComponentHeight] = createSignal<number>();
  let containerEl!: HTMLDivElement;
  const observer = new ResizeObserver(() => {
    setComponentWidth(containerEl.clientWidth);
    setComponentHeight(containerEl.clientHeight);
  });

  onMount(() => {
    observer.observe(containerEl);
  });
  onCleanup(() => {
    observer.unobserve(containerEl);
  });

  return (
    <div class="flex-grow-1" ref={containerEl!}>
      <DeckBuilder
        {...props}
        style={{
          width: componentWidth() ? `${componentWidth()}px` : void 0,
          height: componentHeight() ? `${componentHeight()}px` : void 0,
        }}
      />
    </div>
  );
}
