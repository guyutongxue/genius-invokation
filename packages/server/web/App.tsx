import { onMount } from "solid-js"

export function App() {
  onMount(() => {
    console.log("Hello World!")
  })
  return <div>Hello from server</div>;
}
