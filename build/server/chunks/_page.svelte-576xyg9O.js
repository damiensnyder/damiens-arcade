import { V as head, W as ensure_array_like, X as attr, Y as attr_class } from './index2-w53_U3TB.js';
import { e as escape_html } from './context-DDZhjpoT.js';

function _page($$renderer) {
  const games = [
    {
      id: "auction-ttt",
      name: "Auction Tic-Tac-Toe",
      description: "Bid on squares to claim them in this strategic twist on tic-tac-toe",
      players: "2 players",
      duration: "5-10 min",
      available: true
    },
    {
      id: "mayhem-manager",
      name: "Mayhem Manager",
      description: "Build a team of fighters and compete in tournaments",
      players: "2-8 players",
      duration: "30-60 min",
      available: false
      // Not yet ported
    },
    {
      id: "daily-qless",
      name: "Daily Q-less",
      description: "Today's crossword puzzle without the letter Q",
      players: "Solo",
      duration: "5-15 min",
      available: false
      // Not yet ported
    }
  ];
  head("1uha8ag", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>Damien's Arcade</title>`);
    });
  });
  $$renderer.push(`<div class="homepage svelte-1uha8ag"><header class="svelte-1uha8ag"><h1 class="svelte-1uha8ag">Damien's Arcade</h1> <p class="svelte-1uha8ag">Multiplayer games for you and your friends</p></header> <div class="game-grid svelte-1uha8ag"><!--[-->`);
  const each_array = ensure_array_like(games);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let game = each_array[$$index];
    $$renderer.push(`<a${attr("href", game.available ? `/${game.id}` : "#")}${attr_class("game-card svelte-1uha8ag", void 0, { "disabled": !game.available })}><h2 class="svelte-1uha8ag">${escape_html(game.name)}</h2> <p class="description svelte-1uha8ag">${escape_html(game.description)}</p> <div class="meta svelte-1uha8ag"><span>${escape_html(game.players)}</span> <span>${escape_html(game.duration)}</span></div> `);
    if (!game.available) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<span class="coming-soon svelte-1uha8ag">Coming Soon</span>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></a>`);
  }
  $$renderer.push(`<!--]--></div></div>`);
}

export { _page as default };
//# sourceMappingURL=_page.svelte-576xyg9O.js.map
