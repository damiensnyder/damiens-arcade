<script lang="ts">
  import { page } from "$app/stores";
  
  const absoluteUrl = $page.url.toString();
  
  function copyInviteLink() {
    navigator.clipboard.writeText(absoluteUrl);
  }
</script>

<h3>Invite a friend</h3>
<input value={absoluteUrl} readonly />
<button on:click={copyInviteLink}>Copy</button>