import { pageLayout } from "../components/page-layout.js";
export function render() {
  return pageLayout({ eyebrow: "Mini project 01", title: "Page<br>one.", description: "A blank canvas for your first focused idea.", cards: [
    { title: "Independent", text: "This page lives in its own small module." },
    { title: "Expandable", text: "Add features here without growing one massive file." },
    { title: "Purposeful", text: "Every section has a clear home." }
  ]});
}
