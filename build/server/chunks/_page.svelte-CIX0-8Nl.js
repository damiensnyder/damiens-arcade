import { V as head, X as attr, W as ensure_array_like } from './index2-w53_U3TB.js';
import './exports-CgQJUv15.js';
import './state.svelte-ClWQPWuE.js';
import { S as Side } from './types-DqNVlIiB.js';
import { e as escape_html } from './context-DDZhjpoT.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let joinCode = "";
    let creating = false;
    let hotSeat = false;
    let settings = {
      startingMoney: 100,
      startingPlayer: Side.None,
      useTiebreaker: false
    };
    head("545apf", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Auction Tic-Tac-Toe | Damien's Arcade</title>`);
      });
    });
    $$renderer2.push(`<div class="center-container svelte-545apf"><h1 class="svelte-545apf">Auction Tic-Tac-Toe</h1> <div class="top-level-menu svelte-545apf"><div class="menu-section svelte-545apf"><h2>Create a Room</h2> <h3 class="svelte-545apf">Game Settings</h3> <form><div class="form-field"><label for="startingMoney">Starting money:</label> <input type="number" id="startingMoney"${attr("min", 0)}${attr("value", settings.startingMoney)}/></div> <div class="form-field"><label for="startingPlayer">Starting player:</label> `);
    $$renderer2.select({ id: "startingPlayer", value: settings.startingPlayer }, ($$renderer3) => {
      $$renderer3.push(`<!--[-->`);
      const each_array = ensure_array_like(Object.values(Side));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let side = each_array[$$index];
        $$renderer3.option({ value: side }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(side === Side.None ? "Random" : side)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</div> <div class="form-field"><label for="useTiebreaker"><input id="useTiebreaker" type="checkbox"${attr("checked", settings.useTiebreaker, true)}/> Use time as tiebreaker</label></div> <div class="form-field"><label for="hotSeat"><input id="hotSeat" type="checkbox"${attr("checked", hotSeat, true)}/> Hot seat mode (play both sides on one device)</label></div> <button type="submit"${attr("disabled", creating, true)}>${escape_html("CREATE ROOM")}</button></form></div> <div class="menu-section svelte-545apf"><h2>Join a Room</h2> <form><div class="form-field"><label for="roomCode">Room code:</label> <input id="roomCode" type="text"${attr("value", joinCode)} placeholder="ABCD" style="text-transform: uppercase"/></div> <button type="submit"${attr("disabled", !joinCode.trim(), true)}>JOIN ROOM</button></form> <h3 style="margin-top: 2rem;" class="svelte-545apf">How to Play</h3> <ol style="text-align: left; margin: 0; padding-left: 1.5rem;"><li>Two players compete to get three in a row</li> <li>On your turn, nominate a square and set a starting bid</li> <li>Your opponent can outbid you or pass</li> <li>Highest bidder gets the square and pays their bid</li> <li>Manage your money wisely to win!</li></ol></div></div> <a href="/" class="back-link svelte-545apf">← Back to Arcade</a></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CIX0-8Nl.js.map
