import { W as head, Y as attr } from './index2-BI7tZrFT.js';
import './exports-CgQJUv15.js';
import './state.svelte-ClWQPWuE.js';
import { e as escape_html } from './context-DDZhjpoT.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let joinCode = "";
    let creating = false;
    head("545apf", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Auction Tic-Tac-Toe | Damien's Arcade</title>`);
      });
    });
    $$renderer2.push(`<div class="landing svelte-545apf"><header class="svelte-545apf"><h1>Auction Tic-Tac-Toe</h1> <p>Bid on squares to claim them in this strategic twist on tic-tac-toe!</p></header> <div class="actions svelte-545apf"><section class="svelte-545apf"><h2>Create a Room</h2> <button${attr("disabled", creating, true)} class="svelte-545apf">${escape_html("Create Room")}</button></section> <section class="svelte-545apf"><h2>Join a Room</h2> <input type="text"${attr("value", joinCode)} placeholder="Enter room code" style="text-transform: uppercase" class="svelte-545apf"/> <button${attr("disabled", !joinCode.trim(), true)} class="svelte-545apf">Join</button></section></div> <section class="how-to-play svelte-545apf"><h2>How to Play</h2> <ol class="svelte-545apf"><li>Two players compete to get three in a row</li> <li>On your turn, nominate a square and set a starting bid</li> <li>Your opponent can outbid you or pass</li> <li>Highest bidder gets the square and pays their bid</li> <li>Manage your money wisely to win!</li></ol></section> <a href="/" class="svelte-545apf">← Back to Arcade</a></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DEs5BXvc.js.map
