import { pageLayout } from "../components/page-layout.js";

export function render() {
  return pageLayout({
    eyebrow: "Your workspace is live",
    title: "Hello<br>world.",
    description: "A small, fast foundation for ideas that deserve their own space. Each page is isolated, modular, and ready to become something bigger.",
    cards: [
      { title: "Minimal by design", text: "A focused interface with just enough structure." },
      { title: "Built in modules", text: "Change one mini project without disturbing another." },
      { title: "Ready anywhere", text: "Launch locally, then open it from your phone." }
    ]
  });
}
