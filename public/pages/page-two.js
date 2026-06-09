import { pageLayout } from "../components/page-layout.js";
export function render() {
  return pageLayout({ eyebrow: "Mini project 02", title: "Page<br>two.", description: "A separate space, sharing only the design system it needs.", cards: [
    { title: "Fast", text: "No heavy framework or build process required." },
    { title: "Clear", text: "Readable files and gentle comments explain the structure." },
    { title: "Flexible", text: "Swap this content for your next useful tool." }
  ]});
}
