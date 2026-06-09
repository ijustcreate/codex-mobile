// A shared page frame keeps mini projects visually consistent without coupling their logic.
export function pageLayout({ eyebrow, title, description, cards }) {
  const cardMarkup = cards.map((card, index) => `
    <article class="card">
      <span>0${index + 1}</span>
      <h2>${card.title}</h2>
      <p>${card.text}</p>
    </article>
  `).join("");

  return `
    <section class="page">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p class="lede">${description}</p>
      <div class="grid">${cardMarkup}</div>
    </section>
  `;
}
