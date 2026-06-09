import { pageLayout } from "../components/page-layout.js";
export function render() {
  return pageLayout({ eyebrow: "Mini project 03", title: "Page<br>three.", description: "The third workspace, ready for an experiment of its own.", cards: [
    { title: "Private host", text: "The source and server stay on your computer." },
    { title: "Phone friendly", text: "Responsive layouts feel natural on a small screen." },
    { title: "Future ready", text: "A calm foundation designed to evolve." }
  ]});
}
