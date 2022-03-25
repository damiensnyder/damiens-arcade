<script lang="ts">
  import { page } from "$app/stores";
  
  const absoluteUrl = $page.url.toString();
  
  function copyInviteLink() {
    navigator.clipboard.writeText(absoluteUrl);
  }
</script>

<p>Invite a friend:</p>
<input value={absoluteUrl} readonly />
<button on:click={copyInviteLink}>Copy</button>