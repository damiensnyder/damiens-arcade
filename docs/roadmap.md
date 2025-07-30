# TOP PRIORITY TECH DEBT - MUST BE FIXED BEFORE PROCEEDING TO OTHER ROADMAP ITEMS

- The Vite dev server setup is a hideous hack. The Express server and the SvelteKit server should
  just run separately (though share the same types and utils). Probably with concurrently.
- Routes need a rework:
    /: has links to each game's page, and nothing else aside from the page title, at least to
      begin with
    /auction-tic-tac-toe: pick your settings and create or join an ATTT game room
    /auction-tic-tac-toe/[roomCode]: play ATTT (must return to above route to edit settings)
    /daily-qless: this one doesn't need to change :)
    /mayhem-manager: create or join a Mayhem Manager game room
    /mayhem-manager/[roomCode]: play MM
  And then the Express backend routes should be:
    /auction-tic-tac-toe/create-room (note my slight rename of the route)
    /mayhem-manager/create-room
  Removing the /listActiveRooms routes. So everything that was made unnecessarily modular for that
  can be made more sensible.
- A lot of the dependencies are very out of date. For example Svelte needs to be upgraded from
  version 3 to 5, which will of course necessitate a lot of frontend code rewrites.

I don't know the best order to undertake these three goals. You can use your judgment about what
order would be easiest, simplest, and involve the least wasted work.

# NEXT PRIORITIES

- Mayhem Manager wastes too muh effort "making invalid states unrepresentable". It should be
  organized more relationally with arrays for fighters, equipments, teams, seasons, bracket
  matchups. It doesn't have to be wholly structured like a SQL database, some nesting is ok, but
  what I'm getting at is, it would be easier to update keys instead of moving things from list to
  list all the time.
- Auction Tic-Tac-Toe needs local mu
- Mayhem Manager import/export should be made to actually work and be part of the UI and testing.

## LOWER PRIORITIES: MAYHEM MANAGER

- Add links from each page to the page above it in the hierarchy
- Make the MM UI/UX nicer
- Make more interesting equipment for MM
- Rebalance fighter progression in MM [more of a game design task than a programming task]
- Add a mobile UI for ATTT
- Fix the bug in Daily Q-less where it sometimes doesn't recognize you won if your solution
  touches the top of the grid
- Fix the bug in the symmetry badge for Daily Q-less
- Add a money tiebreaker option to ATTT
- Add a bot to play against to ATTT
- Add a global persistent MM league system that you can have a team in after authenticating with
  a damiensnyder.com account
- Add link to real Q-less game in Q-less instructions