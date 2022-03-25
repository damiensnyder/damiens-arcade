<script lang="ts">

export let gamestate: any;
export let socketCallback: (action) => void;

const clientSideGamestate = gamestate;

function actionCallback(action) {
  socketCallback(action);

  if (action.type === "nominate") {
    // figure it out later
  } else if (action.type === "bid") {
    // figure it out later
  } else if (action.type === "pass") {
    // figure it out later
  } else if (action.type === "join") {
    // figure it out later
  } else if (action.type === "leave") {
    // figure it out later
  } else if (action.type === "editSettings") {
    // figure it out later
  }
}
</script>