<script lang="ts">
  import { page } from "$app/stores";
  
  const absoluteUrl = $page.url.toString();
  
  function copyInviteLink() {
    navigator.clipboard.writeText(absoluteUrl);
  }
</script>

<h3>Invite a friend</h3>
<input value={absoluteUrl} readonly />
<button class="big-button" on:click={copyInviteLink}>COPY</button>